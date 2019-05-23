const SparseMerkleTree = artifacts.require("SparseMerkleTree");
const SmtLib = require('./helpers/SmtLib.js');

contract("SparseMerkleTree", accounts => {

  it("should allow to verify proofs with single intersection at 1", async() => {
    const smt = await SparseMerkleTree.new();
    const leafZero = '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563';
    const leafOne = '0x1100000000000000000000000000000000000000000000000000000000000011';
    const leafTwo = '0x2200000000000000000000000000000000000000000000000000000000000022';
    const tree = new SmtLib(64, {
        '0': leafOne,
        '1': leafTwo,
    });
    let rsp = await smt.getRoot(leafOne, 0, tree.createMerkleProof('0'));
    assert.equal(rsp, tree.root);
    rsp = await smt.getRoot(leafTwo, 1, tree.createMerkleProof('1'));
    assert.equal(rsp, tree.root);
    rsp = await smt.getRoot(leafZero, 2, tree.createMerkleProof('2'));
    assert.equal(rsp, tree.root);
  });

  it("should allow to verify proof with multiple intersections", async() => {
    const smt = await SparseMerkleTree.new();
    const leafZero = '0x1100000000000000000000000000000000000000000000000000000000000011';
    const leafOne = '0x2200000000000000000000000000000000000000000000000000000000000022';
    const leafTwo = '0x3300000000000000000000000000000000000000000000000000000000000033';
    const tree = new SmtLib(64, {
        '123': leafZero,
        '256': leafOne,
        '304': leafTwo,
    });
    let rsp = await smt.getRoot(leafZero, 123, tree.createMerkleProof('123'));
    assert.equal(rsp, tree.root);
    rsp = await smt.getRoot(leafOne, 256, tree.createMerkleProof('256'));
    assert.equal(rsp, tree.root);
  });

});