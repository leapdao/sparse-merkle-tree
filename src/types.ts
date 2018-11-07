export enum NodeTag {
  LEAF,
  PARENT,
}

export interface Leaf {
  readonly tag: NodeTag.LEAF;
  readonly key: Hash;
  readonly hash: Hash;
}

export interface Parent {
  readonly tag: NodeTag.PARENT;
  readonly hash: Hash;
  readonly key: Hash;
  readonly left: TreeNode;
  readonly right: TreeNode;
}

export type TreeNode = Parent | Leaf;

export interface Tree {
  readonly root: TreeNode;
  readonly size: number;
}

export type Hash = Buffer | Uint8Array;
