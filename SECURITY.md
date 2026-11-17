# Security policy and local-demo scope

## Private reporting

Email [erdal@eai.engineering](mailto:erdal@eai.engineering) with subject `Security: ai-healthcare-quality-platform`. Include the affected commit/version, a minimal synthetic reproduction and likely impact. Do not publish exploit details or sensitive traces in an issue. Never include credentials or real health information in the report.

Maintenance targets the current default branch; older release assets are historical snapshots. No response or remediation SLA is promised.

## Demonstration boundaries

This is a local quality engineering portfolio using synthetic claims, PostgreSQL and Moto-simulated AWS services. The API does not provide production patient identity, tenant isolation or healthcare compliance. Keep the Docker services on their documented loopback ports; do not expose the demo publicly or point it at real AWS resources.

Demo database values and AWS `testing` credentials are local simulator inputs, not production secrets. Store real credentials outside Git and never place them in browser assets, fixtures, screenshots or generated reports. Message redelivery/idempotency checks establish specific tested behavior, not exactly-once infrastructure delivery or a complete security audit.

Offline AI validation is distinct from optional live local model experiments. Do not send real patient data to a model. Review [dependency maintenance](docs/DEPENDENCY_MAINTENANCE.md) for update checks and the README for the actual verified scope.
