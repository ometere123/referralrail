"""Write evidence from the two verified live Studio lifecycle runs."""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from genlayer_py import create_account
from genlayer_py.chains import studio_devnet
from genlayer_py.client import create_client

ROOT = Path(__file__).resolve().parents[1]
RPC = "https://studio-dev.genlayer.com/api"
RAIL = "0x935A6fD995b4db5d64E1139D57a37a3f73BE2Ef8"
JUDGE = "0x7842393CeEAB5F053B3024673B5986fDdb95A4C9"


def read_retry(fn):
    for attempt in range(60):
        try:
            return fn()
        except Exception as exc:
            message = str(exc)
            if not any(
                marker in message
                for marker in (
                    "Server busy",
                    "Rate limit exceeded",
                    "unreachable host",
                    "Max retries exceeded",
                    "Request to",
                )
            ):
                raise
            time.sleep(15 if "Rate limit" in message else 5)
    return fn()


def tx_summary(client, tx_hash: str) -> dict:
    tx = read_retry(lambda: client.get_transaction(tx_hash))
    return {
        "hash": tx_hash,
        "lifecycle": tx.get("lifecycle"),
        "result": tx.get("result_name"),
        "execution": tx.get("txExecutionResultName"),
        "children": tx.get("triggered_transactions", []),
    }


def case(client, oid: int, repo: str, pr: int, expected: str, hashes: dict[str, str]) -> dict:
    state = read_retry(lambda: client.read_contract(RAIL, "get_opportunity", args=[oid]))
    judgment = read_retry(lambda: client.read_contract(JUDGE, "get_judgment", args=[oid, 1]))
    if state["state"] != expected or not judgment:
        raise RuntimeError(f"verified case {oid} is not terminal: {state['state']}")
    return {
        "opportunity_id": oid,
        "repo": repo,
        "pr": pr,
        "expected_state": expected,
        "transactions": {name: tx_summary(client, value) for name, value in hashes.items()},
        "judgment": judgment,
        "settled_opportunity": state,
    }


def main() -> None:
    key = os.environ.get("STUDIO_NEXT_PRIVATE_KEY")
    if not key:
        raise RuntimeError("STUDIO_NEXT_PRIVATE_KEY is required")
    client = create_client(
        chain=studio_devnet,
        endpoint=RPC,
        account=create_account(account_private_key=key),
    )
    evidence = {
        "network": "Studio Next / Studionet Dev",
        "chainId": 61997,
        "rpc": RPC,
        "contracts": {"referralRail": RAIL, "outcomeJudge": JUDGE},
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "cases": [
            case(
                client,
                3,
                "ometere123/evifix",
                1,
                "PAID",
                {
                    "create": "0x8f73fbf7361b61c3a0f540d4c1a769ea9f32a5db43d808f5788989db30061fc1",
                    "referral": "0xf35eeff4d509d9052b1f16683f5efc3e4029e1349e04c45d688b2bb10b29f10a",
                    "acceptance": "0xd50ad11912cdfe4018b9dcf08c09a534f34d2e5651f76bd196b9828b5b10bae7",
                    "submission": "0x02b800c1417d96a41a694354c9f78e06f5311a10a32cd56bca2aaf457386b6f0",
                    "resolution": "0x8cbcbc5a5457cc272231dccacf61756ddd939a3d3b7c6cfbfc8f6c3cd83b16b2",
                    "settlement": "0x58783737a76741f570b1e3ffc31002caebfab9f64fff1bee017407eef303621c",
                },
            ),
            case(
                client,
                2,
                "ometere123/thedadsbot",
                13,
                "REFUNDED",
                {
                    "create": "0xe18e4b6fea202125ae3813cdc4edd87ff3da1997de32c24a36e0e07de088a903",
                    "referral": "0x812f957061ebf992c9fa52bf46c660c98786a0b2c14f3cf8b0984c89b1b273bf",
                    "acceptance": "0x3a7f1746bacb4168e0ba3efbf5139194a03c1cb77dbf726f069fffe1846b97a0",
                    "submission": "0x6b7c339957a370f89c94851685b71728f4fa7e5c6ed6281b5961b49e56135e8d",
                    "resolution": "0xe9d43341234868e86be44b7fa43972295b6ba2f3581ede478e933210983010df",
                    "settlement": "0x2d33d7fd5524086febd5ba49c3d22cc34bb0ab4219de9e074ace8d3c57b195f1",
                },
            ),
        ],
    }
    target = ROOT / "deployment" / "live-evidence.json"
    target.write_text(json.dumps(evidence, indent=2, default=str) + "\n")
    print(json.dumps({"written": str(target), "states": [c["settled_opportunity"]["state"] for c in evidence["cases"]]}, indent=2))


if __name__ == "__main__":
    main()
