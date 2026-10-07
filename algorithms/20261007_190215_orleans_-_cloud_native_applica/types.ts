export type GrainId = string;

export interface Grain {
  readonly id: GrainId;
}

export interface GrainFactory {
  getGrain<T extends Grain>(type: new (id: GrainId) => T, id: GrainId): T;
}

export interface Message {
  method: string;
  args: any[];
}
