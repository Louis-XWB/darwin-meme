from __future__ import annotations

import asyncio
import json
import os

import openai
import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agent.agent import Action, Agent, ActionType
from agent.decision import build_decision_prompt, build_system_prompt, parse_action_response
from agent.experiment import ExperimentTracker
from commentator.narrator import (
    build_epoch_summary_prompt,
    build_tick_prompt,
    parse_commentary,
)
from config import SimConfig, CONFIG as DEFAULT_CONFIG

current_config = DEFAULT_CONFIG
from data.store import Store
from evolution.engine import EvolutionEngine
from market.simulator import MarketSimulator

app = FastAPI(title="Darwin.meme API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Global state
client: openai.AsyncOpenAI | None = None
store: Store | None = None
sim_task: asyncio.Task | None = None
sim_running = False
sim_speed = 1.0


def get_client() -> openai.AsyncOpenAI:
    global client
    if client is None:
        client = openai.AsyncOpenAI(
            api_key=os.environ.get("OPENAI_API_KEY", ""),
            base_url=os.environ.get("OPENAI_BASE_URL", None),
        )
    return client


def get_store() -> Store:
    global store
    if store is None:
        store = Store()
    return store


async def llm_decide(agent: Agent, market_state: dict, tick: int) -> str:
    c = get_client()
    system = build_system_prompt(agent)
    user = build_decision_prompt(agent, market_state, tick)
    try:
        response = await c.chat.completions.create(
            model=current_config.llm_model,
            max_tokens=300,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return response.choices[0].message.content or '{"action": "hold"}'
    except Exception as e:
        return json.dumps({"action": "hold", "reasoning": f"LLM error: {e}"})


async def llm_comment(prompt: str) -> str:
    c = get_client()
    try:
        response = await c.chat.completions.create(
            model=current_config.llm_model,
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return parse_commentary(response.choices[0].message.content or "")
    except Exception:
        return ""


async def run_tick(
    agents: list[Agent],
    market: MarketSimulator,
    tick: int,
    generation: int,
    experiment_trackers: dict[str, ExperimentTracker],
) -> list[dict]:
    market_state = market.get_market_state()
    tick_trades: list[dict] = []

    # Bootstrap: if no tokens exist in early ticks, force first few agents to create
    import random as _rng
    MEME_NAMES = [
        "DOGGO", "MOONCAT", "PEPE2.0", "ELONMARS", "WOJAK", "SHIBKING",
        "BOBO", "CHAD", "COPIUM", "FROGGY", "LAMBO", "NGMI",
        "WAGMI", "DEGEN", "APECOIN", "BONK2", "FLOKI2", "NYAN",
    ]
    MEME_THEMES = ["animal", "crypto", "humor", "popculture", "absurd", "tech", "food", "politics"]
    if tick < 5 and len(market.active_tokens()) < 3:
        # Force some agents to create tokens
        creators = agents[:min(3 - len(market.active_tokens()), len(agents))]
        for creator in creators:
            name = _rng.choice(MEME_NAMES)
            theme = _rng.choice(MEME_THEMES)
            token = market.create_token(creator=creator, name=name, theme=theme, tick=tick)
            action = Action(type=ActionType.CREATE, token_id=token.token_id, token_name=name, token_theme=theme, reasoning="bootstrap")
            creator.record_action(action, tick)
            tick_trades.append({"agent_name": creator.name, "agent_id": creator.agent_id, **action.to_dict()})
        # Refresh market state after bootstrap
        market_state = market.get_market_state()

    decisions = await asyncio.gather(*[
        llm_decide(agent, market_state, tick) for agent in agents
    ])

    for agent, raw_response in zip(agents, decisions):
        action = parse_action_response(raw_response)

        try:
            if action.type == ActionType.CREATE and action.token_name:
                theme = action.token_theme or "absurd"
                token = market.create_token(
                    creator=agent, name=action.token_name, theme=theme, tick=tick,
                )
                action.token_id = token.token_id

            elif action.type == ActionType.BUY and action.token_id and action.amount > 0:
                if action.token_id in market.tokens:
                    cost = market.buy(
                        buyer=agent, token_id=action.token_id,
                        amount=action.amount, tick=tick,
                    )
                    action.cost = cost

            elif action.type == ActionType.SELL and action.token_id and action.amount > 0:
                if action.token_id in market.tokens and action.token_id in agent.holdings:
                    held = agent.holdings[action.token_id]
                    sell_amount = min(action.amount, held)
                    ret = market.sell(
                        seller=agent, token_id=action.token_id,
                        amount=sell_amount, tick=tick,
                    )
                    action.cost = ret

            elif action.type == ActionType.EXPERIMENT and action.hypothesis:
                tracker = experiment_trackers.setdefault(
                    agent.agent_id, ExperimentTracker(),
                )
                tracker.add_hypothesis(action.hypothesis)

        except (ValueError, KeyError):
            action = parse_action_response('{"action": "hold", "reasoning": "execution error"}')

        agent.record_action(action, tick)
        if action.type != ActionType.HOLD:
            tick_trades.append({
                "agent_name": agent.name,
                "agent_id": agent.agent_id,
                **action.to_dict(),
            })

    events = market.tick(tick)

    commentary = ""
    if tick % 5 == 0 and tick_trades:
        prompt = build_tick_prompt(
            tick=tick,
            trades=tick_trades,
            events=[e.to_dict() for e in events],
            generation=generation,
        )
        commentary = await llm_comment(prompt)

    get_store().save_tick(
        generation=generation,
        tick=tick,
        trades=tick_trades,
        events=[e.to_dict() for e in events],
        commentary=commentary,
    )

    await sio.emit("tick", {
        "generation": generation,
        "tick": tick,
        "market": market.get_market_state(),
        "agents": [a.to_dict() for a in agents],
        "trades": tick_trades,
        "events": [e.to_dict() for e in events],
        "commentary": commentary,
    })

    return tick_trades


async def run_simulation():
    global sim_running
    sim_running = True

    evo = EvolutionEngine(CONFIG)
    population = evo.init_population()
    all_gen_stats: list[dict] = []

    await sio.emit("sim_started", {"population_size": current_config.population_size})

    try:
        for gen in range(current_config.max_generations):
            if not sim_running:
                break

            market = MarketSimulator(CONFIG)
            experiment_trackers: dict[str, ExperimentTracker] = {}

            await sio.emit("generation_start", {
                "generation": gen,
                "agents": [a.to_dict() for a in population],
            })

            for tick in range(current_config.ticks_per_epoch):
                if not sim_running:
                    break
                await run_tick(population, market, tick, gen, experiment_trackers)
                await asyncio.sleep(sim_speed)

            for agent in population:
                tracker = experiment_trackers.get(agent.agent_id)
                if tracker:
                    for i, h in enumerate(tracker.hypotheses):
                        if h["result"] is None:
                            success = agent.roi(market.token_prices()) > 0
                            tracker.record_result(i, success=success, note=f"ROI={agent.roi(market.token_prices()):.2%}")
                    tracker.apply_to_agent(agent)

            graduated = {
                tid: (t.state.value == "graduated")
                for tid, t in market.tokens.items()
            }

            population, stats = evo.evolve(
                population, market.token_prices(), graduated,
            )
            all_gen_stats.append(stats)

            top_agents = sorted(
                population, key=lambda a: stats["fitness_scores"].get(a.agent_id, 0),
                reverse=True,
            )[:3]
            summary_prompt = build_epoch_summary_prompt(
                stats=stats,
                top_agents=[a.to_dict() for a in top_agents],
                graduated_count=sum(1 for v in graduated.values() if v),
                dead_count=sum(1 for t in market.tokens.values() if t.state.value == "dead"),
            )
            summary = await llm_comment(summary_prompt)

            s = get_store()
            s.save_generation(gen, stats, [a.to_dict() for a in population])
            s.save_epoch_summary(gen, summary, stats)

            await sio.emit("generation_end", {
                "generation": gen,
                "stats": stats,
                "summary": summary,
                "all_stats": all_gen_stats,
                "agents": [a.to_dict() for a in population],
            })

    finally:
        sim_running = False
        await sio.emit("sim_stopped", {})


@app.get("/api/four-meme/tokens")
async def four_meme_tokens():
    from integrations.bitquery import query_four_meme_tokens
    tokens = await query_four_meme_tokens(limit=20)
    return {"tokens": tokens}


@app.get("/api/health")
async def health():
    return {"status": "ok", "sim_running": sim_running}


@app.get("/api/history")
async def history():
    s = get_store()
    return {
        "stats": s.get_all_stats(),
        "summaries": s.get_epoch_summaries(),
    }


@sio.event
async def connect(sid, environ):
    await sio.emit("connected", {"sid": sid}, room=sid)


@sio.event
async def start_simulation(sid, data):
    global sim_task, sim_speed
    if sim_running:
        await sio.emit("error", {"message": "Simulation already running"}, room=sid)
        return
    sim_speed = data.get("speed", 1.0)
    sim_task = asyncio.create_task(run_simulation())


@sio.event
async def stop_simulation(sid, data):
    global sim_running
    sim_running = False


@sio.event
async def set_speed(sid, data):
    global sim_speed
    sim_speed = max(0.01, data.get("speed", 1.0))


@sio.event
async def update_settings(sid, data):
    global current_config
    current_config = SimConfig(
        population_size=int(data.get("population_size", current_config.population_size)),
        ticks_per_epoch=int(data.get("ticks_per_epoch", current_config.ticks_per_epoch)),
        max_generations=int(data.get("max_generations", current_config.max_generations)),
        mutation_rate=float(data.get("mutation_rate", current_config.mutation_rate)),
        llm_model=str(data.get("llm_model", current_config.llm_model)),
    )
    await sio.emit("settings_updated", data, room=sid)


def main():
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
