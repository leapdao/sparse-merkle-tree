
/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU Affero General Public License,
 * version 3, found in the LICENSE file in the root directory of this source
 * tree.
 */

// Adopted from: https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/helpers/merkleTree.js
// Changes:
// - Removed sorting and deduplication
// - Added padding to even number of elements
import { keccak256, bufferToHex } from 'ethereumjs-util';

const keyLength = 20;
const zeroKey = Buffer.alloc(keyLength, 0);

export function getBit(key, pos) {
  const bytePos = Math.floor(pos / 8);
  if (bytePos < 0 || bytePos >= keyLength) {
    throw new Error(`pos ${bytePos} out of scope`);
  }
  return (key.readInt8(bytePos) >> 7 - (pos % 8)) & 1;
}

function setTrailBit(trail, pos) { 
  const bytePos = Math.floor(pos / 8);
  let val = trail.readInt8(bytePos);
  val += 1 << 7 - (pos % 8);
  trail.writeInt8(val, bytePos);
}

export function getRoot(elements, height = 0, proof) {
  if (elements.length === 0) {
    throw new Error('0 elements 🤷‍♂️');
  }
  if (elements.length === 1) {
    if (elements[0].value.equals(zeroKey)) {
      return zeroKey;
    }
    // hash with key to prove position
    return keccak256(Buffer.concat([elements[0].key, elements[0].value]));
  }

  // compare bits, split into groups
  const left = [];
  const right = [];
  for (const el of elements) {
    if (getBit(el.key, height) === 0) {
      left.push(el);
    } else {
      right.push(el);
    }
  }
  let rootHash;
  if (left.length === 0) {
    rootHash = getRoot(right, height + 1, proof);
    return rootHash;
  }
  if (right.length === 0) {
    rootHash = getRoot(left, height + 1, proof);
    return rootHash;
  }
  const leftHash = getRoot(left, height + 1, proof);
  const rightHash = getRoot(right, height + 1, proof);
  if (leftHash.equals(zeroKey)) {
    setTrailBit(proof.trail, height);
    proof.siblings.push(rightHash);
    return rightHash;
  }
  if (rightHash.equals(zeroKey)) {
    setTrailBit(proof.trail, height);
    proof.siblings.push(leftHash);
    return leftHash;
  }
  if (proof) {
    setTrailBit(proof.trail, height);
    proof.siblings.push(getBit(proof.key, height) ? rightHash : leftHash);
  }
  return keccak256(Buffer.concat([leftHash, rightHash]));
}

/* eslint-disable class-methods-use-this */
export default class BubbleTree {

  constructor(elements) {
    if (elements) {
      // Filter empty strings and hash elements
      this.elements = elements.filter(el => {
        if (!Buffer.isBuffer(el.key) || el.key.length !== keyLength) {
          throw new Error('invalid key ' + el.key.toString('hex'));
        }
        if (!Buffer.isBuffer(el.value) || el.value.length !== 32) {
          throw new Error('invalid value ' + el.value.toString('hex'));
        }
        if (el.value.equals(Buffer.alloc(32, 0))) {
          throw new Error('empty value found at key: ' + bufferToHex(el.key));
        }
        return el;
      });
      this.root = getRoot(this.elements);
    }
  }

  getRoot() {
    return (this.root) ? this.root : getRoot(this.elements);
  }

  getHexRoot() {
    return bufferToHex(this.getRoot());
  }

  getIncProof(key) {
    const proof = { key, trail: Buffer.alloc(keyLength, 0), siblings: [] };
    for (const element of this.elements) {
      if (element.key.equals(key)) {
        proof.value = element.value;
      }
    }
    if (!proof.value) {
      throw new Error('element not contained.');
    }
    getRoot(this.elements, 0, proof);
    return proof;
  }

  getExcProof(key) {
    // what if tree empty?
    // find leftmost key
      // if no leftmost key exists???
    // find rightmost key
      // if no rightmost key exists???
    // get prooofs for both
    // combine proofs
    //   remove smallest trail bit
    //   remove last sibling
    const proof = {
      leftKey,
      leftValue,
      rightKey,
      rightValue,
      trail: Buffer.alloc(keyLength, 0),
      siblings: []
    };
    return proof;
  }

  insertElement(key, value, exclusionProof) {
    // verify exclusion proof
    // verify that key is between left and right proof keys
    // calculate new root hash
  }

  updateElement(key, value, inclusionProof) {
    // verify inclusion proof
    // verify that key matches proof key
    // caclulate new root hash
  }

  deleteElement(key, inclusionProof) {
    // verify inclusion proof
    // verify that key matches proof key
    // calculate new root hash
  }

  getHexProof(el) {
    const proof = this.getProof(el);

    return this.bufArrToHexArr(proof);
  }

  getPairElement(idx, layer) {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (pairIdx < layer.length) {
      return layer[pairIdx];
    }
    return null;
  }

  bufIndexOf(el, arr) {
    let hash;

    // Convert element to 32 byte hash if it is not one already
    if (el.length !== 32 || !Buffer.isBuffer(el)) {
      hash = keccak256(el);
    } else {
      hash = el;
    }

    for (let i = 0; i < arr.length; i++) {
      if (hash.equals(arr[i])) {
        return i;
      }
    }

    return -1;
  }

  bufArrToHexArr(arr) {
    if (arr.some(el => !Buffer.isBuffer(el))) {
      throw new Error('Array is not an array of buffers');
    }

    return arr.map(el => `0x${el.toString('hex')}`);
  }

}
/* eslint-enable class-methods-use-this */