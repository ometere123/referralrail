import json
import os
import sys
from pathlib import Path

import pytest

from genlayer_py import create_account
from gltest import get_contract_factory, get_gl_client

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.live_lifecycle import send, assert_state


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

    resolved = send(rail, "resolve_judgment", [2, 1], employer, client)
    settlement = send(rail, "settle_opportunity", [2], employer, client, triggered=True)
    settled = assert_state(rail, 2, "REFUNDED")
    assert settled["settlement_released"] is True
    print(json.dumps({"negative": {"opportunity_id": 2, "state": settled["state"], "resolution": resolved, "settlement": settlement}}, default=str))
