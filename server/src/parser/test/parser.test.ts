import { strictEqual as eq } from 'assert';
import Parser from '../parser';
import { Chunk } from '../statements';

function parse(input: string): Chunk {
  return new Parser(input).parseChunk();
}

function deepEqualsAST(code: string, expected: any) {
  const { body } = parse(code);
  deepEquals(body, expected);
}

function deepEquals(actual: any, expected: any) {
  eq(typeof actual, typeof expected, 'types don\'t match!');

  if (typeof expected === 'object') {
    if (Array.isArray(expected)) return deepEqualsArray(actual, expected);
    else return deepEqualsObject(actual, expected);
  } else {
    eq(actual, expected, 'values don\'t match!');
  }
}

function deepEqualsArray(actual: any[], expected: any[]) {
  eq(actual.length, expected.length, 'array lengths don\'t match!');

  for (let i = 0; i < expected.length; i++) {
    deepEquals(actual[i], expected[i]);
  }
}

function deepEqualsObject(actual: any, expected: any) {
  for (const key of Object.keys(expected)) {
    deepEquals(actual[key], expected[key]);
  }
}

describe('Parser', () => {
  it('parses basic assignment statement', () => {
    deepEqualsAST('i = 1', [
      {
        type: 'AssignmentStatement',
        operator: '=',
        variables: [{
          type: 'Identifier',
          name: 'i',
          isLocal: false,
        }],
        init: [{
          type: 'NumericLiteral',
          value: 1,
        }],
      },
    ]);
  });

  it('parses basic function declaration', () => {
    deepEqualsAST('function f(x)\nreturn x + 1\nend', [{
      type: 'FunctionDeclaration',
      isLocal: false,
      identifier: { name: 'f' },
      parameters: [{ type: 'Identifier', name: 'x' }],
      body: [{
        type: 'ReturnStatement',
        arguments: [{
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'Identifier', name: 'x' },
          right: { type: 'NumericLiteral', value: 1 },
        }],
      }],
    }]);
  });

  it('parses call statement', () => {
    deepEqualsAST('print("hi")', [{
      type: 'CallStatement',
      expression: {
        type: 'CallExpression',
        base: { type: 'Identifier', name: 'print' },
        arguments: [{ type: 'StringLiteral', value: 'hi' }],
      },
    }]);
  });

  it('parses if statement', () => {
    const printHi = [{
      type: 'CallStatement',
      expression: {
        type: 'CallExpression',
        base: { type: 'Identifier', name: 'print' },
        arguments: [{ type: 'StringLiteral', value: 'hi' }],
      },
    }];

    deepEqualsAST('if false then print("hi") elseif false then print("hi") else print("hi") end', [{
      type: 'IfStatement',
      clauses: [
        {
          type: 'IfClause',
          condition: { type: 'BooleanLiteral', value: false },
          body: printHi,
        },
        {
          type: 'ElseifClause',
          condition: { type: 'BooleanLiteral', value: false },
          body: printHi,
        },
        {
          type: 'ElseClause',
          body: printHi,
        },
      ],
    }]);
  });

  it('parses PICO-8 if statement', () => {
    deepEqualsAST('if (false) print("hi")\ni = 1', [
      {
        type: 'IfStatement',
        clauses: [{
          type: 'IfClause',
          condition: { type: 'BooleanLiteral', value: false },
          body: [{
            type: 'CallStatement',
            expression: {
              type: 'CallExpression',
              base: { type: 'Identifier', name: 'print' },
              arguments: [{ type: 'StringLiteral', value: 'hi' }],
            },
          }],
        },
        ],
      },
      {
        type: 'AssignmentStatement',
        operator: '=',
        variables: [{
          type: 'Identifier',
          name: 'i',
          isLocal: false,
        }],
        init: [{
          type: 'NumericLiteral',
          value: 1,
        }],
      },
    ]);
  });

  it('parses PICO-8 if statement with a significant newline', () => {
    // If it doesn't treat the newline as significant, it'll interpret it as "return i" instead of just "return"
    deepEqualsAST('if (false) return\ni += 1', [
      {
        type: 'IfStatement',
        clauses: [{
          type: 'IfClause',
          condition: { type: 'BooleanLiteral', value: false },
          body: [{ type: 'ReturnStatement', arguments: [] }],
        }],
      },
      {
        type: 'AssignmentStatement',
        operator: '+=',
        variables: [{
          type: 'Identifier',
          name: 'i',
          isLocal: false,
        }],
        init: [{
          type: 'NumericLiteral',
          value: 1,
        }],
      },
    ]);
  });
});
