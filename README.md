# PayStream.CRO - Autonomous Payment Agents

AI-powered payment streaming platform with autonomous decision-making agents on Cronos.

## Agents

- **Risk Assessor** - Evaluates transaction risk scores
- **Compliance Officer** - Checks AML/KYC/regulatory compliance  
- **Treasury Manager** - Manages liquidity and spending limits
- **Fraud Detector** - Identifies suspicious patterns

## Setup

1. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_key_here
```

2. Run:
```bash
cargo run
```

## Architecture

```
PaymentRequest → Orchestrator → [Agents evaluate in parallel] → Consensus → Final Decision
```

Each agent uses Gemini to analyze payments and returns a decision with confidence score. The orchestrator aggregates decisions - any rejection blocks the payment, otherwise requires 75% approval.
