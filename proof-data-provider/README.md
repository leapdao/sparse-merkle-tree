# Proof-data-provider for sparse-merkle-trees

Welcome to the proof data-provider for the Sparse Merkle Trees (SMT).

The purpose of the provider is to give the ability for users to save their sparse merkle trees, update them and take proofs for their keys.

You can use any key (in a range from 1byte to 32bytes) and the value of 32bytes.  

The service endpoint is http://3.9.177.228/.

The service uses [JSON RPC 2.0](https://www.jsonrpc.org/specification) protocol.

The service's API has three blocks: SaveTree, UpdateTree, GetProof.
You can use all the procedures of these blocks by sending POST requests with the data in the strict format that is described below.

Config for [Postman](https://www.getpostman.com/): https://gist.github.com/troggy/8a1cc2565f81f1a6e64a3fed5407f800

For example, using curl:

```sh
curl -X POST http://3.9.177.228/ -H 'Content-Type: application/json' -d '{
  "jsonrpc":"2.0",
  "method":"addTreeManually",
  "params": {
    "depth": 16,
    "leaves": {"15":"0x0000000000000000000000000000000000000000000000000000000000000001", "24":"0x0000000000000000000000000000000000000000000000000000000000000002", "255": "0x0000000000000000000000000000000000000000000000000000000000000003"}
  },
  "id": 65
  }'
```

## SaveTree block

### Method - `addTreeManually`

You can save your tree to the provider's database manually by sending POST request with corresponding data inside it:

- `depth` — depth. Number
- `leaves` — Object with leaves values.

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "addTreeManually",
  "params": {
    "depth": 160,
    "leaves": {
      "0x0000000000000000000000000000000000000001": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002": "0x0000000000000000000000000000000000000000000000000000000000000002"
    }
  },
  "id": 64
}
```

Example of the response:

```json
{"jsonrpc":"2.0", "id":64, "result":307534184564}
```

The response is your tree's INDEX into provider's database. You need to save it. You will use it in all your next interactions with your sparse-merkle-tree.

### Method - `addTreeFromContract`

Smart contract with sparse merkle tree. If you have smart contract that uses sparse merkle tree you can fill the strict JSON form with your values and send POST request with this config. Your tree will be created by fetching data from the Ethereum network with the help of your event and updates will be done automatically every time you interact with the provider.

Prerequisites:

- During development your smart contract you should create an event that will receive two parameters key and value of your sparse merkle tree and emit it every time when you write a new value to your sparse merkle tree (don't forget, if you write something to SMT in constructor function you should emit event there too).

Strict JSON form(all keys should be the same and value's data type as well):

```json
{
  "smtDEPTH" : 160,
  "net" : "ropsten",
  "contractABI" : [...],
  "eventName" : "Write",
  "contractAddress" : "0x89E5afFfC89185aF83Bc3aa02da227aCf30c9ACB"
}
```

- `smtDEPTH` - The depth of the sparse merkle tree, that is used in the smart contract.
- `net` - Ethereum network where the smart contract was deployed. Must be one of the following ['mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli'] if Infura provider is used and specific URL value if using your own ethereum node (depends on the network id that run node, can be one of the above or 'custom' for other networks). Anyway, response with error helps to define.
- `contractAddress` - The address of the smart contract that use sparse merkle tree. Must be ChecksumAddress.
- `contractABI` - The smart contract's ABI that use sparse merkle tree.
- `eventName` - The name of the event that is described in requirements above. The second event's argument (value) data type must be bytes32. The first one (key) data type may be address or uint8...uint256 or bytes1...bytes32.

Example of the request payload:

```json
{"jsonrpc":"2.0", "method": "addTreeFromContract", "params": {"config": {
  "smtDEPTH" : 160,
  "net" : "ropsten",
  "contractABI" : [...],
  "eventName" : "Write",
  "contractAddress" : "0x89E5afFfC89185aF83Bc3aa02da227aCf30c9ACB"
}}, "id":24}
```

Example of the response:

```json
{"jsonrpc":"2.0", "id":24, "result":117215783947}
```

The response is your tree's INDEX into provider's database. You need to save it. You will use it in all your next interactions with your sparse-merkle-tree.

## UpdateTree block

### Method - `updateTreeManually`

If you set up your tree manually, you are able to update it manually.

You should send POST request with corresponding data inside it:

- `index` — (you received index of your tree when you created it using "addTreeManually" method). Number
- `leaves` — (leaves must contain only new data, if values of already existing keys was changed, this key/value pairs must be included). Object

Example of the request payload:
  
```json
{
  "jsonrpc": "2.0",
  "method": "updateTreeManually",
  "params": {
    "index": 307534184564,
    "leaves": {
      "0x0000000000000000000000000000000000000005": "0x0000000000000000000000000000000000000000000000000000000000000007",
      "0x0000000000000000000000000000000000000002": "0x0000000000000000000000000000000000000000000000000000000000000003"
    }
  },
  "id": 32
}
```

Example of the response:

```json
{"jsonrpc":"2.0", "id":32, "result":true}
```

### Method - `extraUpdateTreeFromContract`

Normally, you shouldn't use this method at all. If you add your tree from your smart contract with config you shouldn't update your tree manually. Autoupdate function is working every time you interact with the provider by your index (mostly, when different getProof methods are invoked). This method is for abnormal behaviour. You can use it, e.g. inside catching error logic, when your proofs are incorrect. The case when it may happen is if in the Ethereum blockchain occurs disagreement in miners competition and when chain was splitted autoUpdate function fetched the data from the chain that loses in the longest chain rule.

You should send POST request with corresponding data inside it:

- `index` — (you received index of your tree when you created it using "addTreeFromContract" method). The value's data type must be `number`.

The method will fetch data starting from the 0 block and updates your item in provider's database.

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "extraUpdateTreeFromContract",
  "params": {
    "index": 117215783947
  },
  "id": 132
}
```

Example of the response:

```json
{"jsonrpc":"2.0", "id":132, "result":true}
```

## GetProof block

There are several methods that you can use to get proofs depends on your needs.

### Option1. Method - `getProofByKey`

Your choice, if you just want to get proof for one key. You need to send POST request with the data, object params should include two keys:

- `index` — (index of your tree in the provider's database, you got it when you used SaveTree block's methods). Number
- `key` — key. String

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "getProofByKey",
  "params": {
    "index": 117215783947,
    "key": "0xabcdef123456789deadbeaf00000000000000000"
  },
  "id": 1
}
```

Example of the response:

```json
{
  "jsonrpc": "2.0",
  "result": "0x8000000000000000000000000000000000000000ab226fd51d2cf039df4890fb09b5d785c63cf076d1517b68e62515fe53cb612f",
  "id": 1
}
```

### Option2. Method - `getProofByKeys`

Your choice, if you want to get proofs for several keys.
You need to send POST request with the data, object params should include two keys:

- `index` — (index of your tree in the provider's database, you got it when you used SaveTree block). Number
- `keys` — array of keys

You will get as a return array of proofs in the same order as the keys in a request was (meaning that array index for key in request is the same for it's proof in the response).

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "getProofByKeys",
  "params": {
    "index": 231034632258,
    "keys": [
      "0x43",
      "0x12",
      "0xad",
      "0xbb",
      "0xac"
    ]
  },
  "id": 17
}
```

