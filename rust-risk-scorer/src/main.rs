mod api;
mod config;
mod models;
mod scoring;

use actix_web::{middleware, web, App, HttpServer};
use log::info;
use std::sync::Arc;

use api::AppState;
use config::Config;
use scoring::RiskScorer;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = Config::from_env();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or(&config.log_level));

    let app_state = Arc::new(AppState {
        scorer: RiskScorer::new(),
    });

    let bind_address = config.bind_address();
    info!("Starting Risk Scorer service on {}", bind_address);

    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::default())
            .app_data(web::Data::new(app_state.clone()))
            .route("/health", web::get().to(api::health))
            .route("/api/score", web::post().to(api::score_transaction))
            .route("/api/batch-score", web::post().to(api::batch_score))
    })
    .bind(&bind_address)?
    .run()
    .await
}
