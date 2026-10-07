export type ChangeType = 'insert' | 'update' | 'delete';

export interface ChangeEvent<T> {
  type: ChangeType;
  row: T;
}

export class Table<T extends { id: ID }, ID = string | number> {
  private rows = new Map<ID, T>();
  private listeners: Array<(e: ChangeEvent<T>) => void> = [];

  insert(row: T): void {
    if (this.rows.has(row.id as unknown as ID)) {
      throw new Error(`Row with id ${row.id} already exists`);
    }
    this.rows.set(row.id as unknown as ID, row);
    this.emit({ type: 'insert', row });
  }

  update(id: ID, partial: Partial<T>): void {
    const existing = this.rows.get(id);
    if (!existing) {
      throw new Error(`Row with id ${id} does not exist`);
    }
    const updated = { ...existing, ...partial, id } as T;
    this.rows.set(id, updated);
    this.emit({ type: 'update', row: updated });
  }

  delete(id: ID): void {
    const existing = this.rows.get(id);
    if (!existing) {
      throw new Error(`Row with id ${id} does not exist`);
    }
    this.rows.delete(id);
    this.emit({ type: 'delete', row: existing });
  }

  get(id: ID): T | undefined {
    return this.rows.get(id);
  }

  getAll(): T[] {
    return Array.from(this.rows.values());
  }

  onChange(listener: (e: ChangeEvent<T>) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: ChangeEvent<T>): void {
    for (const l of this.listeners) {
      l(event);
    }
  }
}

export class MaterializedView<T, R> {
  private value: R;
  private listeners: Array<(v: R) => void> = [];

  constructor(
    private source: Table<T>,
    private compute: (rows: T[]) => R
  ) {
    this.value = this.compute(this.source.getAll());
    this.source.onChange(() => this.recompute());
  }

  private recompute(): void {
    const newVal = this.compute(this.source.getAll());
    if (!Object.is(this.value, newVal)) {
      this.value = newVal;
      this.notify();
    }
  }

  private notify(): void {
    for (const l of this.listeners) {
      l(this.value);
    }
  }

  getValue(): R {
    return this.value;
  }

  subscribe(listener: (v: R) => void): void {
    this.listeners.push(listener);
  }
}
