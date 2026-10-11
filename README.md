# AI Healthcare Quality Automation Platform

A Senior SDET portfolio project demonstrating API automation, database testing, event-driven integration testing, AI-assisted quality engineering, and CI/CD.

## Technology Stack

| Technology | Purpose |
|---|---|
| Playwright | API and end-to-end automation |
| JavaScript / Node.js | Automation framework and backend |
| Express | Healthcare claims REST API |
| PostgreSQL | Database validation |
| AWS SDK | S3 and SQS integration |
| Moto | Local AWS service simulation |
| Ollama / Qwen2.5-Coder | AI-assisted testing |
| GitHub Actions | CI/CD automation |

## Architecture

```text
                 Playwright Test Framework
                           |
              +------------+------------+
              |                         |
              v                         v
        Healthcare API             AI Test Layer
              |                         |
              v                  Ollama / Qwen2.5
         PostgreSQL
              ^
              |
       Claims Processor
              ^
              |
          S3 / SQS
       (Moto Simulator)
```

## Automated Test Suites

| Suite | Tests | Command |
|---|---:|---|
| Smoke | 2 | npm run test:smoke |
| Sanity | 4 | npm run test:sanity |
| Regression | 21 | npm run test:regression |
| AI | 3 | npm run test:ai |

**24 unique automated tests.** Smoke and sanity tests overlap with regression.

## Test Coverage

- Healthcare API health checks
- Claim creation and retrieval
- Missing required field validation
- Negative and zero claim amount validation
- Invalid claim amount validation
- Invalid service date validation
- Boundary value testing
- PostgreSQL data persistence
- S3 upload and retrieval
- S3-to-PostgreSQL processing
- SQS event-driven processing
- Risk-based test selection
- AI-assisted test generation
- AI-assisted failure analysis
- AI risk explanation

## AI-Assisted Testing

The framework integrates a locally hosted Ollama model.

AI supports test generation, failure analysis, and risk explanations. Deterministic code controls test selection and test assertions.

AI-generated recommendations do not automatically become application requirements.

## CI/CD Pipeline

GitHub Actions executes the following workflow:

1. Checkout repository
2. Install Node.js dependencies
3. Initialize PostgreSQL
4. Start Moto AWS simulator
5. Initialize simulated S3 and SQS
6. Start healthcare API
7. Run smoke tests
8. Run sanity tests
9. Run regression tests
10. Upload Playwright reports

The workflow is manually triggered.

AI tests run locally because they require a local Ollama service.

## Local Setup

Prerequisites:

- Node.js
- PostgreSQL
- Docker-compatible container runtime
- Moto for simulated AWS services
- Ollama for AI tests

Install dependencies:

```bash
npm ci
```

Start the healthcare API after initializing the local PostgreSQL database:

```bash
node app/server.js
```

Run regression tests:

```bash
npm run test:regression
```

Run AI tests:

```bash
npm run test:ai
```

## Security

- Synthetic healthcare data only
- No real patient information
- AWS services simulated locally using Moto
- No production AWS credentials required
- No real AWS cloud deployment

## Project Goals

Demonstrate Senior SDET capabilities in:

- Automation framework architecture
- API and database testing
- Cloud integration testing
- CI/CD implementation
- AI-assisted quality engineering
- Risk-based testing
- Test reporting and failure analysis
