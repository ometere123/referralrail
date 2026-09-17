# Liveness and recovery

Reservations expire at their bounded reservation deadline. Accepted work expires at its work deadline. Judging has a bounded timeout. Inconclusive judgments have at most two attempts and a bounded retry window.

`recover_position` is permissionless but succeeds only when the relevant timeout or cure condition is true. It releases capacity for terminal failure. Campaign finalisation requires no occupied position and either all funded slots resolved or the participation deadline passed.
