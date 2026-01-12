use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;
use std::sync::Arc;
use crate::agent::{Agent, PaymentAction, PaymentDecision, PaymentRequest};
use crate::gemini::GeminiClient;

pub struct RiskAssessorAgent {
    id: String,
    gemini: Arc<GeminiClient>,
    risk_threshold: f64,
}

impl RiskAssessorAgent {
    pub fn new(gemini: Arc<GeminiClient>, risk_threshold: f64) -> Self {
        Self {
            id: format!("risk-assessor-{}", Uuid::new_v4().to_string()[..8].to_string()),
            gemini,
            risk_threshold,
        }
    }

    fn build_prompt(&self, request: &PaymentRequest) -> String {
        format!(
            r#"You are a Risk Assessment AI Agent for a payment streaming platform.
Analyze this payment request and provide a risk assessment:

Payment Details:
- From: {}
- To: {}
- Amount: {} CRO
- Description: {}
- Urgency: {:?}

Respond in this exact JSON format:
{{"risk_score": 0.0-1.0, "action": "approve|reject|defer|review", "reason": "brief explanation", "confidence": 0.0-1.0}}

Consider: transaction patterns, amount thresholds, recipient history, and urgency level."#,
            request.from, request.to, request.amount, request.description, request.urgency
        )
    }
}

#[async_trait]
impl Agent for RiskAssessorAgent {
    fn id(&self) -> &str { &self.id }
    fn role(&self) -> &str { "Risk Assessor" }

    async fn evaluate(&self, request: &PaymentRequest) -> PaymentDecision {
        let prompt = self.build_prompt(request);
        let response = self.gemini.generate(&prompt).await;

        let (action, reason, confidence) = match response {
            Ok(text) => parse_agent_response(&text, self.risk_threshold),
            Err(e) => (PaymentAction::RequestReview, format!("Error: {}", e), 0.0),
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
        let prompt = format!("As a Risk Assessment Agent, respond to: {}", message);
        self.gemini.generate(&prompt).await.unwrap_or_else(|e| e.to_string())
    }
}

fn parse_agent_response(text: &str, threshold: f64) -> (PaymentAction, String, f64) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
        let risk_score = json["risk_score"].as_f64().unwrap_or(0.5);
        let confidence = json["confidence"].as_f64().unwrap_or(0.5);
        let reason = json["reason"].as_str().unwrap_or("No reason provided").to_string();
        
        let action = if risk_score > threshold {
            PaymentAction::Reject
        } else {
            match json["action"].as_str() {
                Some("approve") => PaymentAction::Approve,
                Some("reject") => PaymentAction::Reject,
                Some("defer") => PaymentAction::Defer,
                _ => PaymentAction::RequestReview,
            }
        };
        (action, reason, confidence)
    } else {
        (PaymentAction::RequestReview, "Could not parse response".into(), 0.0)
    }
}
