# State machine

High-level flow: `OPEN -> REFERRED -> ACCEPTED -> JUDGING -> PAID|REFUNDED|INCONCLUSIVE`. `INCONCLUSIVE` may retry within the bounded attempt and cure window, then recover to `REFUNDED`. `OPEN` can be employer-cancelled to `CANCELLED`; eligible pre-judgment deadlines can expire to `EXPIRED`; stalled judgment can recover to `REFUNDED`.

`PAID` and `REFUNDED` mean the protocol outcome is decided. They do not mean a value transfer was released. A separate finalized `settle_opportunity` transaction must set `closed_at` and `settlement_released` before funds can be described as paid or refunded.
