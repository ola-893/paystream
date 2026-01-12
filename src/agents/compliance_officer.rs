use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;
use std::sync::Arc;
use crate::agent::{Agent, PaymentAction, PaymentDecision, PaymentRequest};
use crate::gemini::GeminiClient;

pub struct ComplianceOfficerAgent {
    id: String,
    gemini: Arc<GeminiClient>,
    compliance_rules: Vec<String>,
}

impl ComplianceOfficerAgent {
    pub fn new(gemini: Arc<GeminiClient>) -> Self {
        Self {
            id: format!("compliance-{}", Uuid::new_v4().to_string()[..8].to_string()),
            gemini,
            compliance_rules: vec![
                "AML (Anti-Money Laundering) checks".into(),
                "KYC verification status".into(),
                "Sanctions list screening".into(),
                "Transaction limits per jurisdiction".into(),
                "Regulatory reporting requirements".into(),
            ],
        }
    }

    fn build_prompt(&self, request: &PaymentRequest) -> String {
        format!(
            r#"You are a Compliance Officer AI Agent for a crypto payment platform.
Evaluate this payment for regulatory compliance:

Payment Details:
- From: {}
- To: {}
- Amount: {} CRO
- Description: {}

Compliance Rules to Check:
{}

Respond in this exact JSON format:
{{"compliant": true|false, "action": "approve|reject|defer|review", "violations": [], "reason": "explanation", "confidence": 0.0-1.0}}"#,
            request.from, request.to, request.amount, request.description,
            self.compliance_rules.iter().map(|r| format!("- {}", r)).collect::<Vec<_>>().join("\n")
        )
    }
}

#[async_trait]
impl Agent for ComplianceOfficerAgent {
    fn id(&self) -> &str { &self.id }
    fn role(&self) -> &str { "Compliance Officer" }

    async fn evaluate(&self, request: &PaymentRequest) -> PaymentDecision {
        let prompt = self.build_prompt(request);
        let response = self.gemini.generate(&prompt).await;

        let (action, reason, confidence) = match response {
            Ok(text) => parse_compliance_response(&text),
            Err(e) => (PaymentAction::RequestReview, format!("Compliance check error: {}", e), 0.0),
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
        let prompt = format!("As a Compliance Officer Agent, respond to: {}", message);
        self.gemini.generate(&prompt).await.unwrap_or_else(|e| e.to_string())
    }
}

fn parse_compliance_response(text: &str) -> (PaymentAction, String, f64) {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(text) {
        let compliant = json["compliant"].as_bool().unwrap_or(false);
        let confidence = json["confidence"].as_f64().unwrap_or(0.5);
        let reason = json["reason"].as_str().unwrap_or("No reason").to_string();
        
        let action = if !compliant {
            PaymentAction::Reject
        } else {
            match json["action"].as_str() {
                Some("approve") => PaymentAction::Approve,
                Some("defer") => PaymentAction::Defer,
                _ => PaymentAction::RequestReview,
            }
        };
        (action, reason, confidence)
    } else {
        (PaymentAction::RequestReview, "Could not parse compliance response".into(), 0.0)
    }
}
