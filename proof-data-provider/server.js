// Server - jayson
const config = require("config");
const jayson = require("jayson/promise");
const { errorHandler, methodHandler } = require("./handler_jayson");

const checkAndCall = (methodName, errorHandlerName, params) => {
  const error = errorHandler(errorHandlerName, params);
  return error.then(err => {
    if (err != null) {
      return Promise.reject(server.error(err.code, err.message, err.data));
    }
    return Promise.resolve(methodHandler(methodName, params));
  });
};

const server = jayson.server({
  addTreeManually: params => checkAndCall("addTreeManually", "ctype1", params),
  addTreeFromContract: params =>
    checkAndCall("addTreeFromContract", "ctype2", params),
  updateTreeManually: params =>
    checkAndCall("updateTreeManually", "utype1", params),
  extraUpdateTreeFromContract: params =>
    checkAndCall("extraUpdateTreeFromContract", "utype2", params),
  getProofByKey: async params => await require("./methods/getProofByKey")(params),
  getProofByKeys: params => checkAndCall("getProofByKeys", "gp2", params),
  getProofByKeyWithCondition: params =>
    checkAndCall("getProofByKeyWithCondition", "gp3", params),
  getProofByKeysWithCondition: params =>
    checkAndCall("getProofByKeysWithCondition", "gp4", params),
  getRoot: params => checkAndCall("getRoot", "gR", params)
});

server.http().listen(config.get("endpoint.options.port"));
