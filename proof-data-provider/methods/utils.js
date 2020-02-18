const Validator = require("jsonschema").Validator;
const validator = new Validator();

const paramsSchema = (name, properties) => {
  const paramsSchemaId = `/${name}Params`;
  const paramsSchema = {
    id: paramsSchemaId,
    type: "object",
    properties: properties
  };
  return paramsSchema;
};

const error = (message) => ({
  code: -32602,
  message: "Invalid params",
  data: message,
});

const validate = (schema, params) => {
  const res = validator.validate(params, schema);
  if (res.valid) return;

  return {
    code: -32602,
    message: "Invalid params",
    data: res.errors.map(
      e => `parameter '${e.property.replace("instance.", "")}' ${e.message}`
    )
  };
};

module.exports = { validate, error, paramsSchema };