/**
 * Example usage of the tokenizer.
 */
import { Token } from "./token";

const input = "let x = 42; // comment\nlet y = 'hello';";
const tokenizer = new Tokenizer();

console.log(tokenizer.processInput(input));

// Output: [
//   { type: 'LET', value: 'x' },
//   { type: 'EQUAL', value: '' },
//   { type: 'NUMBER', value: '42' },
//   { type: 'COMMENT', value: '// comment' },
//   { type: 'LET', value: 'y' },
//   { type: 'STRING', value: 'hello' }
// ]
