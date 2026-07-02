# ML-Based Anomaly Detection

## Overview

Machine learning module for detecting anomalous transactions using Isolation Forest algorithm.

## Features

- Unsupervised anomaly detection
- Feature extraction from transaction data
- Pre-trained model persistence
- Batch prediction support

## Usage

### Training

```python
from ml.anomaly_detector import detector

transactions = [
    {
        'amount': 1000.00,
        'transaction_type': 'deposit',
        'customer_risk_level': 'low',
        'is_blacklisted': False,
        'country_code': 'USA',
        'hour': 14,
        'day_of_week': 3
    },
    # ... more transactions
]

detector.train(transactions)
```

### Prediction

```python
result = detector.predict({
    'amount': 50000.00,
    'transaction_type': 'withdrawal',
    'customer_risk_level': 'high',
    'is_blacklisted': False,
    'country_code': 'USA',
    'hour': 2,
    'day_of_week': 6
})

if result['is_anomaly']:
    print(f"Anomaly detected! Score: {result['anomaly_score']}")
```

## Algorithm

Uses Isolation Forest (scikit-learn) with the following features:
- Transaction amount
- Hour of day
- Day of week
- Transaction type
- Customer risk level
- Blacklist status
- Country risk score

## Model Files

Models are saved to `ml/models/`:
- `anomaly_detector.pkl` - Trained Isolation Forest model
- `scaler.pkl` - Feature scaler

## Configuration

Contamination rate: 10% (assumes 10% of transactions are anomalous)
Number of estimators: 100 trees
