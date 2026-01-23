use serde::{Deserialize, Serialize};
use reqwest::Response;
use std::collections::HashMap;

/// x402 Payment Mode
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaymentMode {
    PerRequest,
    Streaming,
}

/// Payment requirement extracted from HTTP 402 response headers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct X402PaymentRequirement {
    pub recipient: String,
    pub amount: Option<String>,
    pub mode: PaymentMode,
    pub rate_per_second: Option<String>,
    pub min_deposit: Option<String>,
    pub description: Option<String>,
    pub network: Option<String>,
    pub token: Option<String>,
}

/// x402 header names
pub mod headers {
    pub const PAYMENT_REQUIRED: &str = "X-Payment-Required";
    pub const FLOWPAY_MODE: &str = "X-FlowPay-Mode";
    pub const FLOWPAY_RATE: &str = "X-FlowPay-Rate";
    pub const FLOWPAY_RECIPIENT: &str = "X-FlowPay-Recipient";
    pub const FLOWPAY_MIN_DEPOSIT: &str = "X-FlowPay-MinDeposit";
    pub const FLOWPAY_AMOUNT: &str = "X-FlowPay-Amount";
    pub const FLOWPAY_TOKEN: &str = "X-FlowPay-Token";
    pub const FLOWPAY_NETWORK: &str = "X-FlowPay-Network";
    pub const FLOWPAY_DESCRIPTION: &str = "X-FlowPay-Description";
    pub const FLOWPAY_STREAM: &str = "X-FlowPay-Stream";
}

impl X402PaymentRequirement {
    /// Parse x402 payment requirements from HTTP headers
    pub fn from_headers(headers: &HashMap<String, String>) -> Option<Self> {
        // Must have payment required header
        if !headers.contains_key(headers::PAYMENT_REQUIRED) {
            return None;
        }

        let recipient = headers.get(headers::FLOWPAY_RECIPIENT)?.clone();
        
        let mode = match headers.get(headers::FLOWPAY_MODE).map(|s| s.as_str()) {
            Some("streaming") | Some("stream") => PaymentMode::Streaming,
            _ => PaymentMode::PerRequest,
        };

        Some(Self {
            recipient,
            amount: headers.get(headers::FLOWPAY_AMOUNT).cloned(),
            mode,
            rate_per_second: headers.get(headers::FLOWPAY_RATE).cloned(),
            min_deposit: headers.get(headers::FLOWPAY_MIN_DEPOSIT).cloned(),
            description: headers.get(headers::FLOWPAY_DESCRIPTION).cloned(),
            network: headers.get(headers::FLOWPAY_NETWORK).cloned(),
            token: headers.get(headers::FLOWPAY_TOKEN).cloned(),
        })
    }

    /// Parse from actual reqwest Response headers
    pub fn from_response(response: &Response) -> Option<Self> {
        let headers = response.headers();
        
        // Check if payment required
        if !headers.contains_key(headers::PAYMENT_REQUIRED) {
            return None;
        }

        let recipient = headers.get(headers::FLOWPAY_RECIPIENT)?
            .to_str().ok()?.to_string();
        
        let mode = match headers.get(headers::FLOWPAY_MODE)
            .and_then(|v| v.to_str().ok()) 
        {
            Some("streaming") | Some("stream") => PaymentMode::Streaming,
            _ => PaymentMode::PerRequest,
        };

        Some(Self {
            recipient,
            amount: headers.get(headers::FLOWPAY_AMOUNT)
                .and_then(|v| v.to_str().ok()).map(String::from),
            mode,
            rate_per_second: headers.get(headers::FLOWPAY_RATE)
                .and_then(|v| v.to_str().ok()).map(String::from),
            min_deposit: headers.get(headers::FLOWPAY_MIN_DEPOSIT)
                .and_then(|v| v.to_str().ok()).map(String::from),
            description: headers.get(headers::FLOWPAY_DESCRIPTION)
                .and_then(|v| v.to_str().ok()).map(String::from),
            network: headers.get(headers::FLOWPAY_NETWORK)
                .and_then(|v| v.to_str().ok()).map(String::from),
            token: headers.get(headers::FLOWPAY_TOKEN)
                .and_then(|v| v.to_str().ok()).map(String::from),
        })
    }

    /// Display payment requirement in a user-friendly format
    pub fn display(&self) -> String {
        let mut lines = vec![
            format!("├─ Recipient: {}", self.recipient),
            format!("├─ Mode: {:?}", self.mode),
        ];

        if let Some(ref rate) = self.rate_per_second {
            lines.push(format!("├─ Rate: {} TCRO/second", rate));
        }
        if let Some(ref deposit) = self.min_deposit {
            lines.push(format!("├─ Min Deposit: {} TCRO", deposit));
        }
        if let Some(ref amount) = self.amount {
            lines.push(format!("├─ Amount: {} TCRO", amount));
        }
        if let Some(ref desc) = self.description {
            lines.push(format!("└─ Description: {}", desc));
        }

        lines.join("\n   ")
    }
}

/// Payment proof to include in retry requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentProof {
    pub stream_id: Option<u64>,
    pub tx_hash: Option<String>,
    pub amount_paid: String,
    pub mode: PaymentMode,
}

impl PaymentProof {
    pub fn streaming(stream_id: u64, deposit: &str) -> Self {
        Self {
            stream_id: Some(stream_id),
            tx_hash: None,
            amount_paid: deposit.to_string(),
            mode: PaymentMode::Streaming,
        }
    }

    pub fn per_request(tx_hash: &str, amount: &str) -> Self {
        Self {
            stream_id: None,
            tx_hash: Some(tx_hash.to_string()),
            amount_paid: amount.to_string(),
            mode: PaymentMode::PerRequest,
        }
    }
}
