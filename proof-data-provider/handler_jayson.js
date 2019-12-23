const {Methods, inputErrors} = require('./methods');

/*
Function that takes params and by check type invokes function that looks for errors in params,
if there is some error it forms response with message
that describes this error, if there is no input_errors the function allows method to be invoked.
*/

async function error_handler(check_type, params) {
  if (Object.prototype.toString.call(params) != '[object Object]') {
    let response = {"code": -32602, "message": "Invalid params", "data": "Params must be an object."};
    return response;
  }
  let check = await inputErrors[check_type](params);
  if (check.error) {
    let response = {"code": -32602, "message": "Invalid params", "data": check.message};
    return response;
  } else {
    return null;
  }
}

/*
Function that invokes method with params.
*/
async function method_handler(method, params) {
    let result = await Methods[method](params);
    return result;
}

exports.error_handler = error_handler;
exports.method_handler = method_handler;
