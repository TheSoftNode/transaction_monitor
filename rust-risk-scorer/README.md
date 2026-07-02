# Risk Scorer Service

High-performance transaction risk scoring microservice.

## Overview

Standalone service for calculating transaction risk scores with microsecond-level latency.

## Project Structure

```
src/
├── main.rs       # Application entry point
├── api.rs        # HTTP handlers
├── config.rs     # Configuration management
├── models.rs     # Data models
└── scoring.rs    # Risk calculation engine
```

## API Endpoints

### Health Check
```
GET /health
```

### Score Transaction
```
POST /api/score
Content-Type: application/json

{
  "transaction_id": "TXN001",
  "customer_id": "CUST001",
  "amount": 15000.00,
  "currency": "USD",
  "transaction_type": "withdrawal",
  "country_code": "USA",
  "customer_risk_level": "medium",
  "is_blacklisted": false
}
```

Response:
```json
{
  "transaction_id": "TXN001",
  "risk_score": 50,
  "risk_level": "medium",
  "risk_factors": [
    "High value: $15000.00",
    "Medium-risk customer",
    "Withdrawal transaction"
  ],
  "processing_time_us": 42
}
```

### Batch Score
```
POST /api/batch-score
Content-Type: application/json

[
  { "transaction_id": "TXN001", ... },
  { "transaction_id": "TXN002", ... }
]
```

## Building

### Development
```bash
cargo build
cargo run
```

### Production
```bash
cargo build --release
./target/release/risk_scorer
```

### Docker
```bash
docker build -t risk-scorer .
docker run -p 8001:8001 risk-scorer
```

## Configuration

Environment variables:
- `HOST` - Bind address (default: 0.0.0.0)
- `PORT` - Port number (default: 8001)
- `RUST_LOG` - Log level (default: info)

## Testing

```bash
cargo test
```

## Integration

Python backend integration:

```python
import requests

response = requests.post(
    'http://localhost:8001/api/score',
    json=transaction_data
)
risk_score = response.json()
```

## Risk Algorithm

Scoring factors:
- Transaction amount (0-25 points)
- Geographic risk (0-30 points)
- Customer risk level (0-25 points)
- Blacklist status (0-40 points)
- Transaction type (0-10 points)

Risk levels:
- 0-25: Low
- 26-50: Medium
- 51-75: High
- 76-100: Critical
