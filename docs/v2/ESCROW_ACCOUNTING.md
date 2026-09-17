# Escrow accounting

For every campaign:

`initial_funding = paid + refunded + still_locked`

The contract records paid candidate and referrer amounts separately through `paid_total`, and records unused campaign backing through `refunded_total`. `locked_total` is derived, never trusted from a client.

Capacity is calculated as funded positions minus successful positions and unresolved non-success positions. A completed position remains occupied until settlement, so it cannot be replaced while its payout is pending. A paid position is not counted twice.
