from pathlib import Path

import os
import pytest

from gltest import get_contract_factory
from gltest.clients import get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.utils import extract_contract_address
from genlayer_py.types.transactions import ProtocolTransactionStatus


@pytest.mark.skipif(os.environ.get("RUN_GLSIM") != "1", reason="explicit localnet integration test")
def test_glsim_deploys_referralrail_and_reads_config():
    factory = get_contract_factory(contract_file_path=Path("referral_rail.py"))
    client = get_gl_client()
    fees = client.estimate_transaction_fees()
    receipt = factory.deploy_contract_tx(
        args=[],
        fees=fees,
        wait_transaction_status=ProtocolTransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(receipt), "Studio Next finalized a failed contract execution"
    rail = factory.build_contract(contract_address=extract_contract_address(receipt))
    config = rail.get_protocol_config(args=[]).call()
    assert config["judge_address"].lower() == "0x0000000000000000000000000000000000000000"

    judge_address = "0x" + "1" * 40
    set_judge_fees = client.estimate_transaction_fees_for_write(
        rail.address,
        "set_judge",
        args=[judge_address],
    )
    rail.set_judge(args=[judge_address]).transact(
        fees=set_judge_fees,
        wait_transaction_status=ProtocolTransactionStatus.FINALIZED,
    )
    assert rail.get_protocol_config(args=[]).call()["judge_address"].lower() == judge_address
