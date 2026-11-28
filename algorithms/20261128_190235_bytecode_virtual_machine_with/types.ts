export enum OpCode {
    /** Push a constant onto the stack */
    PUSH = 'PUSH',
    /** Pop the top of the stack (discard) */
    POP = 'POP',
    /** Add the top two stack values, push result */
    ADD = 'ADD',
    /** Subtract top from second top, push result */
    SUB = 'SUB',
    /** Multiply top two values, push result */
    MUL = 'MUL',
    /** Integer division of second top by top, push result */
    DIV = 'DIV',
    /** Load value from memory address onto stack */
    LOAD = 'LOAD',
    /** Store top of stack into memory address */
    STORE = 'STORE',
    /** Unconditional jump to instruction index */
    JMP = 'JMP',
    /** Jump if top of stack is zero (pop the condition) */
    JZ = 'JZ',
    /** Halt execution */
    HALT = 'HALT'
}

/** A single bytecode instruction. Most opcodes have at most one numeric operand. */
export interface Instruction {
    opcode: OpCode;
    /** Operand is required for opcodes that need a numeric argument (e.g., PUSH, LOAD, STORE, JMP, JZ). */
    operand?: number;
}

/** The complete program – an array of instructions. */
export type Bytecode = Instruction[];

/** Runtime state snapshot – useful for debugging or testing. */
export interface VMState {
    pc: number;               // program counter (index of next instruction)
    stack: number[];          // operand stack (top at end of array)
    memory: number[];         // simple linear memory
    halted: boolean;          // true after HALT or fatal error
    error?: string;           // optional error description
}
