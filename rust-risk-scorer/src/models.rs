use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize, Clone)]
pub struct Transaction {
    pub transaction_id: String,
    pub customer_id: String,
    pub amount: f64,
    pub currency: String,
    pub transaction_type: String,
    pub country_code: String,
    pub customer_risk_level: String,
    pub is_blacklisted: bool,
    pub timestamp: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct RiskScore {
    pub transaction_id: String,
    pub risk_score: u8,
    pub risk_level: RiskLevel,
    pub risk_factors: Vec<String>,
    pub processing_time_us: u128,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {
    pub fn from_score(score: u8) -> Self {
        match score {
            0..=25 => RiskLevel::Low,
            26..=50 => RiskLevel::Medium,
            51..=75 => RiskLevel::High,
            _ => RiskLevel::Critical,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct BatchScoreResponse {
    pub scores: Vec<RiskScore>,
    pub total_processing_time_ms: u128,
    pub count: usize,
}
