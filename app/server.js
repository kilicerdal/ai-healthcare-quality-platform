const crypto = require("crypto");
const express = require("express");
const pool = require("./db");
const { validateClaim } = require("./validateClaim");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "healthcare-claims-api",
  });
});

// Create a new healthcare claim
app.post("/api/claims", async (req, res) => {
  try {
    const validationError = validateClaim(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const { memberId, providerId, serviceDate, diagnosisCode, claimAmount } = req.body;

    const idempotencyKey = req.get("Idempotency-Key") ?? null;
    if (idempotencyKey !== null && (!idempotencyKey.trim() || idempotencyKey.length > 128)) {
      return res.status(400).json({ error: "Invalid Idempotency-Key" });
    }
    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify([memberId, providerId, serviceDate, diagnosisCode, claimAmount]))
      .digest("hex");

    const claimId = `CLM-${crypto.randomUUID()}`;

    // Insert claim into PostgreSQL
    const result = await pool.query(
      `INSERT INTO claims (
        claim_id,
        member_id,
        provider_id,
        service_date,
        diagnosis_code,
        claim_amount,
        status, idempotency_key, request_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (idempotency_key) DO UPDATE
        SET idempotency_key = EXCLUDED.idempotency_key
        WHERE claims.request_hash = EXCLUDED.request_hash
      RETURNING
        claim_id AS "claimId",
        member_id AS "memberId",
        provider_id AS "providerId",
        TO_CHAR(service_date, 'YYYY-MM-DD') AS "serviceDate",
        diagnosis_code AS "diagnosisCode",
        claim_amount::FLOAT AS "claimAmount",
        status,
        created_at AS "createdAt"`,
      [
        claimId,
        memberId,
        providerId,
        serviceDate,
        diagnosisCode,
        claimAmount,
        "RECEIVED",
        idempotencyKey,
        requestHash,
      ],
    );

    if (result.rows.length === 0) {
      return res
        .status(409)
        .json({ error: "Idempotency-Key was already used for a different claim" });
    }
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating claim:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get claim by ID
app.get("/api/claims/:claimId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        claim_id AS "claimId",
        member_id AS "memberId",
        provider_id AS "providerId",
        TO_CHAR(service_date, 'YYYY-MM-DD') AS "serviceDate",
        diagnosis_code AS "diagnosisCode",
        claim_amount::FLOAT AS "claimAmount",
        status,
        created_at AS "createdAt"
      FROM claims
      WHERE claim_id = $1`,
      [req.params.claimId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Claim not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving claim:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Normalize body-parser failures to the same public JSON error contract.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body" });
  if (error.type === "entity.too.large")
    return res.status(413).json({ error: "Request body too large" });
  console.error("Unhandled request error:", error);
  return res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Healthcare Claims API running on port ${PORT}`);
});
