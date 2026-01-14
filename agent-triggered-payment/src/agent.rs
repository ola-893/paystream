use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentDecision {
    pub id: Uuid,
    pub agent_id: String,
    pub action: PaymentAction,
    pub amount: f64,
    pub recipient: String,
    pub reason: String,
    pub confidence: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PaymentAction {
    Approve,
    Reject,
    Defer,
    RequestReview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRequest {
    pub id: Uuid,
    pub from: String,
    pub to: String,
    pub amount: f64,
    pub description: String,
    pub urgency: Urgency,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Urgency {
    Low,
    Medium,
    High,
    Critical,
}

#[async_trait]
pub trait Agent: Send + Sync {
    fn id(&self) -> &str;
    fn role(&self) -> &str;
    async fn evaluate(&self, request: &PaymentRequest) -> PaymentDecision;
    async fn communicate(&self, message: &str) -> String;
}
