function isValidClaimAmount(amount) {
  return (
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= 9999999999.99 &&
    /^\d+(\.\d{1,2})?$/.test(String(amount))
  );
}

function validateClaim(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Claim body must be a JSON object";
  }
  const { memberId, providerId, serviceDate, diagnosisCode, claimAmount } = body;
  if (!memberId || !providerId || !serviceDate || !diagnosisCode || claimAmount === undefined) {
    return "Missing required claim fields";
  }
  for (const [field, limit] of [
    ["memberId", 50],
    ["providerId", 50],
    ["diagnosisCode", 20],
  ]) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim() || [...value].length > limit) {
      return `${field} must be nonblank text of at most ${limit} characters`;
    }
  }
  if (typeof claimAmount !== "number" || !Number.isFinite(claimAmount) || claimAmount <= 0) {
    return "Claim amount must be a positive number";
  }
  // NUMERIC(12,2) must not silently round or overflow an accepted input.
  if (!isValidClaimAmount(claimAmount)) {
    return "Claim amount must fit NUMERIC(12,2) without rounding";
  }
  const validFormat = typeof serviceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(serviceDate);
  const parsed = validFormat ? new Date(serviceDate) : new Date(NaN);
  if (
    !validFormat ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== serviceDate
  ) {
    return "Invalid service date";
  }
  return null;
}
module.exports = { validateClaim, isValidClaimAmount };
