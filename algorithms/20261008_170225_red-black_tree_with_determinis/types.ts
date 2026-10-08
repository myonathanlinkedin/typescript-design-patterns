// Define types for Red-Black Tree nodes and the Red-Black Tree itself

type Node<T> = {
  value: T,
  left: Node<T>,
  right: Node<T>,
  color: boolean, // Red or Black
};

type RedBlackTree<T> = {
  root: Node<T>,
  insert(value: T): void,
  delete(value: T): boolean,
  contains(value: T): boolean,
  size(): number,
};
