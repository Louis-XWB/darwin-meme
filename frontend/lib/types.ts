export interface Genome {
  risk_appetite: number;
  entry_threshold: number;
  exit_threshold: number;
  position_size: number;
  max_holdings: number;
  graduation_bias: number;
  creation_frequency: number;
  theme_vector: number[];
  naming_style: number;
  hype_intensity: number;
  follow_leader: number;
  contrarian: number;
  herd_sensitivity: number;
  cooperation: number;
  experiment_rate: number;
  adaptation_speed: number;
  memory_weight: number;
  exploration_vs_exploit: number;
}

export interface AgentAction {
  type: "create" | "buy" | "sell" | "hold" | "experiment";
  token_id?: string;
  token_name?: string;
  token_theme?: string;
  amount: number;
  cost: number;
  reasoning: string;
  hypothesis?: string;
}

export interface AgentData {
  agent_id: string;
  name: string;
  genome: Genome;
  balance: number;
  generation: number;
  parent_ids: string[];
  holdings: Record<string, number>;
  created_tokens: string[];
  action_history: { tick: number; action: AgentAction }[];
  strategy_notes: string[];
  alive: boolean;
}

export interface TokenData {
  token_id: string;
  name: string;
  theme: string;
  creator_id: string;
  state: "active" | "graduated" | "dead";
  supply_sold: number;
  total_raised: number;
  current_price: number;
  bonding_progress: number;
  holders: Record<string, number>;
  holder_count: number;
  recent_volume: number;
}

export interface TradeData {
  agent_name: string;
  agent_id: string;
  type: string;
  token_id?: string;
  token_name?: string;
  amount: number;
  cost: number;
  reasoning: string;
}

export interface EventData {
  type: "whale" | "fud" | "viral" | "crisis" | "narrative";
  target_token_id?: string;
  target_theme?: string;
  magnitude: number;
}

export interface TickPayload {
  generation: number;
  tick: number;
  market: {
    tokens: TokenData[];
    recent_trades: TradeData[];
    recent_events: EventData[];
  };
  agents: AgentData[];
  trades: TradeData[];
  events: EventData[];
  commentary: string;
}

export interface GenerationStats {
  generation: number;
  best_fitness: number;
  avg_fitness: number;
  worst_fitness: number;
  fitness_scores: Record<string, number>;
}

export interface GenerationEndPayload {
  generation: number;
  stats: GenerationStats;
  summary: string;
  all_stats: GenerationStats[];
  agents: AgentData[];
}

export interface SimulationState {
  connected: boolean;
  running: boolean;
  generation: number;
  tick: number;
  agents: AgentData[];
  tokens: TokenData[];
  trades: TradeData[];
  events: EventData[];
  commentary: string[];
  allStats: GenerationStats[];
  summaries: string[];
  speed: number;
}
