# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
"""ReferralIdentityV2: backend-free GitHub identity proofs for chain 61997."""
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import typing
import genlayer as gl

try:
    allow_storage = gl.allow_storage
except AttributeError:
    allow_storage = gl.storage.allow

ZERO = gl.Address("0x0000000000000000000000000000000000000000")
PENDING = 1
ACTIVE = 2
REVOKED = 3
MAX_HANDLE = 39
MAX_CHALLENGE = 180


@allow_storage
@dataclass
class Identity:
    wallet: gl.Address
    platform: str
    handle: str
    canonical_id: str
    challenge: str
    state: gl.u256
    nonce: gl.u256
    updated_at: gl.u256


class IdentityChanged(gl.chain.Event):
    def __init__(self, wallet: gl.Address, platform: str, /, **blob): ...


def clean(value: typing.Any, size: int = 240) -> str:
    return " ".join(str(value).strip().split())[:size]


def handle_ok(value: str) -> bool:
    value = str(value).strip()
    return 1 <= len(value) <= MAX_HANDLE and all(c.isalnum() or c in "-_" for c in value)


def proof_key(wallet: gl.Address, platform: str) -> str:
    return platform + ":" + wallet.as_hex.lower()


def canonical_key(platform: str, identifier: str) -> str:
    return platform + ":" + str(identifier).strip().lower()


class ReferralIdentityV2(gl.contract.Contract):
    identities: gl.storage.TreeMap[str, Identity]
    github_owner: gl.storage.TreeMap[str, str]
    next_nonce: gl.u256

    def __init__(self):
        self.next_nonce = gl.u256(1)

    @gl.public.write
    def request_github(self, login: str) -> str:
        login = clean(login, MAX_HANDLE).lower()
        if not handle_ok(login):
            raise gl.vm.UserError("invalid GitHub login")
        wallet = gl.message.sender_address
        key = proof_key(wallet, "GITHUB")
        nonce = int(self.next_nonce)
        self.next_nonce = gl.u256(nonce + 1)
        challenge = "RR-ID:61997:GITHUB:" + wallet.as_hex + ":" + str(nonce)
        self.identities[key] = Identity(wallet, "GITHUB", login, "", challenge, gl.u256(PENDING), gl.u256(nonce), gl.u256(int(datetime.now(timezone.utc).timestamp())))
        IdentityChanged(wallet, "GITHUB", state=PENDING, challenge=challenge).emit()
        return challenge

    @gl.public.write
    def complete_github(self) -> None:
        wallet = gl.message.sender_address
        key = proof_key(wallet, "GITHUB")
        if key not in self.identities or int(self.identities[key].state) != PENDING:
            raise gl.vm.UserError("no pending GitHub verification")
        pending = self.identities[key]
        login = pending.handle
        challenge = pending.challenge
        url = "https://api.github.com/users/" + login

        def fetch_profile() -> dict:
            response = gl.nondet.web.get(url)
            if int(response.status) != 200:
                raise gl.vm.UserError("GitHub profile is unavailable")
            body = response.body.decode("utf-8")
            if len(body) > 100000:
                raise gl.vm.UserError("GitHub profile is too large")
            data = json.loads(body)
            return {"login": str(data.get("login") or "").lower(), "id": str(data.get("id") or ""), "bio": str(data.get("bio") or "")}

        def verify() -> dict:
            profile = fetch_profile()
            if profile["login"] != login or not profile["id"] or challenge not in profile["bio"]:
                raise gl.vm.UserError("GitHub identity proof is incomplete")
            return profile

        profile = gl.eq_principle.strict_eq(verify)
        canonical = canonical_key("GITHUB", profile["id"])
        current = self.github_owner.get(canonical)
        if current and current.lower() != wallet.as_hex.lower():
            raise gl.vm.UserError("GitHub identity is already owned")
        self.github_owner[canonical] = wallet.as_hex
        pending.canonical_id = profile["id"]
        pending.state = gl.u256(ACTIVE)
        pending.updated_at = gl.u256(int(datetime.now(timezone.utc).timestamp()))
        self.identities[key] = pending
        IdentityChanged(wallet, "GITHUB", state=ACTIVE, canonical_id=profile["id"]).emit()

    @gl.public.write
    def revoke(self, platform: str) -> None:
        platform = clean(platform, 20).upper()
        key = proof_key(gl.message.sender_address, platform)
        if key not in self.identities or int(self.identities[key].state) != ACTIVE:
            raise gl.vm.UserError("identity is not active")
        item = self.identities[key]
        item.state = gl.u256(REVOKED)
        self.identities[key] = item
        if platform == "GITHUB":
            self.github_owner[canonical_key(platform, item.canonical_id)] = ""
        IdentityChanged(item.wallet, platform, state=REVOKED).emit()

    @gl.public.view
    def get_identity(self, wallet: str, platform: str) -> dict:
        key = proof_key(gl.Address(wallet), clean(platform, 20).upper())
        item = self.identities.get(key)
        if not item:
            return {"state": "NONE", "state_code": 0}
        return {"wallet": item.wallet.as_hex, "platform": item.platform, "handle": item.handle, "canonical_id": item.canonical_id, "challenge": item.challenge, "state": {1: "PENDING", 2: "ACTIVE", 3: "REVOKED"}.get(int(item.state), "NONE"), "state_code": int(item.state), "updated_at": int(item.updated_at)}

    @gl.public.view
    def lookup_github_id(self, canonical_id: str) -> str:
        return self.github_owner.get(canonical_key("GITHUB", canonical_id)) or ZERO.as_hex

