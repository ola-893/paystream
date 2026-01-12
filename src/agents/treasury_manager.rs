use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;
use std::sync::Arc;
use crate::agent::{Agent, PaymentAction, PaymentDecision, PaymentRequest, Urgency};
use crate::gemini::GeminiClient;

pub struct TreasuryManagerAgent {
    id: String,
    gemini: Arc<GeminiClient>,
    available_balance: f64,
    daily_limit: f64,
    spent_today: f64,
}

impl TreasuryManagerAgent {
    pub fn new(gemini: Arc<GeminiClient>, balance: f64, daily_limit: f64) -> Self {
        Self {
            id: format!("treasury-{}", Uuid::new_v4().to_string()[..8].to_string()),
            gemini,
            available_balance: balance,
            daily_limit,
            spent_today: 0.0,
        }
    }

    fn build_prompt(&self, request: &PaymentRequest) -> String {
        format!(
            r#"You are a Treasury Manager AI Agent for a payment streaming platform.
Evaluate this payment from a treasury/liquidity perspective:

Payment Details:
- Amount: {} CRO
- To: {}
- Description: {}
- Urgency: {:?}

Treasury Status:
- Available Balance: {} CRO
- Daily Limit: {} CRO
- Spent Today: {} CRO
- Remaining Daily: {} CRO

Respond in this exact JSON format:
{{"can_fund": true|false, "action": "approve|reject|defer|review", "reason": "explanation", "suggested_timing": "immediate|scheduled|batched", "confidence": 0.0-1.0}}"#,
            request.amount, request.to, request.description, request.urgency,
            self.available_balance, self.daily_limit, self.spent_today,
            self.daily_limit - self.spent_today
        )
    }
}

#[async_trait]
impl Agent for TreasuryManagerAgent {
    fn id(&self) -> &str { &self.id }
    fn role(&self) -> &str { "Treasury Manager" }

    async fn evaluate(&self, request: &PaymentRequest) -> PaymentDecision {
        // Quick balance check
        if request.amount > self.available_balance {
            return PaymentDecision {
                id: Uuid::new_v4(),
                agent_id: self.id.clone(),
                action: PaymentAction::Reject,
                amount: request.amount,
                recipient: request.to.clone(),
                reason: "Insufficient treasury balance".into(),
                confidence: 1.0,
                timestamp: Utc::now(),
            };
        }

        let prompt = self.build_prompt(request);
        let response = self.gemini.generate(&prompt).await;

        let (action, reason, confidence) = match response {
            Ok(text) => parse_treasury_response(&text, request),
            Err(e) => (PaymentAction::RequestReview, format!("Treasury error: {}", e), 0.0),
        };

        PaymentDecision {
            id: Uuid::new_v4(),
            agent_id: self.id.clone(),
            action,
            amount: request.amount,
            recipient: request.to.clone(),
            reason,
            confidence,
            timestamp: Utc::now(),
        }
    }

    async fn communicate(&self, message: &str) -> String {
        let prompt = format!(
            "As a Treasury Manager Agent with {} CRO available, respond to: {}",
            self.available_balance, message
        );
        self.gemini.generate(&prompt).await.unwrap_or_else(|e| e.to_string())
    }
}

fn parse_treasury_response(text: &str, request: &PaymentRequest) -> (PaymentAction, String, f64) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
        let can_fund = json["can_fund"].as_bool().unwrap_or(false);
        let confidence = json["confidence"].as_f64().unwrap_or(0.5);
        let reason = json["reason"].as_str().unwrap_or("No reason").to_string();
        
        let action = if !can_fund {
            PaymentAction::Reject
        } else {
            match (json["action"].as_str(), &request.urgency) {
                (Some("approve"), Urgency::Critical | Urgency::High) => PaymentAction::Approve,
                (Some("approve"), _) => PaymentAction::Approve,
                (Some("defer"), _) => PaymentAction::Defer,
                _ => PaymentAction::RequestReview,
            }
        };
        (action, reason, confidence)
    } else {
        (PaymentAction::RequestReview, "Could not parse treasury response".into(), 0.0)
    }
}
