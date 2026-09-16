#!/usr/bin/env python3
"""ReferralRail release preflight.

Static checks are always available. --submission additionally requires real live
artifacts generated after deployment; it never manufactures evidence.
"""
from __future__ import annotations
import argparse, ast, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_RPC = "https://studio-dev.genlayer.com/api"
EXPECTED_CHAIN = 61997
ADDR = re.compile(r"^0x[a-fA-F0-9]{40}$")
HASH = re.compile(r"^0x[a-fA-F0-9]{64}$")


def ok(label: str): print(f"[ok] {label}")
def fail(label: str): print(f"[FAIL] {label}"); return False


def main() -> int:
    parser=argparse.ArgumentParser()
    parser.add_argument("--submission", action="store_true")
    parser.add_argument("--skip-tests", action="store_true")
    args=parser.parse_args()
    good=True

    contracts=sorted((ROOT/"contracts").glob("*.py"))
    good &= len(contracts)==2
    (ok if len(contracts)==2 else fail)("exactly two contract files")
    for p in contracts:
        try: ast.parse(p.read_text()); ok(f"Python syntax {p.name}")
        except SyntaxError as e: fail(f"Python syntax {p.name}: {e}"); good=False

    package=json.loads((ROOT/"frontend/package.json").read_text())
    deps=package["dependencies"]
    required={
        "@genlayer/transaction-kit":"0.1.0-rc.2",
        "@genlayer/transaction-kit-react":"0.1.0-rc.2",
        "genlayer-js":"2.0.0-rc.1",
    }
    for name,version in required.items():
        match=deps.get(name)==version
        good &= match
        (ok if match else fail)(f"{name} pinned to {version}")

    net=(ROOT/"frontend/lib/genlayer/network.ts").read_text()
    for marker in (str(EXPECTED_CHAIN), EXPECTED_RPC, "https://explorer-studio-dev.genlayer.com"):
        match=marker in net; good &= match; (ok if match else fail)(f"network marker {marker}")

    settle=(ROOT/"contracts/referral_rail.py").read_text()
    judge=(ROOT/"contracts/outcome_judge.py").read_text()
    static_markers=[
        ("candidate explicit acceptance", "def accept_referral" in settle),
        ("inconclusive recovery", "def retry_inconclusive" in settle and "def recover" in settle),
        ("finalized judge message", 'emit(on="finalized").evaluate' in settle),
        ("finalized judgment with pull resolution", 'emit(on="finalized").evaluate' in settle and "def resolve_judgment" in settle),
        ("substantive validator rerun", "independent = evaluate_once" in judge and "run_nondet(" in judge),
        ("source restriction", "https://api.github.com/repos/" in judge),
    ]
    for label,match in static_markers:
        good &= match; (ok if match else fail)(label)

    if not args.skip_tests:
        result=subprocess.run([sys.executable,"-m","pytest","-q"], cwd=ROOT)
        if result.returncode: good=False; fail("pytest")
        else: ok("pytest")

    manifest=ROOT/"deployment/61997.json"
    evidence=ROOT/"deployment/live-evidence.json"
    if manifest.exists():
        try:
            data=json.loads(manifest.read_text())
            checks=[
                data.get("chainId")==EXPECTED_CHAIN,
                data.get("rpc")==EXPECTED_RPC,
                ADDR.match(str((data.get("referralRail") or {}).get("address",""))) is not None,
                ADDR.match(str((data.get("outcomeJudge") or {}).get("address",""))) is not None,
            ]
            if all(checks): ok("deployment manifest shape")
            else: fail("deployment manifest shape"); good=False
        except Exception as exc: fail(f"deployment manifest parse: {exc}"); good=False
    elif args.submission:
        fail("deployment/61997.json missing"); good=False

    if evidence.exists():
        try:
            data=json.loads(evidence.read_text())
            txs=data.get("transactions",[])
            if not isinstance(txs, list) or not txs:
                txs=[]
                for case in data.get("cases",[]):
                    txs.extend((case.get("transactions") or {}).values())
            if txs and all(HASH.match(str(t.get("hash",""))) for t in txs): ok("live evidence transaction hashes")
            else: fail("live evidence transaction hashes"); good=False
        except Exception as exc: fail(f"live evidence parse: {exc}"); good=False
    elif args.submission:
        fail("deployment/live-evidence.json missing"); good=False

    print("\nReferralRail preflight:", "PASS" if good else "BLOCKED")
    return 0 if good else 1

if __name__=="__main__": raise SystemExit(main())
