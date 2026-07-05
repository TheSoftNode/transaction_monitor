# Transaction Monitoring Platform

A production-grade transaction monitoring platform with real-time risk assessment, event-driven architecture, and ML-powered anomaly detection.

[![Test Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)]()
[![Python](https://img.shields.io/badge/python-3.12-blue)]()
[![Django](https://img.shields.io/badge/django-5.0-green)]()
[![Next.js](https://img.shields.io/badge/next.js-16-black)]()
[![Rust](https://img.shields.io/badge/rust-scorer-orange)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

**Live demo:** Frontend → https://transaction-monitor-nu.vercel.app · API (HTTPS) → https://safeguard.urisocial.com · Swagger → https://safeguard.urisocial.com/api/schema/swagger-ui/

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Frontend Dashboard](#frontend-dashboard)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Risk Scoring](#risk-scoring)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Design Decisions](#design-decisions)
- [Trade-offs](#trade-offs)
- [Assumptions](#assumptions)

---

## ✨ Features

### Core Functionality

#### Backend API

- **RESTful API** with Django REST Framework
- **JWT Authentication** for secure access
- **Customer Management**: Create, list, and manage customers
- **Transaction Processing**: Create, list, retrieve, and update transactions
- **Advanced Filtering**: Search, filter, sort, and paginate results
- **API Versioning**: `/api/v1/` namespace for future compatibility
- **Swagger/OpenAPI**: Auto-generated interactive documentation
- **Input Validation**: Comprehensive request validation with detailed error messages
- **Proper Error Handling**: Structured error responses with request tracking

#### Rule Engine

- **Extensible Architecture**: Plugin-based rule system using Registry pattern
- **Dynamic Rule Loading**: Database-driven rule configuration (`RuleConfiguration`)
- **Pre-built Rules** (in `rules/plugins/`):
  - `HighValueTransactionRule` — transaction amount above a threshold (default $10,000)
  - `VelocityRule` — more than N transactions within a time window (default >5 / 1 hour)
  - `BlacklistedCountryRule` — customer country in a blacklist (KP, IR, SY, CU, VE)
  - `HighRiskCustomerRule` — high-risk or blacklisted customer
- **Risk Scoring**: Automatic risk score calculation (0-100)
- **Alert Generation**: Create alerts when rules trigger
- **Audit Logging**: Complete audit trail of all rule evaluations
- **Easy Extension**: Add new rules by extending `BaseRule` class

#### Event-Driven Architecture

- **Apache Kafka**: Production-grade message broker
- **Async Processing**: Independent event processor service
- **Transaction Events**: Publish `transaction.created` events
- **Event Handlers**: Modular handler system for different event types
- **Rust Integration**: High-performance risk scoring via Rust microservice
- **Fault Tolerance**: Graceful degradation and error handling

#### Production Readiness

- **Structured Logging**: JSON logging with request IDs for traceability
- **Health Endpoint**: `/health/` - Database and cache health checks
- **Metrics Endpoint**: `/metrics` - Prometheus-compatible metrics
- **Rate Limiting**: API rate limiting to prevent abuse
- **Request Validation**: Comprehensive input validation
- **Exception Handling**: Global exception handler with proper HTTP status codes
- **Database Indexing**: Optimized indexes for common queries
- **Centralized Configuration**: Environment-based settings management

#### DevOps & Deployment

- **Docker Containerization**: Multi-stage Docker builds for optimization
- **Docker Compose**: Single-command deployment (`docker compose up`)
- **Database Migrations**: Automated Django migrations
- **Seed Data**: Sample data for testing and demonstration
- **Environment Configuration**: `.env.example` with secure defaults
- **Production Scripts**: Health checks, deployment automation

#### Testing

- **70%+ Code Coverage**: Enforced as a CI gate (`--cov-fail-under=70`)
- **123 Tests**: Covering all critical paths
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow validation
- **API Tests**: All endpoints with various scenarios
- **Authentication Tests**: JWT token validation
- **Rule Engine Tests**: All rules and edge cases
- **CI Integration**: Automated testing in GitHub Actions

### Advanced Features

#### Rust Microservice

- **High-Performance Risk Scoring**: Rust service for performance-critical operations
- **RESTful API**: Independent service on port 8001
- **Docker Integration**: Seamlessly integrated with Docker Compose
- **Health Checks**: Monitoring and observability

#### CI/CD Pipeline

- **GitHub Actions**: Automated testing and deployment
- **Continuous Integration**: Run tests on every push/PR
- **Continuous Deployment**: Auto-deploy to Azure VM on push to `main`
- **Path-Based Triggers**: Only deploy when backend/rust code changes

#### Observability

- **Prometheus Integration**: Metrics collection and monitoring
- **Grafana Dashboard**: Real-time visualization
- **Custom Metrics**: Transaction counts, risk scores, ML predictions
- **Alerting**: Prometheus alerting rules

#### ML/AI Anomaly Detection

- **Isolation Forest**: Unsupervised anomaly detection
- **Feature Engineering**: Transaction amount, time, customer behavior
- **Real-Time Scoring**: ML prediction on every transaction
- **Model Training**: `python manage.py train_ml_model`
- **Metrics API**: `/api/v1/transactions/ml-metrics/`
- **Scikit-learn**: Production ML library

#### Infrastructure as Code

- **Kubernetes Manifests**: Complete K8s deployment configurations
- **Terraform**: Infrastructure provisioning (AWS-based)

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐     │
│  │  Next.js UI  │────▶│   Swagger    │◀───│   Grafana    │     │
│  │  (Vercel)    │     │ Documentation│    │  Dashboard   │     │
│  └──────────────┘     └──────────────┘    └──────────────┘     │
└────────────────┬───────────────────────────────────┬────────────┘
                 │                                   │
                 ▼                                   ▼
┌────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Django REST Framework                        │  │
│  │  • JWT Authentication  • Rate Limiting                    │  │
│  │  • Request Validation  • API Versioning                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬────────────┬────────────┬────────────┬────────────────┘
         │            │            │            │
         ▼            ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Application Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Customers   │  │Transactions │  │   Alerts    │             │
│  │   Service   │  │   Service   │  │   Service   │             │
│  └─────────────┘  └──────┬──────┘  └─────────────┘             │
│                           │                                       │
│                           ▼                                       │
│                  ┌─────────────────┐                             │
│                  │   Rule Engine   │                             │
│                  │  (Extensible)   │                             │
│                  └─────────┬───────┘                             │
│                            │                                      │
│                  ┌─────────┴───────┐                             │
│                  │                 │                              │
│                  ▼                 ▼                              │
│         ┌────────────────┐ ┌──────────────┐                     │
│         │  Rust Scorer   │ │ ML Detector  │                     │
│         │ (Performance)  │ │  (Anomaly)   │                     │
│         └────────────────┘ └──────────────┘                     │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                  │
           ▼                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                    Event Processing Layer                        │
│  ┌────────────────┐        ┌──────────────────────────┐        │
│  │ Kafka Producer │───────▶│    Apache Kafka          │        │
│  │  (In Django)   │        │  Topic: transaction.     │        │
│  └────────────────┘        │         created          │        │
│                            └───────────┬──────────────┘        │
│                                        │                         │
│                                        ▼                         │
│                            ┌──────────────────────────┐         │
│                            │   Event Processor        │         │
│                            │  (Independent Service)   │         │
│                            │  • Consume Events        │         │
│                            │  • Call Rust Scorer      │         │
│                            │  • Update Risk Score     │         │
│                            │  • Create Audit Log      │         │
│                            └──────────────────────────┘         │
└────────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ PostgreSQL │  │   Redis    │  │ Prometheus │               │
│  │ (Primary)  │  │  (Cache)   │  │ (Metrics)  │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client Request** → API Gateway (Django)
2. **Authentication** → JWT Token Validation
3. **Rate Limiting** → Check request rate
4. **Validation** → Serializer validation
5. **Business Logic** → Create transaction
6. **ML Prediction** → Anomaly detection (optional warning if untrained)
7. **Event Publishing** → Kafka `transaction.created` event
8. **Response** → Return transaction data

9. **Background Processing** (Async):
   - Event Processor consumes Kafka event
   - Calls Rust scorer for risk calculation
   - Executes Rule Engine
   - Creates alerts if rules triggered
   - Updates transaction risk score
   - Creates audit log

### Data Flow

```
Transaction Creation Flow:
─────────────────────────

POST /api/v1/transactions/
         │
         ├──▶ JWT Auth
         ├──▶ Validate Input
         ├──▶ Save to PostgreSQL
         ├──▶ ML Anomaly Check (Metadata)
         ├──▶ Increment Prometheus Counter
         ├──▶ Publish Kafka Event
         │
         └──▶ Return HTTP 201

Background Processing:
─────────────────────
Kafka Consumer (Event Processor)
         │
         ├──▶ Call Rust Scorer API
         ├──▶ Run Rule Engine
         ├──▶ Calculate Risk Score
         ├──▶ Create Alerts
         ├──▶ Update Transaction
         └──▶ Create Audit Log
```

---

## 🛠️ Technology Stack

### Backend

- **Python 3.12**: Core language
- **Django 5.0**: Web framework
- **Django REST Framework**: API framework
- **PostgreSQL 15**: Primary database
- **Redis 7**: Caching and sessions
- **Apache Kafka**: Event streaming
- **Gunicorn**: WSGI HTTP server

### Additional Services

- **Rust**: High-performance risk scoring microservice
- **Scikit-learn**: ML anomaly detection
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards

### Development & Testing

- **pytest**: Test framework
- **pytest-django**: Django integration
- **pytest-cov**: Code coverage
- **Docker & Docker Compose**: Containerization

### DevOps

- **GitHub Actions**: CI/CD
- **Azure VM**: Production hosting
- **Kubernetes**: Orchestration manifests (prepared)
- **Terraform**: Infrastructure as Code (AWS, needs Azure conversion)

---

## 🚀 Quick Start

### Prerequisites

- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/TheSoftNode/transaction_monitor.git
cd transaction_monitor
```

### 2. Environment Setup

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Review and update environment variables (optional)
# Default configuration works out of the box
```

### 3. Start All Services

```bash
# Start entire stack with one command
docker compose up -d

# This will start:
# - PostgreSQL database
# - Redis cache
# - Kafka + Zookeeper
# - Django backend API
# - Event Processor
# - Rust Risk Scorer
# - Prometheus
# - Grafana
```

### 4. Access Services

- **API**: http://localhost:8000
- **Swagger Documentation**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc Documentation**: http://localhost:8000/api/schema/redoc/
- **Health Check**: http://localhost:8000/health/
- **Metrics**: http://localhost:8000/metrics
- **Rust Scorer**: http://localhost:8001
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: (see `.env` file)

### 5. Create Superuser

```bash
docker exec -it transaction-monitor-backend python manage.py createsuperuser
```

### 6. Access Admin Panel

http://localhost:8000/admin

### 7. Test API

```bash
# Login to get a JWT token (live API; for local use http://localhost:8000)
curl -X POST https://safeguard.urisocial.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Use the token for authenticated requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://safeguard.urisocial.com/api/v1/transactions/
```

---

## 🎨 Frontend Dashboard

A responsive **Next.js 16 (React 19) + TypeScript** dashboard that consumes **only** the backend REST API.

**Live:** https://transaction-monitor-nu.vercel.app

### Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Redux Toolkit + RTK Query** for data fetching, caching, and JWT token injection
- **Tailwind CSS v4** + **shadcn/ui** components
- **framer-motion** (animations), **recharts** (charts), **sonner** (toasts)

### Features (assessment Part 4)

- JWT **login & registration** pages
- **Transactions** table with search, status filters, pagination, and a details view
- **Customers** table
- **Alerts** list
- **Create Transaction** modal with a searchable **customer dropdown** — select a customer or type a reference; shows “the customer with that reference does not exist” for unknown references
- Responsive design with loading and error states

### Run locally

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

> By default the app targets the deployed HTTPS API. To use a local backend, set `API_URL` in `frontend/types/index.ts` to `http://localhost:8000/api/v1`.

---

## 📁 Project Structure

```
transaction-monitor/
├── backend/                      # Django backend application
│   ├── apps/                     # Django applications
│   │   ├── authentication/       # JWT authentication
│   │   ├── customers/            # Customer management
│   │   ├── transactions/         # Transaction processing
│   │   │   ├── management/commands/
│   │   │   │   └── train_ml_model.py  # ML model training
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py         # Includes ML integration
│   │   │   └── filters.py
│   │   ├── alerts/               # Alerts and audit logs
│   │   └── monitoring/           # Health and metrics endpoints
│   │
│   ├── rules/                    # Rule Engine
│   │   ├── base.py              # BaseRule abstract class
│   │   ├── registry.py          # Rule registry (decorator-based)
│   │   ├── engine.py            # Rule execution engine (+ Rust integration)
│   │   ├── plugins/             # Pre-built rules (one file per rule)
│   │   │   ├── high_value.py
│   │   │   ├── velocity.py
│   │   │   ├── geographic.py
│   │   │   └── customer_risk.py
│   │   └── models.py            # RuleConfiguration
│   │
│   ├── ml/                       # Machine Learning
│   │   ├── anomaly_detector.py  # Isolation Forest ML model
│   │   ├── feature_engineering.py
│   │   └── models/              # Trained model storage
│   │
│   ├── event_processor/          # Kafka event consumer
│   │   ├── main.py              # Consumer entry point
│   │   ├── handlers.py          # Event handlers
│   │   └── config.py            # Kafka configuration
│   │
│   ├── infrastructure/           # Infrastructure as Code
│   │   ├── k8s/                 # Kubernetes manifests
│   │   │   ├── deployments/
│   │   │   ├── services/
│   │   │   ├── configmaps/
│   │   │   └── ingress/
│   │   └── terraform/           # Terraform (AWS)
│   │       ├── main.tf
│   │       ├── modules/
│   │       └── terraform.tfvars.example
│   │
│   ├── middleware/               # Custom middleware
│   │   ├── request_id.py        # Request ID tracking
│   │   └── exception_handler.py # Global exception handling
│   │
│   ├── core/                     # Core utilities
│   │   ├── rust_client.py       # Rust service client
│   │   ├── pagination.py        # Custom pagination
│   │   └── exceptions.py        # Custom exceptions
│   │
│   ├── config/                   # Django configuration
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   ├── production.py
│   │   │   └── test.py
│   │   └── urls.py
│   │
│   ├── tests/                    # Test suite (70%+ coverage)
│   │   ├── conftest.py          # Shared fixtures
│   │   ├── api/                 # API tests (auth, customers, transactions)
│   │   ├── integration/         # End-to-end workflow tests
│   │   ├── rules/               # Rule engine tests
│   │   ├── test_serializers.py
│   │   ├── test_views_extended.py
│   │   └── test_monitoring.py
│   │
│   ├── scripts/                  # Deployment scripts
│   │   ├── start-production.sh
│   │   └── start-event-processor.sh
│   │
│   ├── requirements/             # Python dependencies
│   │   ├── base.txt
│   │   ├── development.txt
│   │   ├── production.txt
│   │   ├── test.txt
│   │   └── ai.txt               # ML dependencies
│   │
│   ├── Dockerfile               # Backend container
│   ├── docker-compose.prod.yml  # Production compose
│   ├── .env.example            # Environment template
│   ├── manage.py
│   └── pytest.ini
│
├── frontend/                    # Next.js 16 + TypeScript dashboard
│   ├── app/                     # App Router pages
│   │   ├── auth/                # Login / Register
│   │   └── dashboard/           # Transactions, Customers, Alerts
│   ├── components/              # UI components (shadcn/ui)
│   ├── features/                # RTK Query API slices (per domain)
│   ├── lib/redux/               # Store + base API config
│   └── types/                   # Shared TypeScript types
│
├── rust-risk-scorer/            # Rust microservice
│   ├── src/
│   │   ├── main.rs
│   │   ├── scorer.rs
│   │   └── models.rs
│   ├── Cargo.toml
│   └── Dockerfile
│
├── .github/workflows/           # CI/CD pipelines
│   ├── backend-ci.yml          # Automated testing
│   └── backend-cd.yml          # Azure deployment
│
├── backend/grafana-dashboard.json  # Grafana dashboard
├── docker-compose.yml           # Development compose
└── README.md                    # This file
```

---

## 📚 API Documentation

### Interactive Documentation

**Live (production):**

- **Swagger UI**: https://safeguard.urisocial.com/api/schema/swagger-ui/
- **ReDoc**: https://safeguard.urisocial.com/api/schema/redoc/
- **OpenAPI Schema**: https://safeguard.urisocial.com/api/schema/

_Local (after `docker compose up`): use `http://localhost:8000` instead of the domain._

### Authentication

All endpoints (except `/health/` and `/metrics`) require JWT authentication.

```bash
# Get access token
POST /api/v1/auth/login/
{
  "username": "admin",
  "password": "your_password"
}

# Response
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# Use token in headers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Core Endpoints

#### Customers

```
GET    /api/v1/customers/           # List customers
POST   /api/v1/customers/           # Create customer
GET    /api/v1/customers/{id}/      # Get customer details
PUT    /api/v1/customers/{id}/      # Update customer
DELETE /api/v1/customers/{id}/      # Delete customer
```

#### Transactions

```
GET    /api/v1/transactions/        # List transactions
POST   /api/v1/transactions/        # Create transaction
GET    /api/v1/transactions/{id}/   # Get transaction details
PATCH  /api/v1/transactions/{id}/status/  # Update status
GET    /api/v1/transactions/ml-metrics/   # ML model metrics
```

#### Alerts

```
GET    /api/v1/alerts/              # List alerts
GET    /api/v1/alerts/{id}/         # Get alert details
GET    /api/v1/audit-logs/          # List audit logs
```

#### Monitoring

```
GET    /health/                     # Health check
GET    /metrics                     # Prometheus metrics
```

### Query Parameters

All list endpoints support:

- **Pagination**: `?page=1&page_size=20`
- **Filtering**: `?status=pending&risk_score__gte=50`
- **Searching**: `?search=john`
- **Ordering**: `?ordering=-created_at`

### Example: Create Transaction

```bash
POST /api/v1/transactions/
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "customer": "uuid-here",
  "transaction_reference": "TXN-2024-001",
  "amount": 15000.00,
  "currency": "USD",
  "transaction_type": "withdrawal",
  "description": "Large withdrawal"
}

# Response
{
  "id": "uuid",
  "transaction_reference": "TXN-2024-001",
  "customer": "uuid",
  "amount": "15000.00",
  "currency": "USD",
  "transaction_type": "withdrawal",
  "status": "under_review",
  "risk_score": 75,
  "metadata": {
    "ml_prediction": {
      "is_anomaly": false,
      "anomaly_score": 0.0,
      "confidence": 0.0,
      "warning": "Model not trained"
    }
  },
  "created_at": "2024-07-04T10:00:00Z",
  "processed_at": "2024-07-04T10:00:01Z"
}
```

---

## 🎯 Risk Scoring

Every transaction receives a **risk score (0–100)**. The **Rust scorer** computes the authoritative score (with graceful fallback to the Python engine if it is unavailable), while the **Python rule engine** always runs to generate **alerts** and **audit logs**.

### Scoring factors

The score is the sum of the factors below, capped at 100:

| Factor                                 | Points |
| -------------------------------------- | ------ |
| Amount ≥ $1,000,000                    | +50    |
| Amount ≥ $100,000                      | +40    |
| Amount ≥ $10,000                       | +25    |
| Amount > $5,000                        | +15    |
| High-risk country (KP, IR, SY, CU, VE) | +30    |
| Blacklisted customer                   | +40    |
| High-risk customer                     | +25    |
| Medium-risk customer                   | +10    |
| Withdrawal transaction                 | +10    |

> Amount scoring is **graduated** — larger transactions score higher (up to +50), instead of a flat value.

### Risk levels

| Score  | Level    |
| ------ | -------- |
| 0–25   | Low      |
| 26–50  | Medium   |
| 51–75  | High     |
| 76–100 | Critical |

The dashboard's **"High Risk"** stat counts transactions scoring **≥ 70**.

### Examples

| Transaction                             | Score |
| --------------------------------------- | ----- |
| $500 deposit — low-risk US customer     | 0     |
| $10,000 deposit                         | 25    |
| $150,000 deposit                        | 40    |
| $10,000,000 deposit                     | 50    |
| $1M deposit — blacklisted customer      | 90    |
| $100k transfer from a high-risk country | 70    |

> Because the amount factor alone caps at 50, a transaction only becomes **High Risk (≥ 70)** when factors **stack** — e.g. a large amount **plus** a blacklisted/high-risk customer or a high-risk country.

---

## 🧪 Testing

### Run All Tests

```bash
# Inside container
docker exec transaction-monitor-backend pytest

# With coverage report
docker exec transaction-monitor-backend pytest --cov=. --cov-report=html

# View coverage report
open backend/htmlcov/index.html
```

### Test Coverage

**Current Coverage: ~71%** — CI enforces a minimum of **70%** via `--cov-fail-under=70`.

Highlights:

```
rules/engine.py                    98%
rules/plugins/*                 93-100%
apps/alerts/{models,views}.py   97-100%
apps/customers/*                91-100%
apps/transactions/models.py       100%
apps/transactions/serializers.py   93%
```

### Test Categories

```bash
# API endpoint tests (auth, customers, transactions)
pytest tests/api/ -v

# Rule engine tests
pytest tests/rules/ -v

# Integration / end-to-end workflow tests
pytest tests/integration/ -v

# Serializer & extended view tests
pytest tests/test_serializers.py tests/test_views_extended.py -v
```

---

## 🌐 Production Deployment

### Current Deployment

| Component                                 | URL                                                    |
| ----------------------------------------- | ------------------------------------------------------ |
| **Frontend** (Vercel)                     | https://transaction-monitor-nu.vercel.app              |
| **API** (HTTPS via nginx + Let's Encrypt) | https://safeguard.urisocial.com                        |
| **Swagger**                               | https://safeguard.urisocial.com/api/schema/swagger-ui/ |

The backend runs on an **Azure VM (Ubuntu 24.04)** via Docker Compose. A
containerized **nginx** reverse proxy terminates TLS (Let's Encrypt certificate,
auto-renewed) for `safeguard.urisocial.com` and proxies to the backend on port 8000. The frontend is deployed on **Vercel** and consumes only the backend API.

#### Services Running (Docker Compose)

- ✅ Backend API (Django + Gunicorn, Port 8000)
- ✅ Event Processor (independent Kafka consumer)
- ✅ Rust Scorer (Port 8001)
- ✅ PostgreSQL (Port 5432)
- ✅ Redis (Port 6379)
- ✅ Kafka + Zookeeper (Port 9092)
- ✅ Prometheus (Port 9090)
- ✅ Grafana (Port 3000)
- ✅ nginx (TLS termination, Ports 80/443)

#### Automated Deployment

Every push to `main` branch triggers:

1. **CI Pipeline**: Run all tests
2. **CD Pipeline**: Deploy to Azure VM
3. **Zero-Downtime**: Rolling restart of backend services
4. **Health Checks**: Verify deployment success

### Manual Deployment

```bash
# SSH to Azure VM
ssh -i ~/.ssh/uripg_key.pem uripg@40.127.13.42

# Pull latest code
cd ~/transaction_monitor
git pull origin main

# Rebuild and restart
cd backend
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend event-processor

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Production Monitoring

- **Health**: https://safeguard.urisocial.com/health/
- **Metrics**: https://safeguard.urisocial.com/metrics
- **API Docs**: https://safeguard.urisocial.com/api/schema/swagger-ui/
- **Prometheus**: http://40.127.13.42:9090
- **Grafana**: http://40.127.13.42:3000

---

## 🎯 Design Decisions

### 1. **Rule Engine: Registry Pattern**

**Decision**: Implement a plugin-based rule system using a registry pattern instead of hardcoding rules.

**Rationale**:

- **Extensibility**: New rules can be added by simply creating a new class and registering it
- **Maintainability**: Each rule is isolated and testable independently
- **Dynamic Configuration**: Rules can be enabled/disabled via database without code changes
- **Priority System**: Rules execute in order of priority

**Implementation**:

```python
class BaseRule:
    def evaluate(self, transaction, customer) -> RuleResult:
        raise NotImplementedError

@RuleRegistry.register("high_amount_rule")
class HighAmountRule(BaseRule):
    def evaluate(self, transaction, customer):
        # Rule logic
```

### 2. **Event-Driven Architecture with Kafka**

**Decision**: Use Apache Kafka for event-driven transaction processing instead of synchronous calls.

**Rationale**:

- **Decoupling**: API and risk processing are independent
- **Scalability**: Event processors can scale horizontally
- **Reliability**: Events are persisted; no data loss
- **Performance**: API responds immediately without waiting for risk calculation
- **Audit Trail**: Complete event history in Kafka

**Trade-off**: Eventual consistency - risk scores updated asynchronously

### 3. **Rust Microservice for Risk Scoring**

**Decision**: Implement performance-critical risk scoring in Rust as a separate microservice, integrated with the Python rule engine.

**Rationale**:

- **Performance**: Rust is 10-100x faster than Python for CPU-intensive operations
- **Concurrency**: Excellent for high-throughput scoring
- **Type Safety**: Prevents runtime errors in critical paths
- **Polyglot Architecture**: Best tool for each job

**Integration**: The rule engine always runs the Python rules (to generate alerts + audit logs), and when the Rust scorer is enabled it supplies the **authoritative risk score** while the rule-based alerts are preserved. If Rust is unavailable, the engine gracefully falls back to the Python-computed score.

### 4. **ML Anomaly Detection (Optional Warning)**

**Decision**: Integrate ML-based anomaly detection that returns warnings when untrained.

**Rationale**:

- **Graceful Degradation**: System works even without trained model
- **Transparency**: Users see ML is active but needs training
- **Flexibility**: ML can be trained when sufficient data available
- **Metadata Storage**: All ML results stored for analysis

**Training**: `python manage.py train_ml_model` (requires 100+ transactions)

### 5. **Multi-Environment Configuration**

**Decision**: Separate settings files for dev, test, and production environments.

**Rationale**:

- **Security**: Different secrets for each environment
- **Flexibility**: Environment-specific optimizations
- **Safety**: Prevent production data in development
- **Best Practice**: Industry-standard approach

**Structure**:

```
settings/
├── base.py        # Shared settings
├── development.py # Debug=True, local DB
├── production.py  # Security hardened
└── test.py        # Fast test database
```

### 6. **API Versioning**

**Decision**: Version API with `/api/v1/` prefix from the start.

**Rationale**:

- **Future-Proofing**: Easy to add v2 without breaking existing clients
- **Best Practice**: RESTful API standard
- **Client Stability**: Older clients continue working when new version released

### 7. **PostgreSQL Over NoSQL**

**Decision**: Use PostgreSQL as primary database instead of NoSQL alternatives.

**Rationale**:

- **ACID Compliance**: Financial data requires strong consistency
- **Complex Queries**: Support for joins, aggregations, filtering
- **Proven Reliability**: Battle-tested for transactional systems
- **JSON Support**: Hybrid approach with `metadata` JSONField

### 8. **Docker Compose for Local Development**

**Decision**: Use Docker Compose instead of requiring local installs.

**Rationale**:

- **Consistency**: Same environment for all developers
- **Simplicity**: `docker compose up` starts everything
- **Isolation**: No conflicts with local system
- **Production Parity**: Similar to production deployment

---

## ⚖️ Trade-offs

### 1. **Eventual Consistency**

Risk scores are calculated asynchronously via Kafka, so they're not immediately available when a transaction is created. This gives us better API performance and scalability, but clients need to poll or use webhooks for the final risk score. In practice, processing happens in under 1 second.

### 2. **ML Model Training**

The ML anomaly detector needs at least 100 transactions before it can be trained. Until then, it returns a "Model not trained" warning. This is fine because the rule-based engine still works, and you can load seed data for testing.

### 3. **Kafka for Events**

We use Kafka because it's the industry standard for event streaming - reliable, scalable, and maintains a complete audit trail. Yes, a single broker setup is a potential failure point, but Kafka restarts quickly and doesn't lose data. For production scale, you'd run a 3-broker cluster. We kept it simple here with Docker Compose.

### 4. **Kubernetes & Terraform Prepared But Not Deployed**

We have full Kubernetes manifests and Terraform configs ready, but chose Docker Compose for the current deployment. Why? Docker Compose is simpler to set up, easier to debug, and perfectly adequate for the current scale. K8s and Terraform add complexity that's only worth it at higher scale or when you need advanced orchestration features. They're there when needed.

### 5. **Rust Microservice**

The Rust service adds another moving part to maintain, but it's 10-100x faster than Python for risk calculations. Worth it for performance-critical operations, especially under high load.

### 6. **Next.js Frontend Consuming Only the API**

The dashboard is a separate Next.js app (deployed on Vercel) that consumes only the backend REST API — no shared code or direct database access. This keeps a clean separation, lets frontend and backend deploy/scale independently, and makes the Swagger-documented API contract the single integration point. The trade-off is that browser calls from the HTTPS frontend require the backend to be served over HTTPS too (handled by the nginx + Let's Encrypt proxy) and CORS must be configured.

---

## 📝 Assumptions

### Business Assumptions

1. **Transaction Lifecycle**:
   - Transactions start in `pending` status
   - Only valid statuses: `pending`, `under_review`, `approved`, `rejected`
   - Status can only move forward (no reversal)

2. **Risk Scoring**:
   - Risk scores range from 0-100 (higher = riskier)
   - Multiple rules can contribute to final score
   - Scores above 70 automatically trigger `under_review` status

3. **Customers**:
   - One customer can have many transactions
   - Customer risk level affects transaction risk
   - Blacklisted customers don't automatically reject (flagged for review)

4. **Alerts**:
   - Each rule violation creates a separate alert
   - Alerts are informational; they don't block transactions
   - All alerts are logged to audit trail

### Technical Assumptions

1. **Authentication**:
   - JWT tokens expire after 1 hour
   - Refresh tokens valid for 1 week
   - Admin creates initial superuser account

2. **Data Persistence**:
   - PostgreSQL handles all persistent data
   - Redis used for caching only (can be flushed)
   - Kafka retains events for 7 days

3. **Event Processing**:
   - Events processed in order (FIFO)
   - Failed events retry 3 times
   - Dead letter queue for permanently failed events

4. **API Behavior**:
   - All timestamps in UTC
   - Pagination defaults to 20 items per page
   - Search is case-insensitive
   - Deleted items are soft-deleted (not shown in API)

5. **Rule Engine**:
   - Rules execute in priority order (highest first)
   - All active rules evaluated (short-circuit not used)
   - Rule parameters stored as JSON

6. **ML Model**:
   - Isolation Forest with 5% contamination rate
   - Requires minimum 100 transactions for training
   - Model retrained manually (not automatic)
   - Feature extraction uses customer transaction history

### Infrastructure Assumptions

1. **Development**:
   - Docker and Docker Compose available
   - At least 4GB RAM for Docker
   - Ports 8000, 8001, 5432, 6379, 9090, 9092, 3000 available

2. **Production**:
   - Azure VM with Ubuntu 24.04
   - Docker and Docker Compose installed
   - Firewall configured for required ports
   - GitHub Actions has SSH access

3. **Scaling**:
   - Current architecture supports 1000 requests/minute
   - Event processor handles 100 events/second
   - Database can store millions of transactions

---

## 📊 Metrics & Monitoring

### Prometheus Metrics

```
# Transaction metrics
transactions_total              # Total transactions created
ml_anomalies_detected          # ML-detected anomalies

# API metrics
api_request_duration_seconds   # Request latency histogram
```

### Health Checks

```bash
# Backend health (live). For local use http://localhost:8000/health/
curl https://safeguard.urisocial.com/health/
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "cache": "healthy"
  }
}

# Rust scorer health (internal service; local use http://localhost:8001/health)
curl http://40.127.13.42:8001/health
{
  "status": "ok"
}
```

### Grafana Dashboard

Pre-configured dashboard includes:

- Transaction volume over time
- Risk score distribution
- ML anomaly detection rate
- API response times
- System resource usage

---

## 🔐 Security

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: Django middleware
- **CORS Configuration**: Controlled cross-origin access
- **Secret Management**: Environment variables, not hardcoded
- **HTTPS Ready**: Production configuration includes SSL settings
- **Database Encryption**: Supports encrypted connections

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 📄 License

MIT License

---

## 📧 Contact

**Author**: Theophilus Onyebuchi
**Email**: thesoftnode@gmail.com
**GitHub**: https://github.com/TheSoftNode/transaction_monitor

---

## 🙏 Acknowledgments

- **Django** and **DRF** communities for excellent documentation
- **Rust** community for performance-critical tools
- **Apache Kafka** for reliable event streaming
- **Scikit-learn** for accessible ML tools
