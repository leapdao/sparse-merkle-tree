import { Hash } from './types';
import xor = require('buffer-xor');
import { BigNumber } from 'bignumber.js';
import { bufferToHex, keccak256 } from 'ethereumjs-util';

export enum Compare {
  LESS,
  GREATER,
  EQUAL,
}

export function distance(key1: Hash, key2: Hash): BigNumber {
  const xored: Buffer = xor(key1, key2);
  const number: BigNumber = new BigNumber(bufferToHex(xored));
  return number;
}

export function compareBigNumber(number1: BigNumber, number2: BigNumber): Compare {
  if (number1.isEqualTo(number2)) {
    return Compare.EQUAL;
  } else if (number1.isGreaterThan(number2)) {
    return Compare.GREATER;
  } else {
    return Compare.LESS;
  }
}

export function compareKeys(key1: Hash, key2: Hash): Compare {
  const number1: BigNumber = new BigNumber(bufferToHex(key1));
  const number2: BigNumber = new BigNumber(bufferToHex(key2));
  return compareBigNumber(number1, number2);
}

export function mergeHash(hash1: Hash, hash2: Hash): Hash {
  return keccak256(Buffer.concat([hash1, hash2]));
}

export function maxKey(key1: Hash, key2: Hash): Hash {
  if (compareKeys(key1, key2) == Compare.GREATER) {
    return key1;
  } else {
    return key2;
  }
}

export function minKey(key1: Hash, key2: Hash): Hash {
  if (compareKeys(key1, key2) == Compare.LESS) {
    return key1;
  } else {
    return key2;
  }
}