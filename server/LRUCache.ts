interface ListNode<K, V> {
    key: K,
    value: V,

    prev: ListNode<K, V> | null,
    next: ListNode<K, V> | null
};

class LRUCache<K, V> {
    private capacity: number;
    private head: ListNode<K, V>;
    private tail: ListNode<K, V>;
    private mp = new Map<K, ListNode<K, V>>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.head = { key: null as unknown as K, value: null as unknown as V, prev: null, next: null };
        this.tail = { key: null as unknown as K, value: null as unknown as V, prev: null, next: null };
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    private addNode(toAdd: ListNode<K, V>): void {
        const temp = this.head.next;

        toAdd.next = temp;
        toAdd.prev = this.head;

        this.head.next = toAdd;
        if (temp !== null) {
            temp.prev = toAdd;
        }
    }

    private deleteNode(toDelete: ListNode<K, V>): void {
        const prevNode = toDelete.prev;
        const nextNode = toDelete.next;

        if (prevNode !== null && nextNode !== null) {
            prevNode.next = nextNode;
            nextNode.prev = prevNode;
        }
    }

    get(key: K): V | null {
        if (this.mp.has(key)) {
            const node = this.mp.get(key);

            if (node !== undefined) {
                this.deleteNode(node);
                this.addNode(node);
                return node.value;
            }
        }
        return null;
    }

    put(key: K, value: V): void {
        if (this.mp.has(key)) {
            const node = this.mp.get(key);

            if (node !== undefined) {
                node.value = value;
                this.deleteNode(node);
                this.addNode(node);
            }

            return;
        }

        if (this.mp.size == this.capacity) {
            const node = this.tail.prev;

            if (node !== null && node !== this.head) {
                this.mp.delete(node.key);
                this.deleteNode(node);
            }
        }

        const node: ListNode<K, V> = { key: key, value: value, next: null, prev: null };
        this.addNode(node);
        this.mp.set(key, node);
    }

    deleteKey(key: K): void{
        if(this.mp.has(key)){
            const node = this.mp.get(key);

            if(node !== undefined){
                this.mp.delete(key);
                this.deleteNode(node);
            }
        }
    }
}


export default LRUCache;