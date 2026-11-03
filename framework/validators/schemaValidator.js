const Ajv = require("ajv");
const addFormats = require("ajv-formats");

class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  validate(schema, data) {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    return {
      valid,
      errors: validate.errors || [],
    };
  }
}

module.exports = { SchemaValidator };
