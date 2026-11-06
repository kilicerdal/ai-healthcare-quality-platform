function loopbackURL(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be a loopback HTTP URL`); }
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.username || url.password || url.search || url.hash) throw new Error(`${label} must be a loopback HTTP URL`);
  return url.toString().replace(/\/$/, "");
}
function localAWSConfig() {
  return { region: "us-east-1", endpoint: loopbackURL(process.env.LOCAL_AWS_ENDPOINT || "http://127.0.0.1:5000", "LOCAL_AWS_ENDPOINT"), credentials: { accessKeyId: "testing", secretAccessKey: "testing" }, maxAttempts: 2 };
}
function claimsAPIURL() {
  return loopbackURL(process.env.CLAIMS_API_URL || "http://localhost:3000", "CLAIMS_API_URL");
}
module.exports = { loopbackURL, localAWSConfig, claimsAPIURL };
