use actix_web::{web, HttpResponse, Responder};
use log::{info, warn};
use std::sync::Arc;
use std::time::Instant;

use crate::models::{BatchScoreResponse, HealthResponse, Transaction};
use crate::scoring::RiskScorer;

pub struct AppState {
    pub scorer: RiskScorer,
}

pub async fn health() -> impl Responder {
    HttpResponse::Ok().json(HealthResponse {
        status: "healthy".to_string(),
        service: "Rust Risk Scorer".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

pub async fn score_transaction(
    transaction: web::Json<Transaction>,
    data: web::Data<Arc<AppState>>,
) -> impl Responder {
    info!(
        "Scoring transaction {} for customer {}",
        transaction.transaction_id, transaction.customer_id
    );

    let risk_score = data.scorer.calculate(&transaction);

    if risk_score.risk_score > 75 {
        warn!(
            "Critical risk detected: transaction {} scored {}",
            risk_score.transaction_id, risk_score.risk_score
        );
    }

    HttpResponse::Ok().json(risk_score)
}

pub async fn batch_score(
    transactions: web::Json<Vec<Transaction>>,
    data: web::Data<Arc<AppState>>,
) -> impl Responder {
    let count = transactions.len();
    info!("Batch scoring {} transactions", count);

    let start = Instant::now();
    let scores: Vec<_> = transactions
        .iter()
        .map(|txn| data.scorer.calculate(txn))
        .collect();

    let processing_time = start.elapsed().as_millis();

    info!(
        "Batch processed {} transactions in {}ms ({:.2} txn/s)",
        count,
        processing_time,
        (count as f64 / processing_time as f64) * 1000.0
    );

    let response = BatchScoreResponse {
        scores,
        total_processing_time_ms: processing_time,
        count,
    };

    HttpResponse::Ok().json(response)
}
