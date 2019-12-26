// Server - jayson
const config = require("config");
const jayson = require("jayson/promise");
const { errorHandler, methodHandler } = require("./handler_jayson");

const server = jayson.server({
  addTreeManually: params => {
    const error = errorHandler("ctype1", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("addTreeManually", params);
        resolve(result);
      });
    });
  },

  addTreeFromContract: params => {
    const error = errorHandler("ctype2", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          // server.error just returns {code: 32602, message: 'Internal error', data: 'specific input error'}
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("addTreeFromContract", params);
        resolve(result);
      });
    });
  },
  updateTreeManually: params => {
    const error = errorHandler("utype1", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("updateTreeManually", params);
        resolve(result);
      });
    });
  },

  extraUpdateTreeFromContract: params => {
    const error = errorHandler("utype2", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("extraUpdateTreeFromContract", params);
        resolve(result);
      });
    });
  },

  getProofOp1: params => {
    const error = errorHandler("gp1", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("getProofOp1", params);
        resolve(result);
      });
    });
  },
  getProofOp2: params => {
    const error = errorHandler("gp2", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("getProofOp2", params);
        resolve(result);
      });
    });
  },
  getProofOp3: params => {
    const error = errorHandler("gp3", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("getProofOp3", params);
        resolve(result);
      });
    });
  },
  getProofOp4: params => {
    const error = errorHandler("gp4", params);
    return error.then(err => {
      if (err != null) {
        return new Promise((resolve, reject) => {
          reject(server.error(err.code, err.message, err.data));
        });
      }
      return new Promise(resolve => {
        const result = methodHandler("getProofOp4", params);
        resolve(result);
      });
    });
  }
});

server.http().listen(config.get("endpoint.options.port"));
