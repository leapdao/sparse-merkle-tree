import { assert } from 'chai';

import ethUtil from 'ethereumjs-util';

import { CSMT } from '../dist/csmt';
import { distance } from '../dist/utils';

describe('CSMT', () => {

  beforeEach(() => {

  });

  it('new', () => {
    const tree = CSMT.new();
    assert(tree);
  });

  it('insert empty', () => {
    let tree = CSMT.new();
    console.log(tree);
    tree = CSMT.insert(tree, Buffer.alloc(10));
    console.log(tree);
    tree = CSMT.insert(tree, Buffer.alloc(11));
    console.log(tree);
    tree = CSMT.insert(tree, Buffer.alloc(12));
    console.log(tree);
    tree = CSMT.insert(tree, Buffer.alloc(13));
    console.log(tree);
  });

});