Example of the response:

```json
{
  "jsonrpc": "2.0",
  "result": [
    "0x9c61a9bcd8db20d6c5296bfbec74de5ec0441e9fca2a056193c9caf969b3db482e354099b38f42dd6c669facd5d35539d5a1ad4287ea437de169f3f9648de92c927d4c98302aa9fc65d33a4d82abf700b466e8a69278a5433bc92f30b2550ccc36c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0x9a3b492777b1837bd1931b8831edba9eeda881480abf69feddc75a66765c78d0f5354099b38f42dd6c669facd5d35539d5a1ad4287ea437de169f3f9648de92c927d4c98302aa9fc65d33a4d82abf700b466e8a69278a5433bc92f30b2550ccc36c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0xc0f559520408644a656f1fa4d20d750cbb77a6b26d2e78cd5e764a5543aa3a5a69c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0xc0f559520408644a656f1fa4d20d750cbb77a6b26d2e78cd5e764a5543aa3a5a69c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0xc0ed7d238cde1eb20e70e70063f944fc9409230e1d1b7db639495856be6f9ba4e8c3df0ad55fc8d5d7b3decbdec0924c98bffa0413d9235283d2052553c88593db"
  ],
  "id": 17
}
```

### Option3. Method - `getProofByKeyWithCondition`

Your choice, if you want to get one proof for one key with the condition of changing another one key/value pair or several key/value pairs in the tree.
You need to send POST request with the data, object params should include three keys:

