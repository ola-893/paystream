mod gemini;
mod payment_agent;
mod x402;

use std::sync::Arc;
use dotenv::dotenv;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

use gemini::GeminiClient;
use payment_agent::{PaymentAgent, AgentConfig};
use x402::{X402PaymentRequirement, PaymentMode};

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");

    println!();
    info!("🚀 PayStream x402 Agent Demo");
    info!("============================");
    println!();

    // Get API key (optional for demo)
    let api_key = std::env::var("GEMINI_API_KEY")
        .unwrap_or_else(|_| "demo-key".to_string());
    
    let gemini = Arc::new(GeminiClient::new(api_key));

    // Create payment agents
    let agents = vec![
        PaymentAgent::new(
            AgentConfig {
                name: "weather-bot".to_string(),
                wallet_address: "0xABCD1234567890ABCD1234567890ABCD12345678".to_string(),
                daily_budget: 50.0,
            },
            gemini.clone(),
        ),
        PaymentAgent::new(
            AgentConfig {
                name: "data-collector".to_string(),
                wallet_address: "0xEFGH9876543210EFGH9876543210EFGH98765432".to_string(),
                daily_budget: 100.0,
            },
            gemini.clone(),
        ),
    ];

    // Display initialized agents
    for agent in &agents {
        info!("🤖 Agent {} initialized", agent.id);
        info!("   ├─ Wallet: {}...{}", &agent.config.wallet_address[..6], &agent.config.wallet_address[38..]);
        info!("   └─ Budget: {:.2} MNEE", agent.config.daily_budget);
        println!();
    }

    // Demo scenarios - each agent fetches different services
    let demo_scenarios = vec![
        // Scenario 1: Weather API (Streaming mode)
        (
            0, // Agent index
            "https://api.weather-service.com/forecast",
            X402PaymentRequirement {
                recipient: "0x5678EFGH9012IJKL5678EFGH9012IJKL56789012".to_string(),
                amount: None,
                mode: PaymentMode::Streaming,
                rate_per_second: Some("0.0001".to_string()),
                min_deposit: Some("1.00".to_string()),
                description: Some("Real-time weather data API".to_string()),
                network: Some("sepolia".to_string()),
                token: Some("MNEE".to_string()),
            },
        ),
        // Scenario 2: Translation API (Per-request mode)
        (
            0,
            "https://api.translate-agent.com/translate",
            X402PaymentRequirement {
                recipient: "0xAAAABBBBCCCCDDDD1111222233334444AAAABBBB".to_string(),
                amount: Some("0.005".to_string()),
                mode: PaymentMode::PerRequest,
                rate_per_second: None,
                min_deposit: None,
                description: Some("AI Translation Service".to_string()),
                network: Some("sepolia".to_string()),
                token: Some("MNEE".to_string()),
            },
        ),
        // Scenario 3: Compute API (Streaming, different agent)
        (
            1,
            "https://gpu.compute-cloud.io/v1/inference",
            X402PaymentRequirement {
                recipient: "0x1111222233334444555566667777888899990000".to_string(),
                amount: None,
                mode: PaymentMode::Streaming,
                rate_per_second: Some("0.01".to_string()),
                min_deposit: Some("5.00".to_string()),
                description: Some("GPU Compute - ML Inference".to_string()),
                network: Some("sepolia".to_string()),
                token: Some("MNEE".to_string()),
            },
        ),
        // Scenario 4: Data feed (Per-request)
        (
            1,
            "https://api.market-data.io/prices",
            X402PaymentRequirement {
                recipient: "0xDATAFEED00001111222233334444555566667777".to_string(),
                amount: Some("0.001".to_string()),
                mode: PaymentMode::PerRequest,
                rate_per_second: None,
                min_deposit: None,
                description: Some("Real-time market price feed".to_string()),
                network: Some("sepolia".to_string()),
                token: Some("MNEE".to_string()),
            },
        ),
    ];

    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    info!("Starting x402 Payment Flow Demo");
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!();

    // Execute each scenario
    for (agent_idx, url, requirement) in demo_scenarios {
        let agent = &agents[agent_idx];
        
        info!("┌─────────────────────────────────────────────────────────┐");
        info!("│ Agent: {:<50}│", agent.id);
        info!("└─────────────────────────────────────────────────────────┘");

        match agent.fetch_with_mock_402(url, requirement).await {
            Ok(result) => {
                if result.payment_made {
                    info!("✅ HTTP {} - Service accessed after payment", result.status);
                    info!("   Response: {}", result.body);
                    if let Some(stream_id) = result.stream_id {
                        info!("   Stream ID: #{}", stream_id);
                    }
                    if let Some(ref amount) = result.amount_spent {
                        info!("   Amount: {} MNEE", amount);
                    }
                } else {
                    info!("✅ HTTP {} - No payment required", result.status);
                }
            }
            Err(e) => {
                info!("❌ Error: {}", e);
            }
        }
        
        println!();
        info!("────────────────────────────────────────────────────────────");
        println!();
        
        // Small delay for readability
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    // Display final stats
    println!();
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    info!("Demo Complete - Agent Stats");
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!();

    for agent in &agents {
        info!("🤖 {}", agent.id);
        agent.display_stats();
        println!();
    }

    info!("✨ PayStream x402 Demo Complete!");
    info!("");
    info!("💡 What you just saw:");
    info!("   1. Agents made HTTP requests to premium APIs");
    info!("   2. Received HTTP 402 Payment Required responses");
    info!("   3. Parsed x402 headers (X-FlowPay-Mode, X-FlowPay-Rate, etc.)");
    info!("   4. Created MNEE payment streams or made per-request payments");
    info!("   5. Retried requests with payment proof");
    info!("   6. Successfully accessed paid services");
    println!();
}
