from __future__ import annotations

import json
import sqlite3
from pathlib import Path


class Store:
    def __init__(self, db_path: str = "darwin_meme.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self) -> None:
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS generations (
                generation INTEGER PRIMARY KEY,
                stats_json TEXT NOT NULL,
                population_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS tick_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                generation INTEGER NOT NULL,
                tick INTEGER NOT NULL,
                trades_json TEXT NOT NULL,
                events_json TEXT NOT NULL,
                commentary TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS epoch_summaries (
                generation INTEGER PRIMARY KEY,
                summary TEXT NOT NULL,
                stats_json TEXT NOT NULL
            );
        """)
        self.conn.commit()

    def save_generation(
        self, generation: int, stats: dict, population: list[dict],
    ) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO generations (generation, stats_json, population_json) VALUES (?, ?, ?)",
            (generation, json.dumps(stats), json.dumps(population)),
        )
        self.conn.commit()

    def save_tick(
        self,
        generation: int,
        tick: int,
        trades: list[dict],
        events: list[dict],
        commentary: str = "",
    ) -> None:
        self.conn.execute(
            "INSERT INTO tick_events (generation, tick, trades_json, events_json, commentary) VALUES (?, ?, ?, ?, ?)",
            (generation, tick, json.dumps(trades), json.dumps(events), commentary),
        )
        self.conn.commit()

    def save_epoch_summary(
        self, generation: int, summary: str, stats: dict,
    ) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO epoch_summaries (generation, summary, stats_json) VALUES (?, ?, ?)",
            (generation, summary, json.dumps(stats)),
        )
        self.conn.commit()

    def get_generation(self, generation: int) -> dict | None:
        row = self.conn.execute(
            "SELECT * FROM generations WHERE generation = ?", (generation,),
        ).fetchone()
        if not row:
            return None
        return {
            "generation": row["generation"],
            "stats": json.loads(row["stats_json"]),
            "population": json.loads(row["population_json"]),
        }

    def get_all_stats(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT generation, stats_json FROM generations ORDER BY generation",
        ).fetchall()
        return [
            {"generation": r["generation"], **json.loads(r["stats_json"])}
            for r in rows
        ]

    def get_epoch_summaries(self) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM epoch_summaries ORDER BY generation",
        ).fetchall()
        return [
            {"generation": r["generation"], "summary": r["summary"],
             "stats": json.loads(r["stats_json"])}
            for r in rows
        ]

    def close(self) -> None:
        self.conn.close()
