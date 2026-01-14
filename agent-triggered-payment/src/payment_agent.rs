use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use tracing::{info, warn};
use uuid::Uuid;

use crate::gemini::GeminiClient;
use crate::x402::{X402PaymentRequirement, PaymentProof, PaymentMode, headers};

/// Agent configuration
#[derive(Debug, Clone)]
pub struct AgentConfig {
    pub name: String,
    pub wallet_address: String,
    pub daily_budget: f64,
}

/// Stats tracking for the agent
#[derive(Debug, Default)]
pub struct AgentStats {
    pub requests_made: AtomicU64,
    pub payments_made: AtomicU64,
    pub total_spent: std::sync::atomic::AtomicU64, // Store as micro-units
    pub active_streams: AtomicU64,
}

/// Result of a fetch operation
#[derive(Debug, Serialize, Deserialize)]
pub struct FetchResult {
    pub status: u16,
    pub body: String,
    pub payment_made: bool,
    pub stream_id: Option<u64>,
    pub amount_spent: Option<String>,
}

/// Payment Agent - autonomous agent that can make x402 payments
pub struct PaymentAgent {
    pub id: String,
    pub config: AgentConfig,
    pub gemini: Arc<GeminiClient>,
    http_client: Client,
    pub stats: AgentStats,
    next_stream_id: AtomicU64,
}

impl PaymentAgent {
    pub fn new(config: AgentConfig, gemini: Arc<GeminiClient>) -> Self {
        let id = format!("{}-{}", config.name, &Uuid::new_v4().to_string()[..8]);
        Self {
            id,
            config,
            gemini,
            http_client: Client::new(),
            stats: AgentStats::default(),
            next_stream_id: AtomicU64::new(1000),
        }
    }

    /// Fetch a URL, automatically handling x402 payment requirements
    pub async fn fetch(&self, url: &str) -> Result<FetchResult, String> {
        info!("📡 Fetching: {}", url);
        self.stats.requests_made.fetch_add(1, Ordering::Relaxed);

        // Make initial request
        let response = self.http_client.get(url)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = response.status().as_u16();

        // Check for 402 Payment Required
        if status == 402 {
            info!("⚠️  HTTP 402 Payment Required");
            
            // Parse payment requirements from headers
            if let Some(requirement) = X402PaymentRequirement::from_response(&response) {
                info!("   {}", requirement.display());
                
                // Trigger payment
                let proof = self.trigger_payment(&requirement).await?;
                
                // Retry request with payment proof
                return self.retry_with_payment(url, &proof).await;
            } else {
                warn!("   ⚠️ Could not parse payment requirements from 402 response");
                return Err("402 received but no valid x402 headers found".to_string());
            }
        }

        // Success case
        let body = response.text().await.unwrap_or_default();
        
        Ok(FetchResult {
            status,
            body,
            payment_made: false,
            stream_id: None,
            amount_spent: None,
        })
    }

    /// Simulate fetching with a mock 402 response (for demo purposes)
    pub async fn fetch_with_mock_402(&self, url: &str, mock_requirement: X402PaymentRequirement) -> Result<FetchResult, String> {
        info!("📡 Fetching: {}", url);
        self.stats.requests_made.fetch_add(1, Ordering::Relaxed);

        // Simulate 402 response
        info!("⚠️  HTTP 402 Payment Required");
        info!("   {}", mock_requirement.display());

        // Trigger payment
        let proof = self.trigger_payment(&mock_requirement).await?;

        // Simulate successful retry
        info!("🔄 Retrying request with payment proof...");
        
        self.stats.payments_made.fetch_add(1, Ordering::Relaxed);

        Ok(FetchResult {
            status: 200,
            body: self.generate_mock_response(url),
            payment_made: true,
            stream_id: proof.stream_id,
            amount_spent: Some(proof.amount_paid),
        })
    }

