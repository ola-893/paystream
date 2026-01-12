use std::sync::Arc;
use tracing::{info, warn};
use crate::agent::{Agent, PaymentAction, PaymentDecision, PaymentRequest};

pub struct AgentOrchestrator {
    agents: Vec<Arc<dyn Agent>>,
    approval_threshold: f64,
}

#[derive(Debug)]
pub struct OrchestratorDecision {
    pub final_action: PaymentAction,
    pub agent_decisions: Vec<PaymentDecision>,
    pub consensus_score: f64,
    pub summary: String,
}

impl AgentOrchestrator {
    pub fn new(approval_threshold: f64) -> Self {
        Self {
            agents: Vec::new(),
            approval_threshold,
        }
    }

    pub fn add_agent(&mut self, agent: Arc<dyn Agent>) {
        info!("Adding agent: {} ({})", agent.id(), agent.role());
        self.agents.push(agent);
    }

    pub async fn process_payment(&self, request: &PaymentRequest) -> OrchestratorDecision {
        info!("Processing payment {} for {} CRO", request.id, request.amount);
        
        // Collect decisions from all agents concurrently
        let decisions: Vec<PaymentDecision> = futures::future::join_all(
            self.agents.iter().map(|agent| {
                let req = request.clone();
                async move { agent.evaluate(&req).await }
            })
        ).await;

        // Analyze consensus
        let (final_action, consensus_score, summary) = self.analyze_consensus(&decisions);
        
        OrchestratorDecision {
            final_action,
            agent_decisions: decisions,
            consensus_score,
            summary,
        }
    }

    fn analyze_consensus(&self, decisions: &[PaymentDecision]) -> (PaymentAction, f64, String) {
        let total = decisions.len() as f64;
        if total == 0.0 {
            return (PaymentAction::RequestReview, 0.0, "No agents available".into());
        }

        let mut approvals: u32 = 0;
        let mut rejections: u32 = 0;
        let mut defers: u32 = 0;
        let mut reviews: u32 = 0;
        let mut weighted_confidence = 0.0;

        for decision in decisions {
            weighted_confidence += decision.confidence;
            match decision.action {
                PaymentAction::Approve => approvals += 1,
                PaymentAction::Reject => rejections += 1,
                PaymentAction::Defer => defers += 1,
                PaymentAction::RequestReview => reviews += 1,
            }
        }

        let approval_rate = approvals as f64 / total;
        let rejection_rate = rejections as f64 / total;
        let avg_confidence = weighted_confidence / total;

        // Decision logic
        let final_action = if rejection_rate > 0.0 {
            // Any rejection blocks the payment
            PaymentAction::Reject
        } else if approval_rate >= self.approval_threshold {
            PaymentAction::Approve
        } else if defers > 0 {
            PaymentAction::Defer
        } else {
            PaymentAction::RequestReview
        };

        let consensus_score = match &final_action {
            PaymentAction::Approve => approval_rate,
            PaymentAction::Reject => rejection_rate,
            _ => 1.0 - (approvals.abs_diff(rejections) as f64 / total),
        };

        let summary = format!(
            "Agents: {} approve, {} reject, {} defer, {} review. Avg confidence: {:.2}",
            approvals, rejections, defers, reviews, avg_confidence
        );

        if matches!(final_action, PaymentAction::Reject) {
            warn!("Payment rejected by consensus");
        }

        (final_action, consensus_score, summary)
    }

    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }
}
