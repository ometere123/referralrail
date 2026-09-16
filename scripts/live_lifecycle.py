"""Run real three-wallet Studio Next lifecycle evidence.

This script uses only public GitHub PRs and writes evidence after each required
finalized readback succeeds. It never treats a transaction hash alone as success.
"""
from __future__ import annotations

import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

from genlayer_py import create_account
from genlayer_py.transactions.fees import (
    MESSAGE_ALLOCATION_ROOT_PARENT_INDEX,
    derive_external_message_call_key,
    encode_external_message_fee_params,
)
from gltest import get_contract_factory, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.types import ProtocolTransactionStatus

ROOT = Path(__file__).resolve().parents[1]
DEPLOYMENT = json.loads((ROOT / "deployment" / "61997.json").read_text())
RAIL_ADDRESS = DEPLOYMENT["referralRail"]["address"]
JUDGE_ADDRESS = DEPLOYMENT["outcomeJudge"]["address"]
GEN = 10**18
FUNDING = 12 * GEN


def account(name: str):
    key = os.environ.get(name, "")
    if not key:
        raise RuntimeError(f"missing {name}")
    return create_account(account_private_key=key)


def fees(client):
    estimate = client.estimate_transaction_fees()
    return {k: estimate[k] for k in ("distribution", "feeValue") if k in estimate}


def write_fees(contract, method: str, args: list, actor, client, value: int):
    """Simulate the concrete write so Studio discovers emitted allocations."""
    if method == "resolve_judgment":
        estimate = client.estimate_transaction_fees()
        return {k: estimate[k] for k in ("distribution", "feeValue") if k in estimate}

    if method == "settle_opportunity":
        opportunity = retry_read(
            lambda: contract.get_opportunity(args=[int(args[0])]).call()
        )
        if opportunity["state"] == "PAID":
            recipients = (opportunity["candidate"], opportunity["referrer"])
        elif opportunity["state"] == "REFUNDED":
            recipients = (opportunity["employer"],)
        else:
            raise RuntimeError("settlement fee quote requires a terminal opportunity")
        budget = 120 * 10**15
        params = encode_external_message_fee_params(
            {"gasLimit": 500_000, "maxGasPrice": 300_000_000}
        )
        allocations = [
            {
                "messageType": 0,
                "onAcceptance": False,
                "parentIndex": MESSAGE_ALLOCATION_ROOT_PARENT_INDEX,
                "recipient": recipient,
                "callKey": derive_external_message_call_key(),
                "budget": budget,
                "feeParams": params,
            }
            for recipient in recipients
        ]
        estimate = client.estimate_transaction_fees(
            {
                "leaderTimeunitsAllocation": 100,
                "validatorTimeunitsAllocation": 200,
                "rotations": [3],
                "totalMessageFees": budget * len(allocations),
                "messageAllocations": allocations,
            }
        )
        return {
            "distribution": estimate["distribution"],
            "feeValue": estimate["feeValue"],
            "messageAllocations": estimate["messageAllocations"],
        }

    estimate = client.estimate_transaction_fees_for_write(
        address=contract.address,
        function_name=method,
        account=actor,
        args=args,
        value=value,
    )
    result = {k: estimate[k] for k in ("distribution", "feeValue") if k in estimate}
    if "messageAllocations" in estimate:
        allocations = [dict(item) for item in estimate["messageAllocations"]]
        result["messageAllocations"] = allocations
    return result


def tx_hash(receipt):
    for key in ("transaction_hash", "tx_hash", "hash"):
        if receipt.get(key):
            return str(receipt[key])
    return ""


def require_success(receipt, label: str):
    if not tx_execution_succeeded(receipt):
        raise RuntimeError(f"{label} failed: {json.dumps(receipt, default=str)[:1800]}")
    return {"hash": tx_hash(receipt), "receipt": receipt}


def finalize_and_wait(client, transaction_hash: str):
    env = os.environ.copy()
    subprocess.run(
        ["node", str(ROOT / "scripts" / "finalize-live.mjs"), transaction_hash],
        check=True,
        env=env,
    )
    return client.wait_for_transaction_receipt(
        transaction_hash,
        wait_until="finalized",
        full_transaction=True,
    )


def finalize_trigger_tree(client, transaction_hash: str, seen: set[str] | None = None):
    """Finalize every descendant message, including the judge callback."""
    seen = seen or set()
    if transaction_hash in seen:
        return
    seen.add(transaction_hash)
    children = []
    for _ in range(36):
        children = client.get_triggered_transaction_ids(transaction_hash)
        if children:
            break
        time.sleep(10)
    for child_hash in children:
        finalize_and_wait(client, str(child_hash))
        finalize_trigger_tree(client, str(child_hash), seen)


def send(contract, method: str, args: list, actor, client, value: int = 0, triggered: bool = False):
    wait_status = ProtocolTransactionStatus.ACCEPTED if triggered else ProtocolTransactionStatus.FINALIZED
    receipt = contract.connect(actor).__getattribute__(method)(args=args).transact(
        value=value,
        fees=write_fees(contract, method, args, actor, client, value),
        wait_transaction_status=wait_status,
        wait_triggered_transactions=False,
    )
    print(json.dumps({"method": method, "hash": tx_hash(receipt), "triggered": triggered}), flush=True)
    if triggered:
        submitted_hash = tx_hash(receipt)
        receipt = finalize_and_wait(client, submitted_hash)
        finalize_trigger_tree(client, submitted_hash)
    return require_success(receipt, method)


