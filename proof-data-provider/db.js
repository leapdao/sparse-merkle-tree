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
  let item = await client.get(_index);
  return JSON.parse(item);
};

//@param _index must be string
//@param _data object
//adds new item to db
async function putItemByIndex(_index, _data) {
  return await client.set(_index, JSON.stringify(_data));
};
//updates item's leaves and blockNumber
//@param _index must be a string
async function updateItem(_index, _depth, _blockNumber, _leaves) {
  let item = await client.get(_index);
  item = JSON.parse(item);

  if (!item) {
    console.log(`There is no item with such index: ${_index} inside current state of the database`);
    return;
  }

  if (item.depth === _depth) {
    item.blockNumber = _blockNumber;
    item.leaves = _leaves;
  }

  return await client.set(_index, JSON.stringify(item));
};

dbManager["getItemByIndex"] = getItemByIndex;
dbManager["putItemByIndex"] = putItemByIndex;
dbManager["updateItem"] = updateItem;
module.exports = dbManager;
