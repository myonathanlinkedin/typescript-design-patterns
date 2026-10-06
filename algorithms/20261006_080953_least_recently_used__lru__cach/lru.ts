/**
 * Least Recently Used (LRU) cache implementation using a doubly linked list.
 */
class LRUCache {
  private nodes: ListNode[];

  constructor(capacity: number) {
    this.nodes = [];
  }

  public put(key: number, value: number): void {
    const node = new ListNode(key, null, this.nodes[0]);
    this.nodes[0].next!.prev = node;
    node.prev = this.nodes[0];
    node.next = this.nodes[0];
    this.nodes[0].prev = node;
  }

  public get(key: number): number | undefined {
    if (!this.nodes.length) return undefined;

    const node = this.nodes[0];
    while (node.next!.prev!.value < node.value) {
     node = node.next!;
    }
    return node.value;
  }
}
