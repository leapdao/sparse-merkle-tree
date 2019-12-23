//Server - jayson
const config = require("config");
const {error_handler, method_handler} = require('./handler_jayson');
const jayson = require('jayson/promise');

const server = jayson.server({
  addTreeManually: function(params) {
    let error = error_handler('ctype1', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('addTreeManually', params);
          resolve(result);
        });
      }
    });
  },

  addTreeFromContract: function(params) {
    let error = error_handler('ctype2', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          // server.error just returns {code: 32602, message: 'Internal error', data: 'specific input error'}
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('addTreeFromContract', params);
          resolve(result);
        });
      }
    });
  },
  updateTreeManually: function(params) {
    let error = error_handler('utype1', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('updateTreeManually', params);
          resolve(result);
        });
      }
    });
  },

  extraUpdateTreeFromContract: function(params) {
    let error = error_handler('utype2', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('extraUpdateTreeFromContract', params);
          resolve(result);
        });
      }
    });
  },

  getProofOp1: function(params) {
    let error = error_handler('gp1', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('getProofOp1', params);
          resolve(result);
        });
      }
    });
  },
  getProofOp2: function(params) {
    let error = error_handler('gp2', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('getProofOp2', params);
          resolve(result);
        });
      }
    });
  },
  getProofOp3: function(params) {
    let error = error_handler('gp3', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('getProofOp3', params);
          resolve(result);
        });
      }
    });
  },
  getProofOp4: function(params) {
    let error = error_handler('gp4', params);
    return error.then(err => {
      if (err != null) {
        return new Promise(function(resolve, reject) {
          reject(server.error(err.code, err.message, err.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          const result = method_handler('getProofOp4', params);
          resolve(result);
        });
      }
    });
  }
});


server.http().listen(config.get('endpoint.options.port'));
