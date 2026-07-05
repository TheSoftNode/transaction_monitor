use crate::models::{RiskLevel, RiskScore, Transaction};
use std::time::Instant;

const VERY_HIGH_VALUE_THRESHOLD: f64 = 1_000_000.0;
const LARGE_VALUE_THRESHOLD: f64 = 100_000.0;
const HIGH_VALUE_THRESHOLD: f64 = 10_000.0;
const MEDIUM_VALUE_THRESHOLD: f64 = 5_000.0;
const VERY_HIGH_VALUE_SCORE: u8 = 50;
const LARGE_VALUE_SCORE: u8 = 40;
const HIGH_VALUE_SCORE: u8 = 25;
const MEDIUM_VALUE_SCORE: u8 = 15;
const HIGH_RISK_COUNTRY_SCORE: u8 = 30;
const HIGH_RISK_CUSTOMER_SCORE: u8 = 25;
const MEDIUM_RISK_CUSTOMER_SCORE: u8 = 10;
const BLACKLIST_SCORE: u8 = 40;
const WITHDRAWAL_SCORE: u8 = 10;
const MAX_RISK_SCORE: u8 = 100;

// ISO 3166-1 alpha-2 codes, aligned with the Python BlacklistedCountryRule
// and the frontend's 2-letter country_code input.
static HIGH_RISK_COUNTRIES: &[&str] = &["KP", "IR", "SY", "CU", "VE"];

pub struct RiskScorer;

impl RiskScorer {
    pub fn new() -> Self {
        RiskScorer
    }

    pub fn calculate(&self, transaction: &Transaction) -> RiskScore {
        let start = Instant::now();
        let mut score: u8 = 0;
        let mut factors = Vec::new();

        self.evaluate_amount(transaction, &mut score, &mut factors);
        self.evaluate_geography(transaction, &mut score, &mut factors);
        self.evaluate_customer_risk(transaction, &mut score, &mut factors);
        self.evaluate_blacklist(transaction, &mut score, &mut factors);
        self.evaluate_transaction_type(transaction, &mut score, &mut factors);

        score = score.min(MAX_RISK_SCORE);
        let risk_level = RiskLevel::from_score(score);
        let processing_time = start.elapsed().as_micros();

        RiskScore {
            transaction_id: transaction.transaction_id.clone(),
            risk_score: score,
            risk_level,
            risk_factors: factors,
            processing_time_us: processing_time,
        }
    }

    fn evaluate_amount(&self, txn: &Transaction, score: &mut u8, factors: &mut Vec<String>) {
        if txn.amount >= VERY_HIGH_VALUE_THRESHOLD {
            *score += VERY_HIGH_VALUE_SCORE;
            factors.push(format!("Very high value: ${:.2}", txn.amount));
        } else if txn.amount >= LARGE_VALUE_THRESHOLD {
            *score += LARGE_VALUE_SCORE;
            factors.push(format!("Large value: ${:.2}", txn.amount));
        } else if txn.amount >= HIGH_VALUE_THRESHOLD {
            *score += HIGH_VALUE_SCORE;
            factors.push(format!("High value: ${:.2}", txn.amount));
        } else if txn.amount > MEDIUM_VALUE_THRESHOLD {
            *score += MEDIUM_VALUE_SCORE;
            factors.push(format!("Medium value: ${:.2}", txn.amount));
        }
    }

    fn evaluate_geography(&self, txn: &Transaction, score: &mut u8, factors: &mut Vec<String>) {
        if HIGH_RISK_COUNTRIES.contains(&txn.country_code.as_str()) {
            *score += HIGH_RISK_COUNTRY_SCORE;
            factors.push(format!("High-risk country: {}", txn.country_code));
        }
    }

    fn evaluate_customer_risk(&self, txn: &Transaction, score: &mut u8, factors: &mut Vec<String>) {
        match txn.customer_risk_level.as_str() {
            "high" => {
                *score += HIGH_RISK_CUSTOMER_SCORE;
                factors.push("High-risk customer".to_string());
            }
            "medium" => {
                *score += MEDIUM_RISK_CUSTOMER_SCORE;
                factors.push("Medium-risk customer".to_string());
            }
            _ => {}
        }
    }

    fn evaluate_blacklist(&self, txn: &Transaction, score: &mut u8, factors: &mut Vec<String>) {
        if txn.is_blacklisted {
            *score += BLACKLIST_SCORE;
            factors.push("Blacklisted customer".to_string());
        }
    }

    fn evaluate_transaction_type(
        &self,
        txn: &Transaction,
        score: &mut u8,
        factors: &mut Vec<String>,
    ) {
        if txn.transaction_type == "withdrawal" {
            *score += WITHDRAWAL_SCORE;
            factors.push("Withdrawal transaction".to_string());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_transaction() -> Transaction {
        Transaction {
            transaction_id: "TEST001".to_string(),
            customer_id: "CUST001".to_string(),
            amount: 1000.0,
            currency: "USD".to_string(),
            transaction_type: "deposit".to_string(),
            country_code: "USA".to_string(),
            customer_risk_level: "low".to_string(),
            is_blacklisted: false,
            timestamp: None,
        }
    }

    #[test]
    fn test_low_risk_transaction() {
        let scorer = RiskScorer::new();
        let txn = create_test_transaction();
        let result = scorer.calculate(&txn);

        assert!(result.risk_score <= 25);
    }

    #[test]
    fn test_high_value_transaction() {
        let scorer = RiskScorer::new();
        let mut txn = create_test_transaction();
        txn.amount = 15000.0;
        let result = scorer.calculate(&txn);

        assert!(result.risk_score >= 25);
    }

    #[test]
    fn test_amount_tiers_are_graduated() {
        let scorer = RiskScorer::new();

        let mut high = create_test_transaction();
        high.amount = 15_000.0;

        let mut large = create_test_transaction();
        large.amount = 150_000.0;

        let mut very_high = create_test_transaction();
        very_high.amount = 2_000_000.0;

        let high_score = scorer.calculate(&high).risk_score;
        let large_score = scorer.calculate(&large).risk_score;
        let very_high_score = scorer.calculate(&very_high).risk_score;

        assert!(high_score < large_score);
        assert!(large_score < very_high_score);
    }

    #[test]
    fn test_blacklisted_customer() {
        let scorer = RiskScorer::new();
        let mut txn = create_test_transaction();
        txn.is_blacklisted = true;
        let result = scorer.calculate(&txn);

        assert!(result.risk_score >= 40);
    }
}
