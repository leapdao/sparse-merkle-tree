import { NodeTag, Leaf, Parent, TreeNode, Tree, Hash } from './types';
import { BigNumber } from 'bignumber.js'; 
import { keccak256 } from 'ethereumjs-util';
import { Compare, distance, compareBigNumber, compareKeys, mergeHash, maxKey, minKey } from './utils';

export class CSMT {

  static new(): Tree {
    return {
      root: {
        tag: NodeTag.LEAF,
        key: keccak256(Buffer.alloc(0)),
        hash: keccak256(Buffer.alloc(0)),
      },
      size: 0
    };
  }

  static insert(tree: Tree, value: Buffer): Tree {
    switch(tree.size) {
      case 0:
        return CSMT.doInsertEmpty(tree, value);
      default:
        return CSMT.doInsert(tree, value);
    }
  }

  private static doInsertEmpty(tree: Tree, value: Buffer): Tree {
    return {
      root: {
        tag: NodeTag.LEAF,
        key: keccak256(value),
        hash: keccak256(value),
      },
      size: 1
    };
  }

  private static doInsert(tree: Tree, value: Buffer): Tree {
    const key: Hash =  keccak256(value);
    return {
      root: CSMT.rec_insert(tree.root, key),
      size: tree.size + 1
    };
  }

  private static rec_insert(node: TreeNode, key: Hash): TreeNode {
    switch (node.tag) {
      case NodeTag.LEAF: {
        const newLeaf: Leaf = {
          tag: NodeTag.LEAF,
          key: key,
          hash: key,
        }
        switch(compareKeys(key, node.key)) {
          case Compare.EQUAL: {
            throw new Error('Key exists');
          }
          case(Compare.GREATER): {
            return {
              tag: NodeTag.PARENT,
              right: newLeaf,
              left: node,
              hash: mergeHash(node.hash, newLeaf.hash),
              key: maxKey(node.key, newLeaf.key)
            };
          }
          case(Compare.LESS): {
            return {
              tag: NodeTag.PARENT,
              right: node,
              left: newLeaf,
              hash: mergeHash(newLeaf.hash, node.hash),
              key: maxKey(newLeaf.key, node.key)
            };
          }
        }
      }
      case NodeTag.PARENT: {
        const parent: Parent = node as Parent;
        const leftDist: BigNumber = distance(parent.hash, parent.left.hash);
        const rightDist: BigNumber = distance(parent.hash, parent.right.hash);
        switch (compareBigNumber(leftDist, rightDist)) {
          case Compare.EQUAL: {
            const newLeaf: Leaf = {
              tag: NodeTag.LEAF,
              key: key,
              hash: key,
            }
            const mKey: Hash = minKey(parent.left.key, parent.right.key);
            if (compareKeys(key, mKey) == Compare.LESS) {
              return {
                tag: NodeTag.PARENT,
                left: newLeaf,
                right: parent,
                hash: mergeHash(newLeaf.hash, parent.hash),
                key: maxKey(newLeaf.key, parent.key),
              }
            } else {
              return {
                tag: NodeTag.PARENT,
                left: parent,
                right: newLeaf,
                hash: mergeHash(parent.hash, newLeaf.hash),
                key: maxKey(newLeaf.key, parent.key),
              }
            }
          }
          case Compare.LESS:
            const newLeft = CSMT.rec_insert(parent.left, key);
            return {
                tag: NodeTag.PARENT,
                left: newLeft,
                right: parent.right,
                hash: mergeHash(newLeft.hash, parent.right.hash),
                key: maxKey(newLeft.key, parent.right.key),
            }
          case Compare.GREATER:
            const newRight = CSMT.rec_insert(parent.right, key);
            return {
                tag: NodeTag.PARENT,
                left: parent.left,
                right: newRight,
                hash: mergeHash(parent.left.hash, newRight.hash),
                key: maxKey(newRight.key, parent.left.key),
            }
        }
        return node;
      }
    }
  }

}