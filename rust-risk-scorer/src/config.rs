use std::env;

pub struct Config {
    pub host: String,
    pub port: String,
    pub log_level: String,
}

impl Config {
    pub fn from_env() -> Self {
        Config {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT").unwrap_or_else(|_| "8001".to_string()),
            log_level: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        }
    }

    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}
