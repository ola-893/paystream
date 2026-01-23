# Smart Contracts

FlowPay uses the FlowPayStream smart contract deployed on Cronos Testnet for native TCRO payments.

## Deployed Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| FlowPayStream | `0x155A00fBE3D290a8935ca4Bf5244283685Bb0035` | Payment streaming |

## Contract Overview

### FlowPayStream

The core payment streaming contract that enables:
- Creating payment streams with native TCRO
- Withdrawing streamed funds
- Cancelling streams
- Querying stream state

## Verification

Contracts are verified on Cronos Explorer:
- [FlowPayStream on Cronos Explorer](https://explorer.cronos.org/testnet/address/0x155A00fBE3D290a8935ca4Bf5244283685Bb0035)

## Next Steps

- [FlowPayStream Details](flowpaystream.md)
- [Events & Errors](events-errors.md)
