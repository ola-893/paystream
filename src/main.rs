mod agent;
mod agents;
mod gemini;
mod orchestrator;

use std::sync::Arc;
use dotenv::dotenv;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;
use uuid::Uuid;

use agent::{PaymentRequest, Urgency};
use agents::{ComplianceOfficerAgent, FraudDetectorAgent, RiskAssessorAgent, TreasuryManagerAgent};
use gemini::GeminiClient;
use orchestrator::AgentOrchestrator;

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");

    info!("🚀 PayStream.CRO - Autonomous Payment Agents");
    info!("============================================");

    // Get API key
    let api_key = std::env::var("GEMINI_API_KEY")
        .expect("GEMINI_API_KEY must be set in .env file");
    
    let gemini = Arc::new(GeminiClient::new(api_key));

    // Initialize agents
    let risk_agent = Arc::new(RiskAssessorAgent::new(gemini.clone(), 0.7));
    let compliance_agent = Arc::new(ComplianceOfficerAgent::new(gemini.clone()));
    let treasury_agent = Arc::new(TreasuryManagerAgent::new(gemini.clone(), 100000.0, 50000.0));
    let fraud_agent = Arc::new(FraudDetectorAgent::new(gemini.clone(), 0.6));

    // Create orchestrator
    let mut orchestrator = AgentOrchestrator::new(0.75); // 75% approval threshold
    orchestrator.add_agent(risk_agent);
    orchestrator.add_agent(compliance_agent);
    orchestrator.add_agent(treasury_agent);
    orchestrator.add_agent(fraud_agent);

    info!("✅ {} agents initialized and ready", orchestrator.agent_count());

    // Demo payment requests
    let payments = vec![
        PaymentRequest {
            id: Uuid::new_v4(),
            from: "0x1234...abcd".into(),
            to: "0x5678...efgh".into(),
            amount: 1000.0,
            description: "Monthly subscription payment".into(),
            urgency: Urgency::Medium,
        },
        PaymentRequest {
            id: Uuid::new_v4(),
            from: "0xaaaa...bbbb".into(),
            to: "0xcccc...dddd".into(),
            amount: 50000.0,
            description: "Large vendor payment - Q4 services".into(),
            urgency: Urgency::High,
        },
        PaymentRequest {
            id: Uuid::new_v4(),
            from: "0x9999...0000".into(),
            to: "0x1111...2222".into(),
            amount: 100.0,
            description: "Urgent emergency fund transfer".into(),
            urgency: Urgency::Critical,
        },
    ];

    // Process each payment
    for payment in payments {
        info!("\n📋 Processing Payment Request");
        info!("   ID: {}", payment.id);
        info!("   Amount: {} CRO", payment.amount);
        info!("   To: {}", payment.to);
        info!("   Description: {}", payment.description);
        
        let decision = orchestrator.process_payment(&payment).await;
        
        info!("\n📊 Agent Decisions:");
        for agent_decision in &decision.agent_decisions {
            info!("   [{}] {:?} - {} (confidence: {:.2})",
                agent_decision.agent_id,
                agent_decision.action,
                agent_decision.reason,
                agent_decision.confidence
            );
        }
        
        info!("\n🎯 Final Decision: {:?}", decision.final_action);
        info!("   Consensus Score: {:.2}", decision.consensus_score);
        info!("   Summary: {}", decision.summary);
        info!("   ----------------------------------------");
    }

    info!("\n✨ PayStream.CRO demo complete!");
}
