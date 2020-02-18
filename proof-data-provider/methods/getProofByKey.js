const SmtLib = require("../helpers/SmtLib.js");
const managerDB = require("../db.js");
const { paramsSchema, validate, error } = require("./utils");

const schema = paramsSchema("getProofByKey", {
  index: { type: "number", required: true },
  key: { type: "string", required: true }
});

/**
 *  Option1. Function for getting one proof for one key.
 *  @function getProofByKey
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.index] The index of the existing item (tree), that user got when created a tree into provider's database.
 *  @param {String} [params.key] The sparse merkle tree's key(path) that proof is required.
 *  Key must be a number in a range of depth's amount of bits.
 *  @return {String} Returns a proof for the key in input as the result.
 */
// Example:
/*
let params = {
  index: 1575009568558,
  key : "0x77111aaabbbcccdddeeeeffff000002222233333"
}
*/
const handler = async params => {
  const validationError = validate(schema, params);
  if (validationError) return validationError;

  const item = await managerDB.getItemByIndex(params.index);
  if (!item) {
    return error(
      `Invalid index. There is no tree with such ${params.index} index.`
    );
  }

  // check key value
  const { depth } = item;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  let bN;
  try {
    bN = BigInt(params.key);
  } catch (e) {
    return error(`This "${params.key}" key is not a number.`);
  }

  if (bN > maxnumber) {
    return error(
      `This "${params.key}" key is out of range of the tree's depth.`
    );
  }

  if (item.config) {
    await autoUpdate(params.index);
  }
  const tree = new SmtLib(item.depth, item.leaves);
  const proof = tree.createMerkleProof(params.key);
  return proof;
};

module.exports = handler;
