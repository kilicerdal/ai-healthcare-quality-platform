const pool = require('../../app/db');

class DatabaseClient {

  async getClaimById(claimId) {
    const result = await pool.query(
      `SELECT
        claim_id,
        member_id,
        provider_id,
        service_date,
        diagnosis_code,
        claim_amount,
        status,
        created_at
      FROM claims
      WHERE claim_id = $1`,
      [claimId]
    );

    return result.rows[0] || null;
  }

  async close() {
    await pool.end();
  }
}

module.exports = { DatabaseClient };