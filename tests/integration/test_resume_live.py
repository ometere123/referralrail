import json
import os
import sys
from pathlib import Path

import pytest

from genlayer_py import create_account
from gltest import get_contract_factory, get_gl_client

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.live_lifecycle import GEN, run_case, send, assert_state


@pytest.mark.skipif(os.environ.get("RUN_LIVE_LIFECYCLE") != "1", reason="explicit live Studio Next test")
def test_resume_and_negative_live_lifecycle():
    root = Path(__file__).resolve().parents[2]
    deployment = json.loads((root / "deployment" / "61997.json").read_text())
    employer = create_account(account_private_key=os.environ["STUDIO_NEXT_EMPLOYER_PRIVATE_KEY"])
    referrer = create_account(account_private_key=os.environ["STUDIO_NEXT_REFERRER_PRIVATE_KEY"])
    candidate = create_account(account_private_key=os.environ["STUDIO_NEXT_CANDIDATE_PRIVATE_KEY"])
    client = get_gl_client()
    factory = get_contract_factory(contract_file_path=Path("referral_rail.py"))
    rail = factory.build_contract(contract_address=deployment["referralRail"]["address"], account=employer)

    submitted = send(rail, "submit_work", [1, 1], candidate, client, triggered=True)
    settled = assert_state(rail, 1, "PAID")
    negative = run_case(rail, client, employer, referrer, candidate, "ometere123", "thedadsbot", 13, "negative", "ometere123")
    assert negative["readbacks"]["settled"]["state"] == "REFUNDED"
    print(json.dumps({"success": {"opportunity_id": 1, "state": settled["state"], "submission": submitted}, "negative": negative}, default=str))
