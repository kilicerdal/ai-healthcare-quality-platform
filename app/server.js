const crypto = require('crypto');
const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'healthcare-claims-api'
  });
});

// Create a new healthcare claim
app.post('/api/claims', async (req, res) => {
  try {
    const {
      memberId,
      providerId,
      serviceDate,
      diagnosisCode,
      claimAmount
    } = req.body;

    // Validate required fields
    if (
      !memberId ||
      !providerId ||
      !serviceDate ||
      !diagnosisCode ||
      claimAmount === undefined
    ) {
      return res.status(400).json({
        error: 'Missing required claim fields'
      });
    }

    // Validate claim amount
    if (
      typeof claimAmount !== 'number' ||
      !Number.isFinite(claimAmount) ||
      claimAmount <= 0
    ) {
      return res.status(400).json({
        error: 'Claim amount must be a positive number'
      });
    }

    // Validate service date
    const validDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(serviceDate);

    const parsedDate = new Date(serviceDate);

    if (
      !validDateFormat ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== serviceDate
    ) {
      return res.status(400).json({
        error: 'Invalid service date'
      });
    }

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
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        'RECEIVED'
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error creating claim:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get claim by ID
app.get('/api/claims/:claimId', async (req, res) => {
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
      [req.params.claimId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Claim not found'
      });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error retrieving claim:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Healthcare Claims API running on port ${PORT}`);
});
