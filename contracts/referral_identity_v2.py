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
    proof_url: str
    state: gl.u256
    nonce: gl.u256
    updated_at: gl.u256


class IdentityChanged(gl.chain.Event):
    def __init__(self, wallet: gl.Address, platform: str, /, **blob): ...


def clean(value: typing.Any, size: int = 240) -> str:
    return " ".join(str(value).strip().split())[:size]


def github_handle_ok(value: str) -> bool:
    value = str(value).strip()
    return 1 <= len(value) <= 39 and value[0] != "-" and value[-1] != "-" and all(("a" <= c <= "z") or ("A" <= c <= "Z") or ("0" <= c <= "9") or c == "-" for c in value)


def x_handle_ok(value: str) -> bool:
    value = str(value).strip()
    return 1 <= len(value) <= 15 and all(("a" <= c <= "z") or ("A" <= c <= "Z") or ("0" <= c <= "9") or c == "_" for c in value)



def proof_key(wallet: gl.Address, platform: str) -> str:
    return platform + ":" + wallet.as_hex.lower()


def canonical_key(platform: str, identifier: str) -> str:
    return platform + ":" + str(identifier).strip().lower()


class ReferralIdentityV2(gl.contract.Contract):
    identities: gl.storage.TreeMap[str, Identity]
    github_owner: gl.storage.TreeMap[str, str]
    x_owner: gl.storage.TreeMap[str, str]
    next_nonce: gl.u256

    def __init__(self):
        self.next_nonce = gl.u256(1)

    @gl.public.write
    def request_github(self, login: str) -> str:
        login = clean(login, MAX_HANDLE).lower()
        if not github_handle_ok(login):
            raise gl.vm.UserError("invalid GitHub login")
        wallet = gl.message.sender_address
        key = proof_key(wallet, "GITHUB")
        nonce = int(self.next_nonce)
        self.next_nonce = gl.u256(nonce + 1)
        challenge = "RR-ID:61997:GITHUB:" + wallet.as_hex + ":" + str(nonce)
        self.identities[key] = Identity(wallet, "GITHUB", login, "", challenge, "", gl.u256(PENDING), gl.u256(nonce), gl.u256(int(datetime.now(timezone.utc).timestamp())))
        IdentityChanged(wallet, "GITHUB", state=PENDING, challenge=challenge).emit()
        return challenge

    @gl.public.write
    def request_x(self, handle: str) -> str:
        handle = clean(handle, 15).lstrip("@").lower()
        if not x_handle_ok(handle):
            raise gl.vm.UserError("invalid X handle")
        wallet = gl.message.sender_address
        key = proof_key(wallet, "X")
        nonce = int(self.next_nonce)
        self.next_nonce = gl.u256(nonce + 1)
        challenge = "RR-ID:61997:X:" + wallet.as_hex + ":" + str(nonce)
        self.identities[key] = Identity(wallet, "X", handle, handle, challenge, "", gl.u256(PENDING), gl.u256(nonce), gl.u256(int(datetime.now(timezone.utc).timestamp())))
        IdentityChanged(wallet, "X", state=PENDING, challenge=challenge).emit()
        return challenge

    @gl.public.write
    def complete_x(self, status_url: str) -> None:
        wallet = gl.message.sender_address
        key = proof_key(wallet, "X")
        if key not in self.identities or int(self.identities[key].state) != PENDING:
            raise gl.vm.UserError("no pending X verification")
        pending = self.identities[key]
        handle = pending.handle
        url = clean(status_url, 300)
        parts = url.split("/")
        if not (url.startswith("https://x.com/") or url.startswith("https://twitter.com/")) or len(parts) < 6 or parts[4] != "status" or not parts[5].isdigit():
            raise gl.vm.UserError("invalid X status URL")
        if parts[2] == "x.com":
            path_handle = parts[3].lower()
        else:
            path_handle = parts[3].lower()
        if path_handle != handle:
            raise gl.vm.UserError("X handle does not match pending proof")
        source = "https://publish.twitter.com/oembed?url=" + url
        def verify() -> dict:
            response = gl.nondet.web.get(source)
            if int(response.status) != 200:
                raise gl.vm.UserError("X proof is unavailable")
            body = response.body.decode("utf-8")
            if len(body) > 100000:
                raise gl.vm.UserError("X proof is too large")
            data = json.loads(body)
            proof = {"html": str(data.get("html") or ""), "author_url": str(data.get("author_url") or "").lower()}
            if pending.challenge not in proof["html"] or ("/" + handle) not in proof["author_url"]:
                raise gl.vm.UserError("X identity proof is incomplete")
            return proof
        gl.eq_principle.strict_eq(verify)
        owner = self.x_owner.get(canonical_key("X", handle))
        if owner and owner.lower() != wallet.as_hex.lower():
            raise gl.vm.UserError("X handle is already owned")
        self.x_owner[canonical_key("X", handle)] = wallet.as_hex
        pending.proof_url = url
        pending.canonical_id = handle
        pending.state = gl.u256(ACTIVE)
        pending.updated_at = gl.u256(int(datetime.now(timezone.utc).timestamp()))
        self.identities[key] = pending
        IdentityChanged(wallet, "X", state=ACTIVE, canonical_id=handle).emit()

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

        def verify() -> dict:
            response = gl.nondet.web.get(url)
            if int(response.status) != 200:
                raise gl.vm.UserError("GitHub profile is unavailable")
            body = response.body.decode("utf-8")
            if len(body) > 100000:
                raise gl.vm.UserError("GitHub profile is too large")
            data = json.loads(body)
            profile = {"login": str(data.get("login") or "").lower(), "id": str(data.get("id") or ""), "bio": str(data.get("bio") or "")}
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
        if platform == "X":
            self.x_owner[canonical_key(platform, item.canonical_id)] = ""
        IdentityChanged(item.wallet, platform, state=REVOKED).emit()

    @gl.public.view
    def get_identity(self, wallet: str, platform: str) -> dict:
        key = proof_key(gl.Address(wallet), clean(platform, 20).upper())
        item = self.identities.get(key)
        if not item:
            return {"state": "NONE", "state_code": 0}
        return {"wallet": item.wallet.as_hex, "platform": item.platform, "handle": item.handle, "canonical_id": item.canonical_id, "challenge": item.challenge, "proof_url": item.proof_url, "state": {1: "PENDING", 2: "ACTIVE", 3: "REVOKED"}.get(int(item.state), "NONE"), "state_code": int(item.state), "updated_at": int(item.updated_at)}

    @gl.public.view
    def lookup_github_id(self, canonical_id: str) -> str:
        return self.github_owner.get(canonical_key("GITHUB", canonical_id)) or ZERO.as_hex

    @gl.public.view
    def lookup_x_handle(self, handle: str) -> str:
        return self.x_owner.get(canonical_key("X", clean(handle, MAX_HANDLE).lstrip("@"))) or ZERO.as_hex







