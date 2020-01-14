const config = require("config");
const Web3 = require("web3");
const keccak256 = require('ethereumjs-util').keccak256;
const SmtLib = require("./helpers/SmtLib.js");
const managerDB = require("./db.js");

let infuraId;
let nodeUrl;
let network;

// Check using own node or infura
const useOwnNode = config.get("useOwnNode");
if (useOwnNode) {
  nodeUrl = config.get("node.fullURL");
  const networkID = config.get("node.network_id");
  switch (networkID) {
    case 1:
      network = "mainnet";
      break;
    case 42:
      network = "kovan";
      break;
    case 3:
      network = "ropsten";
      break;
    case 4:
      network = "rinkeby";
      break;
    case 5:
      network = "goerli";
      break;
    default:
      network = "custom";
  }
} else {
  infuraId = config.get("infuraId");
}

// helper simple hash function
function hashString(str) {
  let hash = 5381;
  let i = str.length;

  while (i) {
    // eslint-disable-next-line
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  // eslint-disable-next-line no-bitwise
  return hash >>> 0;
}

// API methods(functions)
const Methods = {};
// Block#1. SaveTree. Create items into database.
// Item types:
// Type1 - item that is created by user sending directly sparse merkle tree's depth and leaves.
// Type2 - item that is created automatically regard to the configuration in strict format that is sending by user.

/**
 *  Function for creation a new item (type1) into database
 *  @function addTreeManually
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.depth] The depth of the sparse merkle tree, must be in a range from 8 to 256
 *  @param {Object} [params.leaves] The leaves of the sparse merkle tree, where keys and values data types must be strings.
 *  Keys must be a number in a range of depth's amount of bits.
 *  Values must be 32bytes only.
 *  @return {Number} Returns the index of the item that was created due to this request.
 */
// Example:
/*
 let params = {
   depth: 160,
   leaves : {
     "0x77111aaabbbcccdddeeeeffff000002222233333" : "0x99999888886666444444555577111aaabbbcccdddeeeeffff000002222233333",
     "0x783248686878ababacbaa67868765abcaef676af" : "0x09234892087a09789abcab0be00e876fe8608a0a0708807a6a88ca00676554bb",
     "0x893427b67b66768ac8bb8a676cbbe8f67ef78b8a" : "0x9897aacbe6bc6afba8ea8be8bc8ef6e8a8f6a8565761230912bc12e2ca123100"
   }
 }
 */
async function addTreeManually(params) {
  const index = hashString(JSON.stringify(params) + Date.now());
  await managerDB.putItemByIndex(index, {
    depth: params.depth.toString(),
    leaves: params.leaves,
    blockNumber: 0
  });
  return index;
}

/**
 *  Function for autocreation a new item (type2) into database
 *  Creates an item with the same sparse merkle tree that already exists into smart contract that is deployed in Ethereum network.
 *  Requirements: Contract must have event with two parameters: first one key(path) of the smt and second one it's value. Event should be emitted every time the write into smt happens.
 *  @function addTreeFromContract
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Object} [params.config] The configuration in the strict format that is filled by user with custom values.
 *  @param {Number} [params.config.smtDEPTH] The depth of the sparse merkle tree, that is used in smart contract.
 *  @param {String} [params.config.net] Ethereum network where smart contract was deployed. Must be one of the following ['mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli', 'custom']
 *  @param {String} [params.config.contractAddress] The address of the smart contract that use sparse merkle tree. Must be ChecksumAddress.
 *  @param {Array} [params.config.contractABI] The smart contract's ABI that use sparse merkle tree.
 *  @param {String} [params.config.eventName] The name of the event that is described in requirements above. The second event's argument (value) data type must be bytes32. The first one (key) data type may be address or uint8...uint256 or bytes1...bytes32.
 *  @return {Number} Returns the index of the item that was created due to this request.
 */
// Example:
/*
 let params = {
   config: {
     "smtDEPTH" : 160,
     "net" : "ropsten",
     "contractABI" : [{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"bytes","name":"proof","type":"bytes"}],"name":"balanceOf","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"sender_balance","type":"uint256"},{"internalType":"bytes","name":"sender_proof","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"recipient_balance","type":"uint256"},{"internalType":"bytes","name":"recipient_proof","type":"bytes"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_initialSupply","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_address","type":"address"},{"indexed":true,"internalType":"bytes32","name":"_value","type":"bytes32"}],"name":"Write","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"}],
     "eventName" : "Write",
     "contractAddress" : "0x89E5afFfC89185aF83Bc3aa02da227aCf30c9ACB"
   }
 }
 */
async function addTreeFromContract(params) {
  const index = hashString(JSON.stringify(params) + Date.now());
  await managerDB.putItemByIndex(index, {
    depth: params.config.smtDEPTH.toString(),
    blockNumber: 0,
    leaves: {},
    config: params.config
  });
  // eslint-disable-next-line no-use-before-define
  await autoUpdate(index);
  return index;
}

// Block#2. UpdateTree. Updates existing items.
// Type1 items are updated explicitly by user sending directly new data in request.
// Type2 items are updated automatically when user request different getProof methods.

/**
 *  Function for updating existing items (type1) into database
 *  Updates an item manually by taking key/value pairs from the user's request
 *  @function updateTreeManually
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.index] The index of the existing item type1, that user got when created a tree into provider's database.
 *  @param {Object} [params.leaves] The new key/value pairs and/or existing keys with new values, where keys and values data types must be strings.
 *  Keys must be a number in a range of depth's amount of bits.
 *  Values must be 32bytes only.
 *  @return {Boolean} Returns true as the result.
 */
// Example:
/*
 let params = {
   index: 1575009568558,
   leaves : {
     "0x77111aaabbbcccdddeeeeffff000002222233333" : "0xa0000000000000000000000000001aaabbbcccdddeeeeffff000002222211111",
     "0xaf87a887a878a7d878c7c77cdd65676a5af676af" : "0x09234892087a09789abcab0be00e876fe8608a0a0708807a6a88ca00676554bb",
     "0xababcbacbabbefefe676fe7f6e76a766f7e6efe6" : "0x9897aacbe6bc6afba8ea8be8bc8ef6e8a8f6a8565761230912bc12e2ca123100"
   }
 }
*/
async function updateTreeManually(params) {
  const item = await managerDB.getItemByIndex(params.index.toString());
  const { depth } = item;
  const { leaves } = item;
  const newLeaves = params.leaves;
  const newKeys = Object.keys(newLeaves);
  for (let i = 0; i < newKeys.length; i += 1) {
    leaves[newKeys[i]] = newLeaves[newKeys[i]];
  }
  await managerDB.updateItem(params.index.toString(), depth, 0, leaves);

  return true;
}

/**
 *  Function for extra updating existing items (type2).
 *  The case when this function can be invoked is when proofs that user receives are incorrect.
 *  The case may happen if in the Ethereum blockchain occurs disagreement in miners competition.
 *  When chain was splitted autoUpdate function fetched the data from the chain that loses in the longest chain rule.
 *  Extra updates an item by taking Ethereum block number from the user's request
 *  @function extraUpdateTreeFromContract
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.index] The index of the existing item type2, that user got when created a tree into provider's database.
 *  @return {Boolean} Returns true as the result.
 */
// Example:
/*
 let params = {
   index: 1575009568558
 }
*/
async function extraUpdateTreeFromContract(params) {
  const item = await managerDB.getItemByIndex(params.index.toString());
  await managerDB.updateItem(params.index, item.depth, 0, {});
  // eslint-disable-next-line no-use-before-define
  await autoUpdate(params.index);
  return true;
}

/**
 *  Internal Function for autoupdating existing items (type2) into database
 *  Updates an item every time when you user invokes different getProof methods by using event listener that takes data from Ethereum network.
 *  @function autoUpdate
 *  @param {Number} [_index] The index of the existing item type2
 *
 */
async function autoUpdate(_index) {
  const item = await managerDB.getItemByIndex(_index);
  // use eventListener
  if (item.config) {
    // check that config is correct
    const { depth } = item;
    if (depth !== item.config.smtDEPTH.toString()) {
      // invoke Server error -32000 to -32099
      return;
    }
    // set up web3
    const { net } = item.config;
    let provider;
    if (useOwnNode) {
      provider = nodeUrl;
      if (network !== net) {
        // no updates for wrong input
        return;
      }
    } else {
      provider = `https://${net}.infura.io/v3/${infuraId}`;
    }

    const web3 = new Web3(provider);
    // fetch data from db
    let { blockNumber } = item;
    const { leaves } = item;
    // set up contract and event listener to fetch data from Ethereum
    const contract = new web3.eth.Contract(
      item.config.contractABI,
      item.config.contractAddress
    );
    const events = await contract.getPastEvents(item.config.eventName, {
      fromBlock: blockNumber
    });
    for (let i = 0; i < events.length; i += 1) {
      blockNumber = events[i].blockNumber;
      // eslint-disable-next-line prefer-destructuring
      leaves[events[i].returnValues[0]] = events[i].returnValues[1]; // think about types
    }
    await managerDB.updateItem(_index, depth, blockNumber, leaves);
  }
}

// Block#3. GetProof. Gets proof/s from sparse merkle trees.
// Several methods are presented depends on user's needs.

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
async function getProofByKey(params) {
  const item = await managerDB.getItemByIndex(params.index);
  if (item.config) {
    await autoUpdate(params.index);
  }
  const tree = new SmtLib(item.depth, item.leaves);
  const proof = tree.createMerkleProof(params.key);
  return proof;
}

/**
 *  Option2. Function for getting several proofs for several keys.
 *  @function getProofByKeys
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.index] The index of the existing item (tree), that user got when created a tree into provider's database.
 *  @param {Array} [params.keys] The array of the sparse merkle tree's keys(path) that proofs is required.
 *  Keys must be a number in a range of depth's amount of bits.
 *  @return {Array} Returns an array of proofs for the keys in the same order as keys was received.
 */
// Example:
/*
 let params = {
   index: 1575009568558,
   keys: [
     "0x77111aaabbbcccdddeeeeffff000002222233333",
     "0x567a565765765ca765c5e67fefefe6765eaadd6d",
     "0xbcbabcabcefefeacbcabc6eb66bc6eb5b4abce44",
     "0xebebabcabecbebc346ce754abddbdbaeb2542b13"
   ]
 }
*/
async function getProofByKeys(params) {
  const item = await managerDB.getItemByIndex(params.index);
  if (item.config) {
    await autoUpdate(params.index);
  }
  const tree = new SmtLib(item.depth, item.leaves);
  const proofs = [];
  for (let i = 0; i < params.keys.length; i += 1) {
    proofs.push(tree.createMerkleProof(params.keys[i]));
  }
  return proofs;
}

/**
 *  Option3. Function for getting one proof for one key with the condition of changing another one key/value pair or several key/value pairs in the tree.
 *  @function getProofByKeyWithCondition
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.index] The index of the existing item (tree), that user got when created a tree into provider's database.
 *  @param {String} [params.key] The sparse merkle tree's key(path) that proof is required.
 *  Key must be a number in a range of depth's amount of bits.
 *  @param {Object} [params.condition] The new key/value pair/s or existing key/s with new value/s, where key and value data types must be strings.
 *  Key must be a number in a range of depth's amount of bits.
 *  Value must be 32bytes only.
 *  The condition itself doesn't change the current state of the tree into database.
 *  @return {String} Returns a proof for the key in input as the result.
 */
// Example:
/*
let params = {
  index: 1575293672452,
  key: '0x812F4FB767d3291F3ad84433D251192cd644e913',
  condition: {
    '0xcC692921A9D2327B61c3347EB4c07CED0cE7c61c' : '0x0000000000000000000000000000000000000000000000000000000000000328'
  }
}
*/
async function getProofByKeyWithCondition(params) {
  const item = await managerDB.getItemByIndex(params.index);

  if (item.config) {
    await autoUpdate(params.index);
  }
  const { leaves } = item;
  const conditionLeaves = { ...leaves };

  const changedKeys = Object.keys(params.condition);
  for (let i = 0; i < changedKeys.length; i += 1) {
    conditionLeaves[changedKeys[i]] = params.condition[changedKeys[i]];
  }
  const tree = new SmtLib(item.depth, conditionLeaves);
  const proof = tree.createMerkleProof(params.key);
  return proof;
}

/**
 *  Option4. Function for getting several proofs for several keys with the condition of changing another one key/value pair or several key/value pairs in the tree.
 *  @function getProofByKeysWithCondition
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.index] The index of the existing item (tree), that user got when created a tree into provider's database.
 *  @param {Array} [params.keys] The array of the sparse merkle tree's keys(path) that proofs is required.
 *  Keys must be a number in a range of depth's amount of bits.
 *  @param {Object} [params.condition] The new key/value pair/s or existing key/s with new value/s, where key and value data types must be strings.
 *  Key must be a number in a range of depth's amount of bits.
 *  Value must be 32bytes only.
 *  The condition itself doesn't change the current state of the tree into database.
 *  @return {Array} Returns an array of proofs for the keys in the same order as keys was received.
 */
// Example:
/*
let params = {
  index: 1575293672452,
  keys: ['0xcC692921A9D2327B61c3347EB4c07CED0cE7c61c', '0xaa792921A9D2327B61c3347cc4c08CED0cE7c61c', '0xaa111111a8b153ec72c4281cc4c08CED0cE7c61c'],
  condition: {
    '0x812F4FB767d3291F3ad84433D251192cd644e913' : '0x0000000000000000000000000000000000000000000000000000000000000a15'
  }
}
*/
async function getProofByKeysWithCondition(params) {
  const item = await managerDB.getItemByIndex(params.index);

  if (item.config) {
    await autoUpdate(params.index);
  }

  const { leaves } = item;
  const conditionLeaves = { ...leaves };
  const changedKeys = Object.keys(params.condition);
  for (let i = 0; i < changedKeys.length; i += 1) {
    conditionLeaves[changedKeys[i]] = params.condition[changedKeys[i]];
  }

  const tree = new SmtLib(item.depth, conditionLeaves);
  const proofs = [];

  for (let i = 0; i < params.keys.length; i += 1) {
    proofs.push(tree.createMerkleProof(params.keys[i]));
  }
  return proofs;
}

// Block#4. Helper methods.

const ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';
// helper function  
const merkelize = (hash1, hash2) => {
  const buffer = Buffer.alloc(64, 0);
  if (typeof hash1 === 'string' || hash1 instanceof String) {
    buffer.write(hash1.replace('0x', ''), 'hex');
  } else {
    hash1.copy(buffer);
  }
  if (typeof hash2 === 'string' || hash2 instanceof String) {
    buffer.write(hash2.replace('0x', ''), 32, 'hex');
  } else {
    hash2.copy(buffer, 32);
  }
  return `0x${keccak256(buffer).toString('hex')}`;
};


/**
 *  Function for getting root from the proof, path(index or key) and leaf(value).
 *  Simplifies check the correctness of the proof. Just compare your root and root from the result.
 *  @function getRoot
 *  @param {Object} [params] Parameters from the request that was send by client(user)
 *  @param {Number} [params.smtDEPTH] The depth of the sparse merkle tree, must be in a range from 8 to 256
 *  @param {String} [params.key] hex with length in bytes equals the depth of the tree (in bytes).
 *  @param {String} [params.value] 32-byte hex
 *  @param {String} [params.proof] hex
 *
 *  @return {String} Returns the root of the sparse merkle tree that contains the value by the key.
 */
// Example:
/*
 let params = {
   smtDEPTH: 160,
   key: "0x77111aaabbbcccdddeeeeffff000002222233333",
   value: "0x99999888886666444444555577111aaabbbcccdddeeeeffff000002222233333",
   proof: "0x88000000000000000000000000000000000000000f65cfed62d1e8fd4665df02765944bb023b0f235081639274cfb50835f54487a4ee18aee8b6a32bd887cdc20091d16fa9c5c60df9e5c3b52be47edd4d2d06d6"
 }
*/

function getRoot(params) {
  if ((Math.ceil((params.proof.length - 2) / 2) - Math.ceil(params.smtDEPTH / 8)) % 32 !== 0 || Math.ceil((params.proof.length - 2) / 2) > (32 * params.smtDEPTH) + Math.ceil(params.smtDEPTH / 8)) {
    return "invalid proof format";
  }
  let proofElement;
  let computedHash = params.value;
  let p = Math.ceil(params.smtDEPTH / 8);
  let proofBits;
  let index = BigInt(params.key);

  // first bytes (the length in bits equals the tree depth) of the proof are bits map
  proofBits = BigInt(params.proof.slice(0, p * 2 + 2));
  // Go through the tree depth
  for (let i = 0; i < params.smtDEPTH; i += 1) {
    // step1 - set up proofElement with the help of proofBits map
    if (proofBits % BigInt(2) === BigInt(0)) { // check if last bit of proofBits is 0
      proofElement = ZERO;
    } else {
      if (Math.ceil((params.proof.length - 2) / 2) < p) {
        return "proof not long enough";
      }
      proofElement = '0x' + params.proof.slice(p * 2 + 2, p * 2 + 66);
      p += 32;
    }

    // step2 - calculate the hash of the next level node (the last node at the end of iterations will be the root)
    if (computedHash == ZERO && proofElement == ZERO) {
      computedHash = ZERO;
    } else if (index % BigInt(2) === BigInt(0)) {
      computedHash = merkelize(computedHash, proofElement);
    } else {
      computedHash = merkelize(proofElement, computedHash);
    }

    // step3 - update proofBits and index for the next iteration
    proofBits = proofBits / BigInt(2); // shift it right for next bit
    index = index / BigInt(2);
  }
  return computedHash;
}

Methods.addTreeManually = addTreeManually;
Methods.addTreeFromContract = addTreeFromContract;
Methods.updateTreeManually = updateTreeManually;
Methods.extraUpdateTreeFromContract = extraUpdateTreeFromContract;
Methods.getProofByKey = getProofByKey;
Methods.getProofByKeys = getProofByKeys;
Methods.getProofByKeyWithCondition = getProofByKeyWithCondition;
Methods.getProofByKeysWithCondition = getProofByKeysWithCondition;
Methods.getRoot = getRoot;

// Internal functions that checks the correctness of the user's input params in the request for each method.
// If the check finds an error, the method will not be executed and user will get response with Invalid params error + data that describes the specific error.
// Purpose is to extend the messages of the code -32602 Invalid params
const inputErrors = {};

// Function for checking params for method addTreeManually
async function checkParamsCtype1(params) {
  const result = {
    error: false,
    message: null
  };
  // check params structure
  if (Object.keys(params).length !== 2) {
    if (Object.keys(params).length > 2) {
      result.error = true;
      result.message =
        "Too many keys in params. Should be only two: 'depth' and 'leaves'.";
      return result;
    }
    // here the amount of keys in params is less than two
    if (Object.keys(params).length === 0) {
      result.error = true;
      result.message =
        "No required keys in params. Should be two: 'depth' and 'leaves'.";
      return result;
    }
    if (Object.keys(params).includes("depth")) {
      result.error = true;
      result.message = "Missing required key 'leaves' in params.";
      return result;
    }
    if (Object.keys(params).includes("leaves")) {
      result.error = true;
      result.message = "Missing required key 'depth' in params.";
      return result;
    }
    // here there is one key in params but not required
    result.error = true;
    result.message =
      "No required keys in params. Should be two: 'depth' and 'leaves'.";
    return result;
  }
  // here the amount of keys in params is correct, but need to check if values are correct
  if (
    !Object.keys(params).includes("depth") ||
    !Object.keys(params).includes("leaves")
  ) {
    result.error = true;
    result.message =
      "No required keys in params. Should be two: 'depth' and 'leaves'.";
    return result;
  }

  // Here the params contains only two keys: depth and leaves.
  // check data types of depth and leaves
  if (
    typeof params.depth !== "number" ||
    Object.prototype.toString.call(params.leaves) !== "[object Object]"
  ) {
    if (typeof params.depth === "number") {
      result.error = true;
      result.message = "Wrong data type of 'leaves'. Must be object.";
      return result;
    }
    result.error = true;
    result.message = "Wrong data type of 'depth'. Must be number.";
    return result;
  }
  // Here the depth data type is number and leaves data type is object
  // check depth number - must be in range from 8 to 256
  if (params.depth < 8 || params.depth > 256) {
    result.error = true;
    result.message = "Number of 'depth' must be in range from 8 to 256.";
    return result;
  }

  // Here the depth is number in range(8, 256] and absolutely correct.
  // check if leaves are empty
  if (Object.keys(params.leaves).length === 0) {
    return result;
  }

  const { depth } = params;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  // check keys of leaves
  const keysOfLeaves = Object.keys(params.leaves);
  for (let i = 0; i < keysOfLeaves.length; i += 1) {
    let bN;
    try {
      bN = BigInt(keysOfLeaves[i]);
    } catch (e) {
      result.error = true;
      result.message = `"${keysOfLeaves[i]}" key in 'leaves' is not a number.`;
      return result;
    }
    if (bN > maxnumber) {
      result.error = true;
      result.message = `"${keysOfLeaves[i]}" key in 'leaves' is out of range of the tree's depth.`;
      return result;
    }
  }

  // Here all the keys in leaves are absolutely correct.
  // check the values in leaves
  const valuesOfLeaves = Object.values(params.leaves);
  for (let i = 0; i < valuesOfLeaves.length; i += 1) {
    const strRegex = "^0[xX][0-9a-fA-F]+$";
    const regex = new RegExp(strRegex);
    if (valuesOfLeaves[i].length !== 66 || !regex.test(valuesOfLeaves[i])) {
      result.error = true;
      result.message = `Invalid format of the value "${valuesOfLeaves[i]}" in 'leaves'. Valid format for values is "0x0000000000000000000000000000000000000000000000000000000000000000".`;
      return result;
    }
  }
  // Here all the checks were passed and as a result input is correct and method can be executed with this params.
  return result;
}

inputErrors.ctype1 = checkParamsCtype1;

// Function for checking params for method addTreeFromContract
async function checkParamsCtype2(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only one key
  if (Object.keys(params).length > 1) {
    result.error = true;
    result.message = 'Object "params" should have only one property - "config"';
    return result;
  }
  // check if the key of params is config
  if (!Object.prototype.hasOwnProperty.call(params, "config")) {
    result.error = true;
    result.message =
      'There is no required property "config" in object "params".';
    return result;
  }

  const configFromParams = params.config;
  // check config data type
  if (Object.prototype.toString.call(configFromParams) !== "[object Object]") {
    result.error = true;
    result.message = 'Wrong data type of "config". Must be an object.';
    return result;
  }

  if (Object.keys(configFromParams).length > 5) {
    result.error = true;
    result.message =
      'There are too many properties in object "config". Must be five.';
    return result;
  }

  // check if the config includes all the requiered keys
  const notIncluded = [];
  const requiredProperties = [
    "smtDEPTH",
    "net",
    "contractAddress",
    "contractABI",
    "eventName"
  ];
  for (let i = 0; i < requiredProperties.length; i += 1) {
    if (!Object.keys(configFromParams).includes(requiredProperties[i])) {
      notIncluded.push(requiredProperties[i]);
    }
  }
  if (notIncluded.length > 0) {
    if (notIncluded.length === 1) {
      result.error = true;
      result.message = `Missing required parameter: ${notIncluded[0]} in the "config".`;
      return result;
    }
    result.error = true;
    result.message = `Missing required parameters: ${notIncluded} in the "config".`;
    return result;
  }

  // check the value types of the required keys of config

  // smtDEPTH must be a number in range from 8 to 256
  if (typeof configFromParams.smtDEPTH !== "number") {
    result.error = true;
    result.message =
      'Invalid data type of the value by the key "smtDEPTH" into config. Valid type is "number".';
    return result;
  }
  if (configFromParams.smtDEPTH > 256 || configFromParams.smtDEPTH < 8) {
    result.error = true;
    result.message =
      "The depth of the sparse merkle tree that is used in smart contracts should be in range from 8 to 256.";
    return result;
  }
  // net must be string value that is maintained by the Infura or custom for other networks when using own node: 'mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli', 'custom'.
  let validNetValues;
  if (useOwnNode) {
    validNetValues = [network];
  } else {
    validNetValues = ["mainnet", "ropsten", "kovan", "rinkeby", "goerli"];
  }
  if (typeof configFromParams.net !== "string") {
    result.error = true;
    result.message =
      'Invalid data type of the value by the key "net" into config. Valid type is "string".';
    return result;
  }
  if (!validNetValues.includes(configFromParams.net)) {
    result.error = true;
    result.message = `Invalid value by the key "net" into config. Valid values are ${validNetValues}.`;
    return result;
  }
  // contractABI must be object - add checks and errors when executes, maybe like try catch
  if (typeof configFromParams.contractABI !== "object") {
    result.error = true;
    result.message =
      'Invalid data type of the value by the key "contractABI" into config. Valid type is "array".';
    return result;
  }
  if (configFromParams.contractABI.length === "undefined") {
    result.error = true;
    result.message =
      'Invalid data type of the value by the key "contractABI" into config. Valid type is "array".';
    return result;
  }
  // contractAddress must be a string with toChecksumAddress
  const strRegex = "^0[xX][0-9a-fA-F]+$";
  const regex = new RegExp(strRegex);
  if (typeof configFromParams.contractAddress !== "string") {
    result.error = true;
    result.message =
      'Invalid data type of the value by the key "contractAddress" into config. Valid type is "string".';
    return result;
  }
  if (configFromParams.contractAddress.length !== 42) {
    result.error = true;
    result.message =
      'Invalid length of the value by the key "contractAddress" into config.';
    return result;
  }
  if (!regex.test(configFromParams.contractAddress)) {
    result.error = true;
    result.message = 'Invalid value by the key "contractAddress" into config.';
    return result;
  }
  // eventName must be a string - add checks of user input when executes
  if (typeof configFromParams.eventName !== "string") {
    result.error = true;
    result.message =
      'Invalid data type of the value by the key "eventName" into config. Valid type is "string".';
    return result;
  }
  const eventNames = [];
  for (let i = 0; i < configFromParams.contractABI.length; i += 1) {
    if (configFromParams.contractABI[i].type === "event") {
      eventNames.push(configFromParams.contractABI[i].name);
    }
  }
  if (!eventNames.includes(configFromParams.eventName)) {
    result.error = true;
    result.message = "There is no such event name in a contractABI.";
    return result;
  }

  return result;
}

inputErrors.ctype2 = checkParamsCtype2;

// Function for checking params for method updateTreeManually
async function checkParamsUtype1(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only two keys
  if (Object.keys(params).length > 2) {
    result.error = true;
    result.message =
      'Object "params" should have only two properties - "index" and "leaves".';
    return result;
  }
  // check if the keys of params are index and leaves (can be improved with more detailed messages)
  if (
    !Object.prototype.hasOwnProperty.call(params, "index") ||
    !Object.prototype.hasOwnProperty.call(params, "leaves")
  ) {
    result.error = true;
    result.message =
      'There is no required properties "index" and/or "leaves" in object "params".';
    return result;
  }
  // check if the item with input index exists
  const item = await managerDB.getItemByIndex(params.index.toString());
  if (!item) {
    result.error = true;
    result.message = `Invalid index. There is no tree with "${params.index}" index.`;
    return result;
  }
  // check if the item is type1
  if (item.config) {
    // Blocking manually updating items that was created with config
    result.error = true;
    result.message = "You can't update tree that wasn't created manually.";
    return result;
  }

  // check the data type of leaves
  if (Object.prototype.toString.call(params.leaves) !== "[object Object]") {
    result.error = true;
    result.message = 'Invalid data type of "leaves". Must be "object"';
    return result;
  }
  if (Object.keys(params.leaves).length === 0) {
    return result;
  }

  // check leaves keys
  const { depth } = item;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  const keysOfLeaves = Object.keys(params.leaves);
  for (let i = 0; i < keysOfLeaves.length; i += 1) {
    let bN;
    try {
      bN = BigInt(keysOfLeaves[i]);
    } catch (e) {
      result.error = true;
      result.message = `This ${keysOfLeaves[i]} key in 'leaves' is not a number.`;
      return result;
    }
    if (bN > maxnumber) {
      result.error = true;
      result.message = `This ${keysOfLeaves[i]} key in 'leaves' is out of range of the tree's depth.`;
      return result;
    }
  }

  // check leaves values
  const valuesOfLeaves = Object.values(params.leaves);
  for (let i = 0; i < valuesOfLeaves.length; i += 1) {
    const strRegex = "^0[xX][0-9a-fA-F]+$";
    const regex = new RegExp(strRegex);
    if (valuesOfLeaves[i].length !== 66 || !regex.test(valuesOfLeaves[i])) {
      result.error = true;
      result.message = `Invalid format of the value "${valuesOfLeaves[i]}"  in 'leaves'. Valid format for values is "0x0000000000000000000000000000000000000000000000000000000000000000".`;
      return result;
    }
  }

  return result;
}

inputErrors.utype1 = checkParamsUtype1;

// Function for checking params for method extraUpdateTreeFromContract
async function checkParamsUtype2(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only one key
  if (Object.keys(params).length > 1) {
    result.error = true;
    result.message = 'Object "params" should have only one property - "index".';
    return result;
  }
  // check if the key of params is index.
  if (!Object.prototype.hasOwnProperty.call(params, "index")) {
    result.error = true;
    result.message =
      'There is no required property "index" in object "params".';
    return result;
  }
  // check if the item with input index exists
  const item = await managerDB.getItemByIndex(params.index.toString());
  if (!item) {
    result.error = true;
    result.message = `Invalid index. There is no tree with "${params.index}" index.`;
    return result;
  }
  // check if the item is type2
  if (!item.config) {
    // Blocking updating items that was created manually
    result.error = true;
    result.message =
      "You can't use extra update method on tree that was created manually.";
    return result;
  }

  return result;
}

inputErrors.utype2 = checkParamsUtype2;

// Function for checking input params for method getProofByKey
async function checkParamsGp1(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only two keys
  if (Object.keys(params).length > 2) {
    result.error = true;
    result.message =
      'Object "params" should have only two properties - "index" and "key".';
    return result;
  }
  // check if the keys of params are index and key (can be improved with more detailed messages)
  if (
    !Object.prototype.hasOwnProperty.call(params, "index") ||
    !Object.prototype.hasOwnProperty.call(params, "key")
  ) {
    result.error = true;
    result.message =
      'There is no required properties "index" and/or "key" in object "params".';
    return result;
  }
  // check data types of params keys
  if (typeof params.index !== "number" || typeof params.key !== "string") {
    if (typeof params.index === "number") {
      result.error = true;
      result.message = 'Invalid data type of "key". Must be a string.';
      return result;
    }
    result.error = true;
    result.message = 'Invalid data type of "index". Must be a number.';
    return result;
  }
  // check if the item by input's index exist
  const item = await managerDB.getItemByIndex(params.index);
  if (!item) {
    result.error = true;
    result.message = `Invalid index. There is no tree with such ${params.index} index.`;
    return result;
  }

  // check key value
  const { depth } = item;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  let bN;
  try {
    bN = BigInt(params.key);
  } catch (e) {
    result.error = true;
    result.message = `This "${params.key}" key is not a number.`;
    return result;
  }
  if (bN > maxnumber) {
    result.error = true;
    result.message = `This "${params.key}" key is out of range of the tree's depth.`;
    return result;
  }
  return result;
}

inputErrors.gp1 = checkParamsGp1;

// Function for checking params for method getProofByKeys
async function checkParamsGp2(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only two keys
  if (Object.keys(params).length > 2) {
    result.error = true;
    result.message =
      'Object "params" should have only two properties - "index" and "keys".';
    return result;
  }
  // check if the keys of params are index and keys (can be improved with more detailed messages)
  if (
    !Object.prototype.hasOwnProperty.call(params, "index") ||
    !Object.prototype.hasOwnProperty.call(params, "keys")
  ) {
    result.error = true;
    result.message =
      'There is no required properties "index" and/or "keys" in object "params".';
    return result;
  }
  // check data types of params keys
  if (
    typeof params.index !== "number" ||
    Object.prototype.toString.call(params.keys) !== "[object Array]"
  ) {
    if (typeof params.index === "number") {
      result.error = true;
      result.message = 'Invalid data type of "keys". Must be an array.';
      return result;
    }
    result.error = true;
    result.message = 'Invalid data type of "index". Must be a number.';
    return result;
  }

  // check if the item by input's index exist
  const item = await managerDB.getItemByIndex(params.index);
  if (!item) {
    result.error = true;
    result.message = `Invalid index. There is no tree with such ${params.index} index.`;
    return result;
  }

  // check keys value
  const { depth } = item;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  for (let i = 0; i < params.keys.length; i += 1) {
    let bN;
    try {
      bN = BigInt(params.keys[i]);
    } catch (e) {
      result.error = true;
      result.message = `This ${params.keys[i]} key in 'keys' is not a number.`;
      return result;
    }
    if (bN > maxnumber) {
      result.error = true;
      result.message = `This ${params.keys[i]} key in 'keys' is out of range of the tree's depth.`;
      return result;
    }
  }
  return result;
}

inputErrors.gp2 = checkParamsGp2;

// Function for checking input params for method getProofByKeyWithCondition
async function checkParamsGp3(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only two keys
  if (Object.keys(params).length > 3) {
    result.error = true;
    result.message =
      'Object "params" should have only three properties - "index", "key" and "condition".';
    return result;
  }
  // check if the keys of params are index and key and condition (can be improved with more detailed messages)
  if (
    !Object.prototype.hasOwnProperty.call(params, "index") ||
    !Object.prototype.hasOwnProperty.call(params, "key") ||
    !Object.prototype.hasOwnProperty.call(params, "condition")
  ) {
    result.error = true;
    result.message =
      'There is no required properties "index" and/or "key" and/or "condition" in object "params".';
    return result;
  }
  // check data type of index
  if (typeof params.index !== "number") {
    result.error = true;
    result.message = 'Invalid data type of "index". Must be a number.';
    return result;
  }
  // check if the item by input's index exist
  const item = await managerDB.getItemByIndex(params.index);
  if (!item) {
    result.error = true;
    result.message = `Invalid index. There is no tree with such ${params.index} index.`;
    return result;
  }

  // check data types of key and condition
  if (
    typeof params.key !== "string" ||
    Object.prototype.toString.call(params.condition) !== "[object Object]"
  ) {
    if (typeof params.key === "string") {
      result.error = true;
      result.message = 'Invalid data type of "condition". Must be an object.';
      return result;
    }
    result.error = true;
    result.message = 'Invalid data type of "key". Must be a string.';
    return result;
  }

  // check key value

  const { depth } = item;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  let bN;
  try {
    bN = BigInt(params.key);
  } catch (e) {
    result.error = true;
    result.message = `This "${params.key}" key is not a number.`;
    return result;
  }
  if (bN > maxnumber) {
    result.error = true;
    result.message = `This "${params.key}" key is out of range of the tree's depth.`;
    return result;
  }

  // check condition keys
  const keysOfCondition = Object.keys(params.condition);
  for (let i = 0; i < keysOfCondition.length; i += 1) {
    try {
      bN = BigInt(keysOfCondition[i]);
    } catch (e) {
      result.error = true;
      result.message = `This ${keysOfCondition[i]} key in 'condition' is not a number.`;
      return result;
    }
    if (bN > maxnumber) {
      result.error = true;
      result.message = `This ${keysOfCondition[i]} key in 'condition' is out of range of the tree's depth.`;
      return result;
    }
  }

  // check condition values
  const valuesOfCondition = Object.values(params.condition);
  for (let i = 0; i < valuesOfCondition.length; i += 1) {
    const strRegex = "^0[xX][0-9a-fA-F]+$";
    const regex = new RegExp(strRegex);
    if (
      valuesOfCondition[i].length !== 66 ||
      !regex.test(valuesOfCondition[i])
    ) {
      result.error = true;
      result.message = `Invalid format of the value "${valuesOfCondition[i]}" in 'condition'. Valid format for values is "0x0000000000000000000000000000000000000000000000000000000000000000".`;
      return result;
    }
  }
  return result;
}

inputErrors.gp3 = checkParamsGp3;

// Function for checking input params for method getProofByKeysWithCondition
async function checkParamsGp4(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only two keys
  if (Object.keys(params).length > 3) {
    result.error = true;
    result.message =
      'Object "params" should have only three properties - "index", "keys" and "condition".';
    return result;
  }
  // check if the keys of params are index and keys and condition (can be improved with more detailed messages)
  if (
    !Object.prototype.hasOwnProperty.call(params, "index") ||
    !Object.prototype.hasOwnProperty.call(params, "keys") ||
    !Object.prototype.hasOwnProperty.call(params, "condition")
  ) {
    result.error = true;
    result.message =
      'There is no required properties "index" and/or "keys" and/or "condition" in object "params".';
    return result;
  }
  // check data type of index
  if (typeof params.index !== "number") {
    result.error = true;
    result.message = 'Invalid data type of "index". Must be a number.';
    return result;
  }
  // check if the item by input's index exist
  const item = await managerDB.getItemByIndex(params.index);
  if (!item) {
    result.error = true;
    result.message = `Invalid index. There is no tree with such ${params.index} index.`;
    return result;
  }

  // check data types of keys and condition
  if (
    Object.prototype.toString.call(params.keys) !== "[object Array]" ||
    Object.prototype.toString.call(params.condition) !== "[object Object]"
  ) {
    if (Object.prototype.toString.call(params.keys) === "[object Array]") {
      result.error = true;
      result.message = 'Invalid data type of "condition". Must be an object.';
      return result;
    }
    result.error = true;
    result.message = 'Invalid data type of "keys". Must be an array.';
    return result;
  }

  // check keys values

  const { depth } = item;
  const maxnumber = BigInt(2 ** depth) - BigInt(1);

  for (let i = 0; i < params.keys.length; i += 1) {
    let bN;
    try {
      bN = BigInt(params.keys[i]);
    } catch (e) {
      result.error = true;
      result.message = `This ${params.keys[i]} key in 'keys' is not a number.`;
      return result;
    }
    if (bN > maxnumber) {
      result.error = true;
      result.message = `This ${params.keys[i]} key in 'keys' is out of range of the tree's depth.`;
      return result;
    }
  }

  // check condition keys
  const keysOfCondition = Object.keys(params.condition);
  for (let i = 0; i < keysOfCondition.length; i += 1) {
    let bN;
    try {
      bN = BigInt(keysOfCondition[i]);
    } catch (e) {
      result.error = true;
      result.message = `This "${keysOfCondition[i]}" key in 'condition' is not a number.`;
      return result;
    }
    if (bN > maxnumber) {
      result.error = true;
      result.message = `This "${keysOfCondition[i]}" key in 'condition' is out of range of the tree's depth.`;
      return result;
    }
  }

  // check condition values
  const valuesOfCondition = Object.values(params.condition);
  for (let i = 0; i < valuesOfCondition.length; i += 1) {
    const strRegex = "^0[xX][0-9a-fA-F]+$";
    const regex = new RegExp(strRegex);
    if (
      valuesOfCondition[i].length !== 66 ||
      !regex.test(valuesOfCondition[i])
    ) {
      result.error = true;
      result.message = `Invalid format of the value "${valuesOfCondition[i]}" in 'condition'. Valid format for values is "0x0000000000000000000000000000000000000000000000000000000000000000".`;
      return result;
    }
  }
  return result;
}

inputErrors.gp4 = checkParamsGp4;

// Function for checking input params for method getRoot
function checkParamsGR(params) {
  const result = {
    error: false,
    message: null
  };
  // check if the params have only four keys
  if (Object.keys(params).length > 4) {
    result.error = true;
    result.message =
      'Object "params" should have only four properties - "smtDEPTH", "key", "value" and "proof".';
    return result;
  }
  // check if the keys of params are smtDEPTH, key, value and proof (can be improved with more detailed messages)
  if (
    !Object.prototype.hasOwnProperty.call(params, "smtDEPTH") ||
    !Object.prototype.hasOwnProperty.call(params, "key") ||
    !Object.prototype.hasOwnProperty.call(params, "value") ||
    !Object.prototype.hasOwnProperty.call(params, "proof")
  ) {
    result.error = true;
    result.message =
      'There is no required properties "smtDEPTH" and/or "key" and/or "value" and/or "proof" in object "params".';
    return result;
  }
  // check data type of smtDEPTH
  if (typeof params.smtDEPTH !== "number") {
    result.error = true;
    result.message = 'Invalid data type of "smtDEPTH". Must be a number.';
    return result;
  }
  // check depth number - must be in range from 8 to 256
  if (params.smtDEPTH < 8 || params.smtDEPTH > 256) {
    result.error = true;
    result.message = "Number of 'smtDEPTH' must be in range from 8 to 256.";
    return result;
  }

  // check data types of key, value and proof
  if (
    Object.prototype.toString.call(params.key) !== "[object String]" ||
    Object.prototype.toString.call(params.value) !== "[object String]" ||
    Object.prototype.toString.call(params.proof) !== "[object String]"
  ) {
    if (Object.prototype.toString.call(params.key) !== "[object String]") {
      result.error = true;
      result.message = 'Invalid data type of "key". Must be a string.';
      return result;
    } else if (Object.prototype.toString.call(params.value) !== "[object String]") {
      result.error = true;
      result.message = 'Invalid data type of "value". Must be a string.';
      return result;
    }
    result.error = true;
    result.message = 'Invalid data type of "proof". Must be a string.';
    return result;
  }

  // check key value
  const maxnumber = BigInt(2 ** params.smtDEPTH) - BigInt(1);

  let bN;
  try {
    bN = BigInt(params.key);
  } catch (e) {
    result.error = true;
    result.message = `This "${params.key}" key is not a number.`;
    return result;
  }
  if (bN > maxnumber) {
    result.error = true;
    result.message = `This "${params.key}" key is out of range of the tree's depth.`;
    return result;
  }

  // check value
  const strRegex = "^0[xX][0-9a-fA-F]+$";
  const regex = new RegExp(strRegex);
  if (
    params.value.length !== 66 ||
    !regex.test(params.value)
  ) {
    result.error = true;
    result.message = `Invalid format of the value "${params.value}". Valid format for value is "0x0000000000000000000000000000000000000000000000000000000000000000".`;
    return result;
  }

  // check proof
  if (!regex.test(params.proof)) {
    result.error = true;
    result.message = `Invalid format of the proof "${params.proof}".`;
    return result;
  }

  return result;
}

inputErrors.gR = checkParamsGR;


exports.Methods = Methods;
exports.inputErrors = inputErrors;
