//Database manager. Defines properties for putting, getting and updating items in db.
//REDIS
const asyncRedis = require('async-redis');
const config = require("config");
const client = asyncRedis.createClient({
  host: config.get("redis.options.host"),
  port: config.get("redis.options.port")
});

client.on("error", function (err) {
    console.log("Error " + err);
});

const dbManager = {};

//returns item object from db using item's index
async function getItemByIndex(_index) {
  let item = await client.get(_index).then(string => {
    let data = JSON.parse(string);
    return data;
  });
  return item;
};

//@param _index must be string
//@param _status boolean
//adds new item to db
async function putItemByIndex(_index, _status, _depth, _blockNumber, _leaves, _config) {
  if(_status) {
    let data = {
      depth: _depth,
      blockNumber: _blockNumber,
      leaves: _leaves,
      status: _status,
      config: _config
    };
    let result = await client.set(_index, JSON.stringify(data));
    return result; //returns promise with string 'OK'

  } else {
    let data = {
      depth: _depth,
      blockNumber: _blockNumber,
      leaves: _leaves,
      status: _status
    };
    let result = await client.set(_index, JSON.stringify(data));
    return result;
  }

};
//updates item's leaves and blockNumber
//@param _index must be a string
async function updateItem(_index, _depth, _blockNumber, _leaves) {
  let item = await client.get(_index).then(item => {
    let data = JSON.parse(item);
    return data;
  });

  if (item === null) {
    console.log(`There is no item with such index: ${_index} inside current state of the database`);
    return;
  }

  if (item.depth === _depth) {
    item.blockNumber = _blockNumber;
    item.leaves = _leaves;
  }

  let result = await client.set(_index, JSON.stringify(item));
  return result;

};

dbManager["getItemByIndex"] = getItemByIndex;
dbManager["putItemByIndex"] = putItemByIndex;
dbManager["updateItem"] = updateItem;
module.exports = dbManager;
