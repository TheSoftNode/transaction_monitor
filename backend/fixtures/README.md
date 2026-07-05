# Database Fixtures

This directory contains Django fixtures for seeding the database with sample data.

## Available Fixtures

### 1. Rule Configurations
**File:** `rule_configurations.json`
**Description:** Loads all default rule configurations for the transaction monitoring system.

**Load with:**
```bash
python manage.py loaddata rule_configurations
```

## Seed Data Management Command

For a complete seed data solution with customizable options, use the custom management command:

```bash
# Seed with default data (20 customers, 50 transactions)
python manage.py seed_data

# Seed with custom counts
python manage.py seed_data --customers 50 --transactions 200

# Clear existing data and reseed
python manage.py seed_data --clear --customers 30 --transactions 100

# View help
python manage.py seed_data --help
```

## Docker Usage

### Load fixtures in Docker container:
```bash
docker exec -it transaction-monitor-backend python manage.py loaddata rule_configurations
```

### Run seed command in Docker:
```bash
# Basic seeding
docker exec -it transaction-monitor-backend python manage.py seed_data

# Advanced options
docker exec -it transaction-monitor-backend python manage.py seed_data --clear --customers 100 --transactions 500
```

## What Gets Seeded

The `seed_data` command creates:

1. **Admin User**
   - Username: `admin`
   - Password: `admin123`
   - Email: `admin@transactionmonitor.com`

2. **Rule Configurations**
   - HighValueTransactionRule
   - VelocityRule
   - BlacklistedCountryRule
   - HighRiskCustomerRule

3. **Customers** (configurable count)
   - Realistic names and emails
   - Various risk levels
   - Multiple countries including blacklisted ones
   - Some customers marked as blacklisted

4. **Transactions** (configurable count)
   - Linked to random customers
   - Realistic amounts based on customer risk level
   - Various transaction types (deposit, withdrawal, transfer, payment)
   - Multiple currencies (USD, EUR, GBP, CAD, AUD)
   - Different statuses (pending, approved, rejected, under_review)

## Production Notes

⚠️ **Do not use seed data in production!**

Seed data is for:
- Development environments
- Testing
- Demonstrations
- QA environments

Always use real, validated data in production systems.
