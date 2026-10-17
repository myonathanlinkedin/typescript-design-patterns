/**
 * A finite state machine tokenizer and lexical parser.
 *
 * This module provides a tokenizer and lexical parser using a finite state machine.
 * The tokenizer splits a string into a sequence of tokens, while the lexical parser applies grammar rules to parse a sequence of tokens into a parse tree.
 */

import { Token } from "./token";
import { TokenType } from "./token_type";

/**
 * A finite state machine representing a tokenizer.
 *
 * The tokenizer transitions between states based on the input string characters.
 * Each state has a set of allowed input characters and a corresponding token type.
 */
class Tokenizer {
  private states: { [key: string]: { input: string[], tokenType: TokenType } };

  constructor() {
    this.states = {
      "start": { input: ["\n", " "], tokenType: TokenType.WHITESPACE },
      "identifier": { input: ["[a-zA-Z_$][a-zA-Z0-9_$]*", "//", "/*"], tokenType: TokenType.IDENTIFIER },
      "number": { input: ["0-9", "+-*/"], tokenType: TokenType.NUMBER },
      "string": { input: ["\""], tokenType: TokenType.STRING },
      "comment": { input: ["//", "/*"], tokenType: TokenType.COMMENT },
      "whitespace": { input: ["\n", " "], tokenType: TokenType.WHITESPACE },
    };
  }

  /**
   * Processes the input string and returns a sequence of tokens.
   *
   * @param input The input string to process.
   * @returns A sequence of tokens.
   */
  public processInput(input: string): Token[] {
    let tokens: Token[] = [];
    let currentState = "start";
    let currentInput = input;

    while (currentInput.length > 0) {
      const currentChar = currentInput[0];

      if (this.states[currentState]["input"].includes(currentChar)) {
        tokens.push({
          type: this.states[currentState]["tokenType"],
          value: currentChar,
        });

        currentInput = currentInput.slice(1);
        currentState = this.states[currentState]["nextState"];
      } else {
        currentState = "start";
      }
    }

    return tokens;
  }
}
*/
