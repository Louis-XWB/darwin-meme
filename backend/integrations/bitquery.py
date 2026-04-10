from __future__ import annotations

import os
from typing import Any

import httpx

BITQUERY_URL = "https://streaming.bitquery.io/graphql"


async def query_four_meme_tokens(limit: int = 10) -> list[dict[str, Any]]:
    """Fetch recent Four.meme token launches from Bitquery."""
    api_key = os.environ.get("BITQUERY_API_KEY")
    if not api_key:
        return []

    query = """
    {
      EVM(dataset: realtime, network: bsc) {
        DEXTradeByTokens(
          where: {
            Trade: {
              Dex: {
                SmartContract: {
                  is: "0x5c952063c7fc8610ffdb798152d69f0b9550762b"
                }
              }
            }
          }
          limit: {count: %d}
          orderBy: {descending: Block_Time}
        ) {
          Trade {
            Currency {
              Name
              Symbol
              SmartContract
            }
            Amount
            Price
          }
          Block {
            Time
          }
        }
      }
    }
    """ % limit

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                BITQUERY_URL,
                json={"query": query},
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", {}).get("EVM", {}).get("DEXTradeByTokens", [])
        except Exception:
            return []
