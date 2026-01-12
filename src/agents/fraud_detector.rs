use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;
use std::sync::Arc;
use crate::agent::{Agent, PaymentAction, PaymentDecision, PaymentRequest};
use crate::gemini::GeminiClient;

pub struct FraudDetectorAgent {
    id: String,
    gemini: Arc<GeminiClient>,
    fraud_threshold: f64,
}

impl FraudDetectorAgent {
    pub fn new(gemini: Arc<GeminiClient>, fraud_threshold: f64) -> Self {
        Self {
            id: format!("fraud-detector-{}", Uuid::new_v4().to_string()[..8].to_string()),
            gemini,
            fraud_threshold,
        }
    }

    fn build_prompt(&self, request: &PaymentRequest) -> String {
        format!(
            r#"You are a Fraud Detection AI Agent for a crypto payment platform.
Analyze this payment for potential fraud indicators:

Payment Details:
- From: {}
- To: {}
- Amount: {} CRO
- Description: {}
- Urgency: {:?}

Fraud Indicators to Check:
- Unusual transaction patterns
- Velocity abuse (rapid successive transactions)
- Address reputation
- Amount anomalies
- Description red flags
- Time-based patterns

Respond in this exact JSON format:
{{"fraud_score": 0.0-1.0, "action": "approve|reject|defer|review", "indicators": [], "reason": "explanation", "confidence": 0.0-1.0}}"#,
            request.from, request.to, request.amount, request.description, request.urgency
        )
    }
}

#[async_trait]
impl Agent for FraudDetectorAgent {
    fn id(&self) -> &str { &self.id }
    fn role(&self) -> &str { "Fraud Detector" }

    async fn evaluate(&self, request: &PaymentRequest) -> PaymentDecision {
        let prompt = self.build_prompt(request);
        let response = self.gemini.generate(&prompt).await;

        let (action, reason, confidence) = match response {
            Ok(text) => parse_fraud_response(&text, self.fraud_threshold),
            Err(e) => (PaymentAction::RequestReview, format!("Fraud check error: {}", e), 0.0),
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
        let prompt = format!("As a Fraud Detection Agent, respond to: {}", message);
        self.gemini.generate(&prompt).await.unwrap_or_else(|e| e.to_string())
    }
}

fn parse_fraud_response(text: &str, threshold: f64) -> (PaymentAction, String, f64) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
        let fraud_score = json["fraud_score"].as_f64().unwrap_or(0.5);
        let confidence = json["confidence"].as_f64().unwrap_or(0.5);
        let reason = json["reason"].as_str().unwrap_or("No reason").to_string();
        
        let action = if fraud_score > threshold {
            PaymentAction::Reject
        } else if fraud_score > threshold * 0.7 {
            PaymentAction::RequestReview
        } else {
            match json["action"].as_str() {
                Some("approve") => PaymentAction::Approve,
                Some("defer") => PaymentAction::Defer,
                _ => PaymentAction::Approve,
            }
        };
        (action, reason, confidence)
    } else {
        (PaymentAction::RequestReview, "Could not parse fraud response".into(), 0.0)
    }
}
