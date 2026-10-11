const Ajv = require('ajv');

class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }

  validate(schema, data) {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    return {
      valid,
      errors: validate.errors || []
    };
  }
}

module.exports = { SchemaValidator };
