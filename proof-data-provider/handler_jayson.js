const { Methods, inputErrors } = require("./methods");

/*
Function that takes params and by check type invokes function that looks for errors in params,
if there is some error it forms response with message
that describes this error, if there is no input_errors the function allows method to be invoked.
*/

async function errorHandler(checkType, params) {
  if (Object.prototype.toString.call(params) !== "[object Object]") {
    const response = {
      code: -32602,
      message: "Invalid params",
      data: "Params must be an object."
    };
    return response;
  }
  const check = await inputErrors[checkType](params);
  if (check.error) {
    const response = {
      code: -32602,
      message: "Invalid params",
      data: check.message
    };
    return response;
  }
  return null;
}

/*
Function that invokes method with params.
*/
async function methodHandler(method, params) {
  return Methods[method](params);
}

exports.errorHandler = errorHandler;
exports.methodHandler = methodHandler;
