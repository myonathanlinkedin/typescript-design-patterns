export enum Color {
    White,
    Gray,
    Black
}

export class HeapObject {
    readonly id: number;
    // fields map field name to referenced object (or null)
    readonly fields: Map<string, HeapObject | null> = new Map();
    color: Color = Color.White;

    constructor(id: number) {
        this.id = id;
    }

    setField(name: string, value: HeapObject | null, gc: GC) {
        // invoke write barrier before mutating the field
        gc.writeBarrier(this, name, value);
        this.fields.set(name, value);
    }

    getField(name: string): HeapObject | null {
        return this.fields.get(name) ?? null;
    }
}

export class Heap {
    private nextId: number = 1;
    private objects: Map<number, HeapObject> = new Map();

    allocate(): HeapObject {
        const obj = new HeapObject(this.nextId++);
        this.objects.set(obj.id, obj);
        return obj;
    }

    getAllObjects(): Iterable<HeapObject> {
        return this.objects.values();
    }

    delete(obj: HeapObject): void {
        this.objects.delete(obj.id);
    }

    size(): number {
        return this.objects.size;
    }
}

export class GC {
    private heap: Heap;
    private roots: Set<HeapObject> = new Set();

    // tri‑color sets are represented implicitly via the color field
    constructor(heap: Heap) {
        this.heap = heap;
    }

    /** Register a root object (e.g., global variable, stack slot). */
    addRoot(obj: HeapObject): void {
        this.roots.add(obj);
    }

    /** Unregister a root object. */
    removeRoot(obj: HeapObject): void {
        this.roots.delete(obj);
    }

    /** Begin an incremental collection cycle. */
    start(): void {
        // 1. Paint everything white
        for (const obj of this.heap.getAllObjects()) {
            obj.color = Color.White;
        }
        // 2. Move roots to gray
        for (const root of this.roots) {
            if (root.color === Color.White) {
                root.color = Color.Gray;
            }
        }
    }

    /** Perform a single incremental step.
     *  Returns true if work remains (gray set non‑empty). */
    step(): boolean {
        // Find any gray object
        let grayObj: HeapObject | null = null;
        for (const obj of this.heap.getAllObjects()) {
            if (obj.color === Color.Gray) {
                grayObj = obj;
                break;
            }
        }
        if (!grayObj) {
            // No gray objects → marking phase finished
            return false;
        }

        // Scan gray object
        for (const [, child] of grayObj.fields) {
            if (child && child.color === Color.White) {
                child.color = Color.Gray;
            }
        }
        // Mark the scanned object black
        grayObj.color = Color.Black;
        return true;
    }

    /** Run the marking phase to completion (useful for tests). */
    markAll(): void {
        while (this.step()) { /* loop until no gray objects */ }
    }

    /** Write barrier invoked before a field update.
     *  Maintains the invariant: black objects never point to white objects. */
    writeBarrier(parent: HeapObject, _fieldName: string, newValue: HeapObject | null): void {
        if (parent.color === Color.Black && newValue && newValue.color === Color.White) {
            // The new child is white; promote it to gray so it will be scanned.
            newValue.color = Color.Gray;
        }
        // No need to recolor the parent; the invariant is restored by promoting the child.
    }

    /** Sweep phase: reclaim all white objects.
     *  Returns the list of reclaimed object ids. */
    sweep(): number[] {
        const reclaimed: number[] = [];
        for (const obj of Array.from(this.heap.getAllObjects())) {
            if (obj.color === Color.White) {
                reclaimed.push(obj.id);
                this.heap.delete(obj);
            } else {
                // Reset color for next GC cycle
                obj.color = Color.White;
            }
        }
        return reclaimed;
    }

    /** Full collection: start → mark → sweep. */
    collect(): number[] {
        this.start();
        this.markAll();
        return this.sweep();
    }
}
