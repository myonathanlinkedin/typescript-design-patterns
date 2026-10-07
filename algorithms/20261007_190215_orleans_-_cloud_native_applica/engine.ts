import { Grain, GrainId, GrainFactory, Message } from "./types";

type GrainConstructor<T extends Grain> = new (id: GrainId) => T;

export class InMemoryGrainRuntime implements GrainFactory {
  private grainInstances = new Map<string, Grain>();

  private getKey(type: Function, id: GrainId): string {
    return `${type.name}:${id}`;
  }

  getGrain<T extends Grain>(ctor: GrainConstructor<T>, id: GrainId): T {
    const key = this.getKey(ctor, id);
    let instance = this.grainInstances.get(key) as T | undefined;
    if (!instance) {
      instance = new ctor(id);
      this.grainInstances.set(key, instance);
    }

    const handler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        if (typeof prop === "string" && typeof target[prop] === "function") {
          return (...args: any[]) => {
            const msg: Message = { method: prop, args };
            return (target as any).__dispatch(msg);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    };

    return new Proxy(instance, handler);
  }
}

// Example grain: a simple counter
export class CounterGrain implements Grain {
  public readonly id: GrainId;
  private count: number = 0;

  constructor(id: GrainId) {
    this.id = id;
  }

  // Internal dispatcher used by the proxy
  public __dispatch(msg: Message): any {
    const fn = (this as any)[msg.method];
    if (typeof fn !== "function") {
      throw new Error(`Method ${msg.method} not found on grain ${this.id}`);
    }
    return fn.apply(this, msg.args);
  }

  public async increment(delta: number = 1): Promise<number> {
    this.count += delta;
    return this.count;
  }

  public async getCount(): Promise<number> {
    return this.count;
  }
}
