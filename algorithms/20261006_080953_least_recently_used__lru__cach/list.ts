/**
 * A doubly linked list node.
 */
class ListNode {
  value: number;
  prev: ListNode | null;
  next: ListNode | null;

  constructor(value: number, prev?: ListNode | null, next?: ListNode | null) {
    this.value = value;
    this.prev = prev;
    this.next = next;
  }
}
