# CI/CD Pipelines

## Overview

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### CI Pipeline (`ci.yml`)
Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
1. **Lint** - Code quality checks
   - Black (code formatting)
   - isort (import sorting)
   - Flake8 (linting)

2. **Test** - Run test suite
   - PostgreSQL and Redis services
   - Django migrations
   - pytest with coverage reporting
   - Upload coverage to Codecov

3. **Security** - Security scanning
   - Safety (dependency vulnerability scanning)
   - Bandit (Python security issues)

4. **Build** - Docker image build
   - Build Docker image
   - Save as artifact for CD pipeline

### CD Pipeline (`cd.yml`)
Runs on push to `main` branch or version tags.

**Jobs:**
1. **Deploy** - Build and deploy to production
   - Build and push Docker image to Docker Hub
   - Deploy to Kubernetes cluster
   - Restart deployments with new image
   - Run smoke tests

## Required Secrets

Configure these secrets in GitHub repository settings:

### Docker Hub
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub access token

### Kubernetes
- `KUBE_CONFIG` - Base64 encoded kubeconfig file

To encode kubeconfig:
```bash
cat ~/.kube/config | base64
```

### Optional
- `CODECOV_TOKEN` - Codecov upload token (if using private repo)

## Branch Protection

Recommended branch protection rules for `main`:

- Require pull request reviews before merging
- Require status checks to pass before merging:
  - Code Linting
  - Run Tests
  - Security Scanning
  - Build Docker Image
- Require branches to be up to date before merging
- Include administrators

## Local Testing

### Run linting locally:
```bash
cd backend
black .
isort .
flake8 . --max-line-length=120 --exclude=migrations,venv
```

### Run tests locally:
```bash
cd backend
pytest --cov=. --cov-report=term-missing
```

### Run security checks:
```bash
cd backend
safety check
bandit -r .
```

## Deployment Process

1. Developer creates feature branch
2. Push triggers CI pipeline (lint, test, security, build)
3. Create pull request to `main`
4. Code review and approval
5. Merge to `main` triggers CD pipeline
6. Docker image built and pushed
7. Kubernetes deployment updated
8. Smoke tests verify deployment
