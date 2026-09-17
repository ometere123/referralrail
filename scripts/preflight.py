#!/usr/bin/env python3
"""ReferralRail release preflight with explicit frozen v1 and v2 inventories."""
from __future__ import annotations
import argparse, ast, json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; EXPECTED_RPC="https://studio-dev.genlayer.com/api"; EXPECTED_CHAIN=61997
ADDR=re.compile(r"^0x[a-fA-F0-9]{40}$"); HASH=re.compile(r"^0x[a-fA-F0-9]{64}$")
def ok(label): print(f"[ok] {label}")
def fail(label): print(f"[FAIL] {label}"); return False

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--submission",action="store_true"); parser.add_argument("--skip-tests",action="store_true"); args=parser.parse_args(); good=True
    expected={"referral_rail.py","outcome_judge.py","referral_rail_v2.py","outcome_judge_v2.py","referral_identity_v2.py"}; files=sorted((ROOT/"contracts").glob("*.py")); names={p.name for p in files}; good &= names==expected; (ok if names==expected else fail)("frozen v1 plus explicit v2 contract files")
    for p in files:
        try: ast.parse(p.read_text()); ok(f"Python syntax {p.name}")
        except SyntaxError as e: fail(f"Python syntax {p.name}: {e}"); good=False
    deps=json.loads((ROOT/"frontend/package.json").read_text())["dependencies"]
    for n,v in {"@genlayer/transaction-kit":"0.1.0-rc.2","@genlayer/transaction-kit-react":"0.1.0-rc.2","genlayer-js":"2.0.0-rc.1"}.items(): good &= deps.get(n)==v; (ok if deps.get(n)==v else fail)(f"{n} pinned to {v}")
    net=(ROOT/"frontend/lib/genlayer/network.ts").read_text()
    for marker in (str(EXPECTED_CHAIN),EXPECTED_RPC,"https://explorer-studio-dev.genlayer.com"): good &= marker in net; (ok if marker in net else fail)(f"network marker {marker}")
    settle=(ROOT/"contracts/referral_rail.py").read_text(); judge=(ROOT/"contracts/outcome_judge.py").read_text(); v2=(ROOT/"contracts/referral_rail_v2.py").read_text(); v2j=(ROOT/"contracts/outcome_judge_v2.py").read_text(); identity=(ROOT/"contracts/referral_identity_v2.py").read_text()
    markers=[("candidate explicit acceptance","def accept_referral" in settle),("inconclusive recovery","def retry_inconclusive" in settle and "def recover" in settle),("finalized judge message",'emit(on="finalized").evaluate' in settle),("finalized judgment with pull resolution",'emit(on="finalized").evaluate' in settle and "def resolve_judgment" in settle),("substantive validator rerun","independent = evaluate_once" in judge and "run_nondet(" in judge),("source restriction","https://api.github.com/repos/" in judge),("v2 identity contract","class ReferralIdentityV2" in identity and "def complete_github" in identity and "def complete_x" in identity),("v2 evidence profiles","X_POST" in v2 and "PUBLIC_URL" in v2j),("v2 campaign capacity","class ReferralRailV2" in v2 and "max_positions" in v2),("v2 referral-link self-join","def join_via_referral" in v2 and "referrer_address" in v2),("v2 finalized child judgment",'emit(on="finalized").evaluate' in v2),("v2 capacity settlement invariant","pending_successes" in v2 and "_used_capacity" in v2),("v2 source restricted judge","https://api.github.com/repos/" in v2j)]
    for label,match in markers: good &= match; (ok if match else fail)(label)
    if not args.skip_tests:
        result=subprocess.run([sys.executable,"-m","pytest","-q"],cwd=ROOT); good &= result.returncode==0; (ok if result.returncode==0 else fail)("pytest")
    vm=ROOT/"deployment/v2-61997.json"; ve=ROOT/"deployment/v2/live-evidence.json"
    if vm.exists():
        try:
            d=json.loads(vm.read_text()); checks=[d.get("chainId")==EXPECTED_CHAIN,d.get("rpc")==EXPECTED_RPC,ADDR.match(str((d.get("rail") or {}).get("address",""))),ADDR.match(str((d.get("judge") or {}).get("address","")))]
            good &= all(checks); (ok if all(checks) else fail)("v2 deployment manifest shape")
        except Exception as e: good=False; fail(f"v2 deployment manifest parse: {e}")
    elif args.submission: good=False; fail("deployment/v2-61997.json missing")
    if ve.exists():
        try:
            d=json.loads(ve.read_text()); success=d.get("success") or {}; negative=d.get("negative") or {}; txs=[]
            for case in (success,negative): txs.extend(v for v in (case.get("transactions") or {}).values() if v)
            checks=[d.get("chainId")==EXPECTED_CHAIN,success.get("finalPosition",{}).get("state")=="PAID",success.get("finalPosition",{}).get("settlement_released") is True,negative.get("finalCampaign",{}).get("state")=="REFUNDED",bool(txs) and all(HASH.match(str(v)) for v in txs)]
            good &= all(checks); (ok if all(checks) else fail)("v2 live evidence assertions")
        except Exception as e: good=False; fail(f"v2 live evidence parse: {e}")
    elif args.submission: good=False; fail("deployment/v2/live-evidence.json missing")
    print("\nReferralRail preflight:","PASS" if good else "BLOCKED"); return 0 if good else 1
if __name__=="__main__": raise SystemExit(main())




