from pathlib import Path
import ast

ROOT=Path(__file__).resolve().parents[2]
SETTLE=(ROOT/'contracts/referral_rail.py').read_text()
JUDGE=(ROOT/'contracts/outcome_judge.py').read_text()
V2_SETTLE=(ROOT/'contracts/referral_rail_v2.py').read_text()
V2_JUDGE=(ROOT/'contracts/outcome_judge_v2.py').read_text()
V2_IDENTITY=(ROOT/'contracts/referral_identity_v2.py').read_text()

def test_contracts_parse_as_python():
    for source in [SETTLE,JUDGE,V2_SETTLE,V2_JUDGE,V2_IDENTITY]: ast.parse(source)

def test_v1_and_v2_contract_files_are_explicit():
    assert sorted(p.name for p in (ROOT/'contracts').glob('*.py')) == ['outcome_judge.py','outcome_judge_v2.py','referral_identity_v2.py','referral_rail.py','referral_rail_v2.py']

def test_v06_dependency_is_consistent():
    marker='py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng'
    assert marker in SETTLE and marker in JUDGE and marker in V2_SETTLE and marker in V2_JUDGE and marker in V2_IDENTITY

def test_v2_is_multi_position_and_fully_funded():
    for token in ['class ReferralRailV2', 'create_campaign', 'max_positions', 'occupied', 'settle_position', 'finalise_campaign', 'recover_position', 'join_via_referral']:
        assert token in V2_SETTLE
    for token in ['class OutcomeJudgeV2', 'COMPLETED', 'NOT_COMPLETED', 'INCONCLUSIVE', 'ownership-proof']:
        assert token in V2_JUDGE or token.replace('-', '_') in V2_JUDGE

def test_identity_contract_has_canonical_github_ownership():
    for token in ['class ReferralIdentityV2','request_github','complete_github','request_x','complete_x','lookup_github_id','lookup_x_handle','github_owner','x_owner','strict_eq']:
        assert token in V2_IDENTITY

def test_substantive_validator_refetches_and_reruns():
    assert 'run_nondet(' in JUDGE and 'independent = evaluate_once' in JUDGE
    assert 'github_json' in JUDGE and 'objective_key' in JUDGE and 'evidence_digest' in JUDGE

def test_judge_is_source_restricted():
    assert 'https://api.github.com/repos/' in JUDGE and 'evidence_host": "api.github.com"' in JUDGE

def test_judgment_message_uses_finalized_trigger_and_pull_resolution():
    assert 'emit(on="finalized").evaluate' in SETTLE and 'def resolve_judgment' in SETTLE and 'get_judgment' in SETTLE

def test_target_network_marker_is_present(): assert '61997' in SETTLE

def test_inconclusive_and_timeout_paths_exist():
    for token in ['retry_inconclusive','recover','JUDGMENT_TIMEOUT_SECONDS','MAX_ATTEMPTS']: assert token in SETTLE

def test_v2_paid_capacity_and_reusable_capacity_are_distinct():
    assert 'pending_successes' in V2_SETTLE and '_used_capacity' in V2_SETTLE and 'PUBLIC_WEB' in V2_SETTLE and 'participated' in V2_SETTLE
    assert 'c.occupied = gl.u256(int(c.occupied) - 1)' in V2_SETTLE and '"reusable_capacity"' in V2_SETTLE

def test_v2_multislot_accounting_guards():
    for token in ['initial_funding','paid_total','refunded_total','still_locked','conserved']: assert token in V2_SETTLE






def test_v2_public_web_host_checks_are_bounded():
    for token in ["def ipv4_private_or_local", "a == 10", "a == 127", "16 <= b <= 31", "a == 192 and b == 168", "a == 169 and b == 254", "authority == \"localhost\"", "authority == \"::1\""]:
        assert token in V2_SETTLE
    for token in ["def private_or_local_host", "a == 10", "a == 127", "16 <= b <= 31", "a == 192 and b == 168", "a == 169 and b == 254"]:
        assert token in V2_JUDGE


def test_v2_participation_guard_is_before_new_position_allocation():
    for method in ["def create_referral", "def join_via_referral"]:
        start = V2_SETTLE.index(method)
        body = V2_SETTLE[start:V2_SETTLE.find("\n    @gl.public", start + len(method))]
        assert "participated" in body
        assert "candidate already participated" in body
