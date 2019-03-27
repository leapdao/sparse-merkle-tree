import { assert } from 'chai';
import { keccak256, bufferToHex } from 'ethereumjs-util';
import BubbleTree, { getBit } from '../src/bsmt';


describe('Binary Sparse Merkle Tree', () => {
  beforeEach(() => {
    //
  });

  it('should allow to read bits', () => {
  	const hex = '0102030405060708090a0b0c0d0e0f1011121314';
  	const offset = 152;
    assert.equal(getBit(Buffer.from(hex, 'hex'), 0 + offset), 0);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 1 + offset), 0);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 2 + offset), 0);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 3 + offset), 1);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 4 + offset), 0);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 5 + offset), 1);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 6 + offset), 0);
    assert.equal(getBit(Buffer.from(hex, 'hex'), 7 + offset), 0);
  });

  it('should allow to have tree with 1 element', () => {
  	const key = Buffer.from('0000000000000000000000000000000000000000', 'hex');
  	const value = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
  	const bsmt = new BubbleTree([{key, value}]);
  	const leaf = keccak256(Buffer.concat([key, value]));
  	assert.equal(bsmt.getHexRoot(), bufferToHex(leaf));
  });

  it('should allow to have tree with 2 element', () => {
  	const key1 = Buffer.from('0000000000000000000000000000000000000001', 'hex');
  	const value1 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
  	const key2 = Buffer.from('0000000000000000000000000000000000000002', 'hex');
  	const value2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex');
  	const bsmt = new BubbleTree([{key: key1, value: value1}, {key: key2, value: value2}]);
  	const leaf1 = keccak256(Buffer.concat([key1, value1]));
  	const leaf2 = keccak256(Buffer.concat([key2, value2]));
  	assert.equal(bsmt.getHexRoot(), bufferToHex(keccak256(Buffer.concat([leaf1, leaf2]))));
  });

  it('should allow to have tree with 2 element unsorted', () => {
  	const key1 = Buffer.from('0000000000000000000000000000000000000002', 'hex');
  	const value1 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex');
  	const key2 = Buffer.from('f000000000000000000000000000000000000000', 'hex');
  	const value2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
  	const bsmt = new BubbleTree([{key: key2, value: value2}, {key: key1, value: value1}]);
  	const leaf1 = keccak256(Buffer.concat([key1, value1]));
  	const leaf2 = keccak256(Buffer.concat([key2, value2]));
  	assert.equal(bsmt.getHexRoot(), bufferToHex(keccak256(Buffer.concat([leaf1, leaf2]))));
  });

  it('should throw on proof with non-contained element', () => {
    const key1 = Buffer.from('0000000000000000000000000000000000000001', 'hex');
    const value1 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
    const bsmt = new BubbleTree([{key: key1, value: value1}]);
    try {
      bsmt.getProof(Buffer.from('0000000000000000000000000000000000000002', 'hex'));
      assert(false, 'should have thrown');
    } catch (err) {
      assert.equal(err.message, 'element not contained.');
    }
  });

  it('should allow to get proof of inclusion', () => {
  	const key1 = Buffer.from('0000000000000000000000000000000000000001', 'hex');
  	const value1 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
  	const key2 = Buffer.from('0000000000000000000000000000000000000005', 'hex');
  	const value2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex');
  	const bsmt = new BubbleTree([{key: key1, value: value1}, {key: key2, value: value2}]);
  	const proof = bsmt.getIncProof(key1);
    assert.equal(proof.value, value1);
    assert(proof.siblings[0].equals(keccak256(Buffer.concat([key1, value1]))));
    assert(proof.trail.equals(Buffer.from('0000000000000000000000000000000000000004', 'hex')));
  });

  it('should allow to get proof of exclusion', () => {
    const key1 = Buffer.from('0000000000000000000000000000000000000001', 'hex');
    const value1 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
    const key2 = Buffer.from('0000000000000000000000000000000000000005', 'hex');
    const value2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex');
    const bsmt = new BubbleTree([{key: key1, value: value1}, {key: key2, value: value2}]);
    const proof1 = bsmt.getProof(key1);
    const proof2 = bsmt.getProof(key2);
    console.log(proof1);
    console.log(proof2);
    // wip
  });

});