    /// Trigger a payment based on the requirement
    async fn trigger_payment(&self, requirement: &X402PaymentRequirement) -> Result<PaymentProof, String> {
        match requirement.mode {
            PaymentMode::Streaming => {
                let deposit = requirement.min_deposit.clone()
                    .unwrap_or_else(|| "1.00".to_string());
                let rate = requirement.rate_per_second.clone()
                    .unwrap_or_else(|| "0.0001".to_string());
                
                info!("💳 Creating payment stream...");
                info!("   ├─ Deposit: {} MNEE", deposit);
                info!("   ├─ Rate: {}/sec", rate);
                
                // Generate stream ID (in real impl, this would call FlowPay contract)
                let stream_id = self.next_stream_id.fetch_add(1, Ordering::Relaxed);
                info!("   └─ Stream ID: #{}", stream_id);

                self.stats.active_streams.fetch_add(1, Ordering::Relaxed);
                
                // Track spending (convert to micro-units for atomic tracking)
                if let Ok(deposit_val) = deposit.parse::<f64>() {
                    let micro = (deposit_val * 1_000_000.0) as u64;
                    self.stats.total_spent.fetch_add(micro, Ordering::Relaxed);
                }

                Ok(PaymentProof::streaming(stream_id, &deposit))
            }
            PaymentMode::PerRequest => {
                let amount = requirement.amount.clone()
                    .unwrap_or_else(|| "0.001".to_string());
                
                info!("💳 Making per-request payment...");
                info!("   ├─ Amount: {} MNEE", amount);
                
                // Simulate tx hash
                let uuid_str = Uuid::new_v4().to_string().replace("-", "");
                let tx_hash = format!("0x{}", &uuid_str[..40.min(uuid_str.len())]);
                info!("   └─ TX: {}...", &tx_hash[..16]);

                // Track spending
                if let Ok(amount_val) = amount.parse::<f64>() {
                    let micro = (amount_val * 1_000_000.0) as u64;
                    self.stats.total_spent.fetch_add(micro, Ordering::Relaxed);
                }

                Ok(PaymentProof::per_request(&tx_hash, &amount))
            }
        }
    }

    /// Retry request with payment proof
    async fn retry_with_payment(&self, url: &str, proof: &PaymentProof) -> Result<FetchResult, String> {
        info!("🔄 Retrying request with payment proof...");

        let mut request = self.http_client.get(url);

        // Add payment proof headers
        match proof.mode {
            PaymentMode::Streaming => {
                if let Some(stream_id) = proof.stream_id {
                    request = request.header(headers::FLOWPAY_STREAM, stream_id.to_string());
                }
            }
            PaymentMode::PerRequest => {
                if let Some(ref tx_hash) = proof.tx_hash {
                    request = request.header("X-Payment-TxHash", tx_hash);
                }
            }
        }

        let response = request.send().await
            .map_err(|e| format!("Retry request failed: {}", e))?;

        let status = response.status().as_u16();
        let body = response.text().await.unwrap_or_default();

        if status == 200 {
            info!("✅ HTTP 200 OK - Payment verified!");
            self.stats.payments_made.fetch_add(1, Ordering::Relaxed);
        } else {
            warn!("⚠️ Unexpected status after payment: {}", status);
        }

        Ok(FetchResult {
            status,
            body,
            payment_made: true,
            stream_id: proof.stream_id,
            amount_spent: Some(proof.amount_paid.clone()),
        })
    }

    /// Generate mock response for demo
    fn generate_mock_response(&self, url: &str) -> String {
        if url.contains("weather") {
            r#"{"temperature": 28, "condition": "Sunny", "city": "Lagos", "humidity": 65}"#.to_string()
        } else if url.contains("translate") {
            r#"{"translated": "Bonjour le monde!", "source": "en", "target": "fr"}"#.to_string()
        } else if url.contains("compute") {
            r#"{"status": "completed", "result": 42, "compute_time_ms": 1250}"#.to_string()
        } else {
            r#"{"status": "ok", "data": "API response"}"#.to_string()
        }
    }

    /// Get total amount spent (in MNEE)
    pub fn total_spent(&self) -> f64 {
        self.stats.total_spent.load(Ordering::Relaxed) as f64 / 1_000_000.0
    }

    /// Display agent stats
    pub fn display_stats(&self) {
        info!("📊 Agent Stats:");
        info!("   ├─ Requests: {}", self.stats.requests_made.load(Ordering::Relaxed));
        info!("   ├─ Payments: {}", self.stats.payments_made.load(Ordering::Relaxed));
        info!("   ├─ Spent: {:.6} MNEE", self.total_spent());
        info!("   └─ Active Streams: {}", self.stats.active_streams.load(Ordering::Relaxed));
    }

    /// Use Gemini to decide whether to make a payment
    pub async fn should_pay(&self, requirement: &X402PaymentRequirement, context: &str) -> bool {
        let prompt = format!(
            r#"You are an AI payment agent. Should you pay for this service?

Service: {}
Payment Mode: {:?}
Cost: {} MNEE (rate: {} /sec)
Your Budget: {} MNEE
Already Spent: {:.4} MNEE

Context: {}

Respond with just YES or NO."#,
            requirement.description.clone().unwrap_or_else(|| "API Service".to_string()),
            requirement.mode,
            requirement.amount.clone().or(requirement.min_deposit.clone()).unwrap_or("unknown".to_string()),
            requirement.rate_per_second.clone().unwrap_or("N/A".to_string()),
            self.config.daily_budget,
            self.total_spent(),
            context
        );

        match self.gemini.generate(&prompt).await {
            Ok(response) => response.trim().to_uppercase().contains("YES"),
            Err(_) => true, // Default to paying if Gemini fails
        }
    }
}
