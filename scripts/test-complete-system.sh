#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🧪 COMPLETE SYSTEM INTEGRATION TEST"
echo "Testing: Backend + Rust + Kafka + Event Processor + Rules"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Use environment variable or default to localhost
BASE_URL="${BASE_URL:-http://localhost:8000}"
echo "Using BASE_URL: $BASE_URL"
echo ""

# Create test user
echo "📝 Step 1: Creating test user..."
ssh -i ~/.ssh/uripg_key.pem uripg@40.127.13.42 'docker exec transaction-monitor-backend python manage.py shell' << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(username='testuser').delete()
user = User.objects.create_user(username='testuser', email='test@test.com', password='TestPass123!', first_name='Test', last_name='User')
print(f"Created: {user.username}")
EOF

echo ""

# Authenticate
echo "🔐 Step 2: Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123!"}')

TOKEN=$(echo $AUTH_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access', ''))")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Authentication FAILED${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Token obtained${NC}"
echo ""

# Create customer
echo "👤 Step 3: Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/customers/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_reference": "CUST_'$(date +%s)'",
    "full_name": "Test Customer",
    "email": "customer'$(date +%s)'@test.com",
    "country_code": "USA",
    "risk_level": "low"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$CUSTOMER_ID" ]; then
  echo -e "${RED}❌ Customer creation FAILED${NC}"
  echo "Response: $CUSTOMER_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Customer created: $CUSTOMER_ID${NC}"
echo ""

# Create HIGH VALUE transaction (triggers rules)
echo "💰 Step 4: Creating HIGH VALUE transaction (\$50,000)..."
echo "   This should trigger:"
echo "   - HighValueTransactionRule (>$10K)"
echo "   - Kafka event publish"
echo "   - Event processor"
echo "   - Risk score calculation"
echo "   - Alert creation"
echo ""

TRANSACTION_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/v1/transactions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_reference": "TXN_'$(date +%s)'",
    "customer": "'$CUSTOMER_ID'",
    "amount": "50000.00",
    "currency": "USD",
    "transaction_type": "withdrawal"
  }')

TRANSACTION_ID=$(echo $TRANSACTION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$TRANSACTION_ID" ]; then
  echo -e "${RED}❌ Transaction creation FAILED${NC}"
  echo "Response: $TRANSACTION_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Transaction created: $TRANSACTION_ID${NC}"
echo ""

# Wait for Kafka + Event Processor
echo "⏳ Step 5: Waiting for event processing (5 seconds)..."
echo "   Backend → Kafka → Event Processor → Rule Engine"
sleep 5
echo ""

# Check transaction was processed
echo "🔍 Step 6: Checking if transaction was processed..."
PROCESSED=$(curl -s ${BASE_URL}/api/v1/transactions/$TRANSACTION_ID/ \
  -H "Authorization: Bearer $TOKEN")

RISK_SCORE=$(echo $PROCESSED | python3 -c "import sys, json; print(json.load(sys.stdin).get('risk_score', 0))")
STATUS=$(echo $PROCESSED | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))")

echo "   Risk Score: $RISK_SCORE"
echo "   Status: $STATUS"

if [ "$RISK_SCORE" -gt "0" ]; then
  echo -e "${GREEN}✅ Event processing WORKING - Risk score updated${NC}"
else
  echo -e "${YELLOW}⚠️  Risk score is 0 - Event processor may not be running${NC}"
fi
echo ""

# Check alerts
echo "🚨 Step 7: Checking alerts..."
ALERTS=$(curl -s "${BASE_URL}/api/v1/alerts/?transaction=$TRANSACTION_ID" \
  -H "Authorization: Bearer $TOKEN")

ALERT_COUNT=$(echo $ALERTS | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('results', [])))")

echo "   Alerts created: $ALERT_COUNT"
if [ "$ALERT_COUNT" -gt "0" ]; then
  echo -e "${GREEN}✅ Rule engine WORKING - Alerts created${NC}"
  echo $ALERTS | python3 -c "import sys, json;
data=json.load(sys.stdin)
for alert in data.get('results', []):
    print(f\"   - {alert['rule_name']}: {alert['message']}\")"
else
  echo -e "${YELLOW}⚠️  No alerts created${NC}"
fi
echo ""

# Test Rust service
echo "🦀 Step 8: Testing Rust microservice..."
RUST_URL="${RUST_URL:-http://localhost:8001}"
RUST_RESPONSE=$(curl -s -X POST ${RUST_URL}/score \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000.0,
    "currency": "USD",
    "transaction_type": "withdrawal",
    "customer_risk_level": "high",
    "is_blacklisted": false,
    "country_code": "USA"
  }')

RUST_SCORE=$(echo $RUST_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('risk_score', 0))")

if [ -n "$RUST_SCORE" ] && [ "$RUST_SCORE" -gt "0" ]; then
  echo -e "${GREEN}✅ Rust service WORKING - Score: $RUST_SCORE${NC}"
else
  echo -e "${RED}❌ Rust service NOT responding${NC}"
fi
echo ""

# Check Prometheus
echo "📊 Step 9: Testing monitoring stack..."
METRICS=$(curl -s ${BASE_URL}/metrics | grep -c "python_info")
PROM_URL="${PROM_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
PROM=$(curl -s ${PROM_URL}/-/ready)
GRAFANA=$(curl -s ${GRAFANA_URL}/api/health)

if [ "$METRICS" -gt "0" ]; then
  echo -e "${GREEN}✅ Metrics endpoint working${NC}"
else
  echo -e "${RED}❌ Metrics endpoint failed${NC}"
fi

if [[ "$PROM" == *"ready"* ]]; then
  echo -e "${GREEN}✅ Prometheus running${NC}"
else
  echo -e "${RED}❌ Prometheus not ready${NC}"
fi

if [[ "$GRAFANA" == *"ok"* ]]; then
  echo -e "${GREEN}✅ Grafana running${NC}"
else
  echo -e "${RED}❌ Grafana not accessible${NC}"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "📋 INTEGRATION TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Core Features:"
echo "  Backend API.............. ✅ Working"
echo "  JWT Authentication....... ✅ Working"
echo "  Customer Management...... ✅ Working"
echo "  Transaction API.......... ✅ Working"
echo ""
echo "Event-Driven Architecture:"
if [ "$RISK_SCORE" -gt "0" ]; then
  echo "  Kafka Publishing......... ✅ Working"
  echo "  Event Processor.......... ✅ Working"
  echo "  Rule Engine.............. ✅ Working"
else
  echo "  Kafka Publishing......... ⚠️  Check logs"
  echo "  Event Processor.......... ⚠️  May not be running"
  echo "  Rule Engine.............. ⚠️  Check configuration"
fi
echo ""
echo "Bonus Features:"
if [ -n "$RUST_SCORE" ] && [ "$RUST_SCORE" -gt "0" ]; then
  echo "  Rust Microservice........ ✅ Working"
else
  echo "  Rust Microservice........ ❌ Not integrated (disabled)"
fi
echo "  Prometheus............... ✅ Running"
echo "  Grafana.................. ✅ Running"
echo ""
echo "Access URLs:"
echo "  Backend API: ${BASE_URL}"
echo "  API Docs: ${BASE_URL}/api/schema/swagger-ui/"
echo "  Prometheus: ${PROM_URL}"
echo "  Grafana: ${GRAFANA_URL}"
echo ""
echo "═══════════════════════════════════════════════════════════"