- `index` — (index of your tree in the provider's database, you got it when you used SaveTree block)
- `key`
- `condition` — (the new key/value pair/s or existing key/s with new value/s, where key and value data types must be strings), the values data types must be "number" and "string" and "object" correspondingly. The condition itself doesn't change the current state of the tree into database.

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "getProofByKeyWithCondition",
  "params": {
    "index": 231034632258,
    "key": "0x43",
    "condition": {
      "0x43": "0xababcbabc6b9bbdd34babbc2347867836584308798273498723984a00987accd",
      "0xad": "0x2873487162378463287623478678365843087982734987239847239700987431",
      "0xbb": "0x867463217657656746544334d2adaecec4ea5ec4ede45ae4ed45a34276565320",
      "0xac": "0x468764a6454d43d2d643d4c876a98768978979e789e7f78f7f78789e875532ee"
    }
  },
  "id": 19
}
```

Example of the response:

```json
{
  "jsonrpc": "2.0",
  "result": "0xc0eec8ae03dd91ce3354ffaf18ecb5cadf111bd46e5c53d4510db087415bb91430a6a637bef2bf8ef84bda7cc9bcf53bdaf756cf3660acfcd46b089ed69b4b443d",
  "id": 19
}
```

### Option4. Method - `getProofByKeysWithCondition`

Your choice, if you want to get several proofs for several keys with the condition of changing another one key/value pair or several key/value pairs in the tree.
You need to send POST request with the data, object params should include three keys:

- `index` — (index of your tree in the provider's database, you got it when you used SaveTree block)
- `keys`
- `condition` (the new key/value pair/s or existing key/s with new value/s, where key and value data types must be strings), the values data types must be "number" and "array" and "object" correspondingly. The condition itself doesn't change the current state of the tree into database.

You will get as a return array of proofs in the same order as the keys in a request was (meaning that array index for key in request is the same for it's proof in the response).

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "getProofByKeysWithCondition",
  "params": {
    "index": 231034632258,
    "keys": [
      "11",
      "12",
      "64",
      "98",
      "202"
    ],
    "condition": {
      "15": "0x5757a77c5c57573328762347867836584308798273498723984723970acccaaa",
      "23": "0x3998965623784632876234acabbb43b432879827349872398472397009870024"
    }
  },
  "id": 219
}```

Example of the response:

```json
{
  "jsonrpc": "2.0",
  "result": [
    "0x9c61a9bcd8db20d6c5296bfbec74de5ec0441e9fca2a056193c9caf969b3db482e354099b38f42dd6c669facd5d35539d5a1ad4287ea437de169f3f9648de92c927d4c98302aa9fc65d33a4d82abf700b466e8a69278a5433bc92f30b2550ccc36c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0x9a3b492777b1837bd1931b8831edba9eeda881480abf69feddc75a66765c78d0f5354099b38f42dd6c669facd5d35539d5a1ad4287ea437de169f3f9648de92c927d4c98302aa9fc65d33a4d82abf700b466e8a69278a5433bc92f30b2550ccc36c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0xc0f559520408644a656f1fa4d20d750cbb77a6b26d2e78cd5e764a5543aa3a5a69c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0xc0f559520408644a656f1fa4d20d750cbb77a6b26d2e78cd5e764a5543aa3a5a69c147333d44ca4a96cf4a2b8f37843b5eda0604e85a2e30cf8fd3443e163334d8",
    "0xc0ed7d238cde1eb20e70e70063f944fc9409230e1d1b7db639495856be6f9ba4e8c3df0ad55fc8d5d7b3decbdec0924c98bffa0413d9235283d2052553c88593db"
  ],
  "id": 219
}
```

## Helper methods block

### Method - `getRoot`

You can check the correctness of the proof that you got by getProof methods without conditions with the help of this method.

Invoke this method with params that includes four keys:

- `smtDEPTH` — must be a number (the depth of your sparse merkle tree in range from 8 to 256)
- `key` — must be a string contains hex value
- `value` — must be a string contains 32-bytes hex value (notice, that you need to know exactly value)
- `proof` — must be a hex string (for example, one that you got as a result of invoking getProof methods without conditions)

You will get a root of the sparse merkle tree that contains your value by your key.

It allows you just compare the root of your tree and a root from the result, if roots match - your proof is correct.

Example of the request payload:

```json
{
  "jsonrpc": "2.0",
  "method": "getRoot",
  "params": {
    "smtDEPTH": 160,
    "key": "0xdBa97dCe40F531c1354a95B1456ca41e3cdCd2dB",
    "value": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "proof": "0xd000000000000000000000000000000000000000383a61e95fcd8551ad94a58c74bc05d74d32c4006b6735e7f76144958d946a68c36b0130fee2f6058afb2f7387aeb09ff99eaca213f5da71466c121b91021fd4e5aa28271290de5c23fdb760a3e5c4ba78cd20d6b546fea21248166cc9383206"
  },
  "id": 1
}
```

Example of the response:

```json
{
  "jsonrpc": "2.0",
  "result": "0x699d6b9610b8d4716962896ef3c9cbc54469f5a6bf501ade346c2864d2d87331",
  "id": 1
}
```

## Configuration

To create a config, do the following:

```sh
cp config/default_template.json config/default.json
```

Field "useOwnNode":

- Set flag true if you want to use your own Ethereum node and fill fields "node.fullURL" with your node full url and "node.network_id" with id of the network that run your node (skip field "infuraId").
- Set flag false if you want to use Infura (skip field "node") and fill "infuraId" field with your own infura project id key.

This service uses a redis instance as a database.

## Installation

1. To build and run the container: `docker-compose up --build`

## Running the service in the cloud

To run the service in the cloud (e.g. AWS EC2 instance) transfer file `docker-compose-cloud.yml` to instance. Install docker-compose. To run this file, do

```sh
docker-compose --file docker-compose-cloud.yml up -d
```

It will run a container on a localhost on a port 3000. Recommended to use reverse proxy server, e.g. nginx. Install nginx and set up proxy_pass to http://localhost:3000.

## License

MIT