def assert_state(rail, oid: int, expected: str):
    state = retry_read(lambda: rail.get_opportunity(args=[oid]).call())
    if state["state"] != expected:
        raise RuntimeError(f"opportunity {oid} expected {expected}, got {state['state']}")
    return state


def retry_read(read_fn):
    """Retry only Studio's transient execution-slot saturation."""
    for _ in range(18):
        try:
            return read_fn()
        except Exception as exc:
            if "Server busy" not in str(exc):
                raise
            time.sleep(5)
    return read_fn()


def wait_for_judgment(client, opportunity_id: int, attempt_id: int) -> dict:
    """Wait until the finalized judge child has stored its result."""
    for _ in range(72):
        judgment = retry_read(
            lambda: client.read_contract(
                JUDGE_ADDRESS,
                "get_judgment",
                args=[opportunity_id, attempt_id],
            )
        )
        if isinstance(judgment, dict) and judgment:
            return judgment
        time.sleep(10)
    raise RuntimeError(
        f"judge result for opportunity {opportunity_id} attempt {attempt_id} was not finalized"
    )


def run_case(rail, client, employer, referrer, candidate, repo_owner, repo_name, pr_number, label, candidate_login):
    base = f"Real {label} case for {repo_owner}/{repo_name} PR #{pr_number}."
    criteria = (
        "The submitted pull request must be publicly readable and merged into the repository. "
        "The candidate identity must match the pull request author. The changed files must "
        "contain a substantive implementation and its tests or documentation must explain the change."
    )
    create = send(
        rail, "create_opportunity", [
            f"Live {label} verification",
            base + " This is a real Studio Next evidence run using the public repository and PR listed here.",
            criteria,
            repo_owner,
            repo_name,
            candidate.address,
            2 * GEN,
            1 * GEN,
            24 * 3600,
            168 * 3600,
        ], employer, client, value=3 * GEN,
    )
    opportunities = rail.list_opportunities(args=[0, 100]).call()
    oid = max(int(x["id"]) for x in opportunities)
    open_state = assert_state(rail, oid, "OPEN")

    referral = send(rail, "create_referral", [oid, candidate.address], referrer, client)
    referred_state = assert_state(rail, oid, "REFERRED")
    accepted = send(rail, "accept_referral", [oid, candidate_login], candidate, client)
    accepted_state = assert_state(rail, oid, "ACCEPTED")
    submitted = send(rail, "submit_work", [oid, pr_number], candidate, client, triggered=True)
    judgment = wait_for_judgment(client, oid, 1)
    resolved = send(rail, "resolve_judgment", [oid, 1], employer, client)
    settlement = send(rail, "settle_opportunity", [oid], employer, client, triggered=True)
    expected_state = "PAID" if label == "success" else "REFUNDED"
    judged_state = assert_state(rail, oid, expected_state)
    accounting = rail.get_accounting(args=[]).call()
    return {
        "label": label,
        "repo": f"{repo_owner}/{repo_name}",
        "pr": pr_number,
        "candidate_login": candidate_login,
        "opportunity_id": oid,
        "transactions": {"create": create, "referral": referral, "acceptance": accepted, "submission": submitted, "resolution": resolved, "settlement": settlement},
        "readbacks": {"open": open_state, "referred": referred_state, "accepted": accepted_state, "judgment": judgment, "settled": judged_state, "accounting": accounting},
    }


def main():
    employer = account("STUDIO_NEXT_EMPLOYER_PRIVATE_KEY")
    referrer = account("STUDIO_NEXT_REFERRER_PRIVATE_KEY")
    candidate = account("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY")
    if len({employer.address, referrer.address, candidate.address}) != 3:
        raise RuntimeError("employer, referrer and candidate wallets must be distinct")

    client = get_gl_client()
    if os.environ.get("RUN_LIVE_FAUCET") == "1":
        for actor in (employer, referrer, candidate):
            try:
                client.fund_account(actor.address, FUNDING)
            except Exception as exc:
                print(f"faucet skipped for {actor.address}: {exc}")

    factory = get_contract_factory(contract_file_path=Path("referral_rail.py"))
    rail = factory.build_contract(contract_address=RAIL_ADDRESS, account=employer)
    config = rail.get_protocol_config(args=[]).call()
    if config["judge_address"].lower() != JUDGE_ADDRESS.lower():
        raise RuntimeError("deployed judge binding does not match deployment manifest")

    success = run_case(rail, client, employer, referrer, candidate, "ometere123", "evifix", 1, "success", "ometere123")
    negative = run_case(rail, client, employer, referrer, candidate, "ometere123", "thedadsbot", 13, "negative", "ometere123")
    if negative["readbacks"]["settled"]["state"] != "REFUNDED":
        raise RuntimeError(f"negative case did not refund or close: {negative['readbacks']['settled']}")

    evidence = {
        "network": "Studio Next / Studionet Dev",
        "chainId": 61997,
        "rpc": "https://studio-dev.genlayer.com/api",
        "contracts": {"referralRail": RAIL_ADDRESS, "outcomeJudge": JUDGE_ADDRESS},
        "wallets": {"employer": employer.address, "referrer": referrer.address, "candidate": candidate.address},
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "cases": [success, negative],
    }
    target = ROOT / "deployment" / "live-evidence.json"
    target.write_text(json.dumps(evidence, indent=2, default=str) + "\n")
    print(json.dumps({"written": str(target), "cases": [{"label": c["label"], "opportunity_id": c["opportunity_id"], "state": c["readbacks"]["settled"]["state"]} for c in (success, negative)]}, indent=2))


if __name__ == "__main__":
    main()
