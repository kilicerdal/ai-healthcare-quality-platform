const spec = require("../../openapi/healthcare-api.json");
const { SchemaValidator } = require("./schemaValidator");

class APIContractValidator {
  constructor() {
    this.validator = new SchemaValidator();
  }

  validateResponse(path, method, status, data) {
    const response = spec.paths[path]?.[method.toLowerCase()]?.responses[String(status)];
    let schema = response?.content?.["application/json"]?.schema;
    if (!schema)
      throw new Error(`No documented JSON response for ${method} ${path} HTTP ${status}`);
    if (schema.$ref) {
      const prefix = "#/components/schemas/";
      if (!schema.$ref.startsWith(prefix)) throw new Error("Unsupported contract reference");
      schema = spec.components.schemas[schema.$ref.slice(prefix.length)];
      if (!schema) throw new Error("Missing response schema");
    }
    return this.validator.validate(schema, data);
  }
}
module.exports = { APIContractValidator };
