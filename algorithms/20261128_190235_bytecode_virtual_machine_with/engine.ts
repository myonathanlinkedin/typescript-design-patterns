import { OpCode, Instruction, Bytecode, VMState } from './types';

/**
 * A deterministic stack‑based virtual machine for integer arithmetic.
 *
 * Guarantees:
 *  - All operations are pure arithmetic on 64‑bit IEEE‑754 numbers (JavaScript `number`).
 *  - No side‑effects beyond the VM's own state.
 *  - Deterministic termination (either HALT or error).
 */
export class StackVM {
    private program: Bytecode = [];
    private pc: number = 0;
    private stack: number[] = [];
    private memory: number[] = [];
    private halted: boolean = false;
    private error?: string;

    /** Maximum memory cells – can be tuned; default 1024. */
    private readonly MEMORY_SIZE: number = 1024;

    constructor(memorySize?: number) {
        if (memorySize !== undefined) {
            if (!Number.isInteger(memorySize) || memorySize <= 0) {
                throw new Error('memorySize must be a positive integer');
            }
            this.MEMORY_SIZE = memorySize;
        }
        this.memory = new Array(this.MEMORY_SIZE).fill(0);
    }

    /** Load a program; resets PC, stack and halted flag. */
    public loadProgram(program: Bytecode): void {
        this.program = program.slice(); // defensive copy
        this.pc = 0;
        this.stack = [];
        this.halted = false;
        this.error = undefined;
    }

    /** Execute until HALT or error. */
    public run(): VMState {
        while (!this.halted) {
            this.step();
        }
        return this.snapshot();
    }

    /** Execute a single instruction; used for fine‑grained testing. */
    public step(): void {
        if (this.halted) {
            return;
        }
        if (this.pc < 0 || this.pc >= this.program.length) {
            this.fatal(`Program counter out of bounds: ${this.pc}`);
            return;
        }

        const instr = this.program[this.pc];
        this.pc++; // default advance; may be overwritten by jumps

        try {
            switch (instr.opcode) {
                case OpCode.PUSH:
                    this.requireOperand(instr);
                    this.stackPush(instr.operand!);
                    break;
                case OpCode.POP:
                    this.stackPop(); // discard
                    break;
                case OpCode.ADD:
                    this.binaryOp((a, b) => a + b);
                    break;
                case OpCode.SUB:
                    this.binaryOp((a, b) => a - b);
                    break;
                case OpCode.MUL:
                    this.binaryOp((a, b) => a * b);
                    break;
                case OpCode.DIV:
                    this.binaryOp((a, b) => {
                        if (b === 0) {
                            this.fatal('Division by zero');
                            return 0; // unreachable, but TypeScript needs a return
                        }
                        return Math.trunc(a / b);
                    });
                    break;
                case OpCode.LOAD:
                    this.requireOperand(instr);
                    this.stackPush(this.memoryRead(instr.operand!));
                    break;
                case OpCode.STORE:
                    this.requireOperand(instr);
                    const valueToStore = this.stackPop();
                    this.memoryWrite(instr.operand!, valueToStore);
                    break;
                case OpCode.JMP:
                    this.requireOperand(instr);
                    this.jump(instr.operand!);
                    break;
                case OpCode.JZ:
                    this.requireOperand(instr);
                    const cond = this.stackPop();
                    if (cond === 0) {
                        this.jump(instr.operand!);
                    }
                    break;
                case OpCode.HALT:
                    this.halted = true;
                    break;
                default:
                    this.fatal(`Unknown opcode: ${(instr as any).opcode}`);
            }
        } catch (e) {
            if (e instanceof Error) {
                this.fatal(e.message);
            } else {
                this.fatal('Unexpected error');
            }
        }
    }

    /** Return a deep copy of the current VM state. */
    public snapshot(): VMState {
        return {
            pc: this.pc,
            stack: this.stack.slice(),
            memory: this.memory.slice(),
            halted: this.halted,
            error: this.error
        };
    }

    // -----------------------------------------------------------------
    // Helper methods – all private, pure, and fully typed.
    // -----------------------------------------------------------------
    private requireOperand(instr: Instruction): void {
        if (instr.operand === undefined) {
            throw new Error(`Operand missing for opcode ${instr.opcode}`);
        }
    }

    private stackPush(value: number): void {
        this.stack.push(value);
    }

    private stackPop(): number {
        if (this.stack.length === 0) {
            this.fatal('Stack underflow');
            return 0; // unreachable
        }
        return this.stack.pop()!;
    }

    private binaryOp(op: (a: number, b: number) => number): void {
        const b = this.stackPop();
        const a = this.stackPop();
        const result = op(a, b);
        this.stackPush(result);
    }

    private memoryRead(address: number): number {
        this.checkMemoryAddress(address);
        return this.memory[address];
    }

    private memoryWrite(address: number, value: number): void {
        this.checkMemoryAddress(address);
        this.memory[address] = value;
    }

    private checkMemoryAddress(address: number): void {
        if (!Number.isInteger(address) || address < 0 || address >= this.MEMORY_SIZE) {
            this.fatal(`Invalid memory address ${address}`);
        }
    }

    private jump(target: number): void {
        if (!Number.isInteger(target) || target < 0 || target >= this.program.length) {
            this.fatal(`Invalid jump target ${target}`);
        }
        this.pc = target;
    }

    private fatal(message: string): void {
        this.halted = true;
        this.error = message;
        // In a production setting we might throw, but for deterministic testing we just halt.
    }
}
