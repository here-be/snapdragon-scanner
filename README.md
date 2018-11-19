# snapdragon-scanner [![NPM version](https://img.shields.io/npm/v/snapdragon-scanner.svg?style=flat)](https://www.npmjs.com/package/snapdragon-scanner) [![NPM monthly downloads](https://img.shields.io/npm/dm/snapdragon-scanner.svg?style=flat)](https://npmjs.org/package/snapdragon-scanner) [![NPM total downloads](https://img.shields.io/npm/dt/snapdragon-scanner.svg?style=flat)](https://npmjs.org/package/snapdragon-scanner) [![Linux Build Status](https://img.shields.io/travis/here-be/snapdragon-scanner.svg?style=flat&label=Travis)](https://travis-ci.org/here-be/snapdragon-scanner)

> Easily scan a string with an object of regex patterns to produce an array of tokens. ~100 sloc.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save snapdragon-scanner
```

## What is this?

This is a simple Lexical Scanner that takes an object of regex patterns, and uses those patterns to process an input string into an array of tokens.

**What is the difference between this and [snapdragon-lexer](https://github.com/here-be/snapdragon-lexer)?**

snapdragon-lexer uses registered _handler functions_ to capture and handle tokens, snapdragon-scanner simply iterates over an object of regular expression patterns to create tokens. You can think of snapdragon-scanner as the "lite" version of snapdragon-lexer.

## Usage

```js
const Scanner = require('snapdragon-scanner');
```

## API

### [Scanner](index.js#L27)

Create a new Scanner with the given `str` and optional `rules`.

**Params**

* `input` **{String}**: Input string to scan.
* `options` **{Object}**: (optional) Pass an object of regex patterns on `options.rules`, or use `.addRules()` or `.addRule()` after instantiating.

**Example**

```js
const Scanner = require('snapdragon-scanner');
const scanner = new Scanner('var foo = "bar";', {
  rules: {
    space: /^ +/,
    tab: /^\t+/,
    newline: /^\n+/,
    text: /^\w+/,
    equal: /^=/,
    quote: /^["']/,
    semi: /^;/,
    dot: /^\./
  }
});
```

### [.addRule](index.js#L59)

Add a rule to the scanner.

**Params**

* `rule` **{String}**
* `match` **{RegExp}**: Match array from `RegExp.exec()`.

**Example**

```js
console.log(scanner.token('text', ['foo']);
//=> { rule: 'text', value: 'foo', match: [foo] };
```

### [.addRule](index.js#L80)

Add a rule to the scanner.

**Params**

* `rule` **{String}**
* `regex` **{RegExp}**: Regular expression to use when [scanning](#scan).

**Example**

```js
scanner.addRule(rule, regex);
// example
scanner.addRule('text', /^\w+/);
```

### [.addRules](index.js#L104)

Add an object of rules to the scanner.

**Params**

* `rules` **{Object}**

**Example**

```js
scanner.addRules({
  text: /^\w+/,
  slash: /^\//,
  dot: /^\./
});
```

### [.match](index.js#L133)

Attempts to match `scanner.string` with the given regex. Also validates the regex to ensure that it starts with `^` since matching should always be against the beginning of the string, and throws if the regex matches an empty string, to avoid catastrophic backtracking.

**Params**

* `regex` **{RegExp}**: (required)
* `returns` **{Array|null}**: Returns the match array or null from `RegExp.exec`.

**Example**

```js
const scanner = new Scanner('foo/bar', { text: /^\w+/ });
const match = scanner.match(scanner.rules.get('text'));
console.log(match);
//=> [ 'foo', index: 0, input: 'foo/bar', groups: undefined ]
```

### [.consume](index.js#L164)

Remove the given length of substring from `scanner.string`.

**Params**

* `len` **{Number}**
* `value` **{String}**: Optionally pass the value being consumed for minor performance improvement.
* `returns` **{String}**: Returns the consumed value

**Example**

```js
scanner.consume(1);
scanner.consume(1, '*');
```

### [.enqueue](index.js#L185)

Push a token onto the `scanner.queue` array.

**Params**

* `token` **{object}**
* `returns` **{Object}**: Returns the token.

**Example**

```js
console.log(scanner.queue.length); // 0
scanner.enqueue({ rule: 'foo' });
console.log(scanner.queue.length); // 1
```

### [.dequeue](index.js#L205)

Shift a token from `scanner.queue`.

* `returns` **{Object}**: Returns the first token in the `scanner.queue`.

**Example**

```js
console.log(scanner.queue.length); // 0
scanner.enqueue({ rule: 'foo' });
console.log(scanner.queue.length); // 1
scanner.dequeue();
console.log(scanner.queue.length); // 0
```

### [.advance](index.js#L222)

Iterates over the registered regex patterns until a match is found, then returns a token from the match and regex `rule`.

* `returns` **{Object}**: Returns a token with `rule`, `value` and `match` properties.

**Example**

```js
const token = scanner.advance();
console.log(token) // { rule: 'text', value: 'foo' }
```

### [.lookahead](index.js#L257)

Lookahead `n` tokens and return the last token. Pushes any intermediate tokens onto `scanner.tokens.` To lookahead a single token, use [.peek()](#peek).

**Params**

* `n` **{number}**
* `returns` **{Object}**

**Example**

```js
const token = scanner.lookahead(2);
```

### [.peek](index.js#L276)

Returns a token representing the next match, but without consuming the matched substring (e.g. the cursor position is not advanced).

* `returns` **{Object|undefined}**: Returns a token, or undefined if no match was found.

**Example**

```js
const token = scanner.peek();
```

### [.peek](index.js#L292)

Returns a token representing the next match, but without consuming the matched substring (e.g. the cursor position is not advanced).

* `returns` **{Object|undefined}**: Returns a token, or undefined if no match was found.

**Example**

```js
const token = scanner.peek();
```

### [.scan](index.js#L307)

Returns the next token and advances the cursor position.

* `returns` **{Object|undefined}**: Returns a token, or undefined if no match was found.

**Example**

```js
const token = scanner.scan();
```

### [.scanWhile](index.js#L327)

Scan until the given `fn` does not return true.

**Params**

* `fn` **{Function}**: Must return true to continue scanning.
* `returns` **{Array}**: Returns an array if scanned tokens.

**Example**

```js
scanner.scanWhile(tok => tok.rule !== 'space');
```

### [.bos](index.js#L341)

Returns true if the scanner has not consumed any of the input string.

* `returns` **{Boolean}**

### [.eos](index.js#L353)

Returns true if `scanner.string` and `scanner.queue` are empty.

* `returns` **{Boolean}**

## Token objects

Scanner tokens are plain JavaScript objects with the following properties:

```js
{
  type: String;
  value: String
  match: Array
}
```

### Token properties

* `type` **{String}** - The name of the regex that matched the substring.
* `value` **{String}** - The substring that was captured by the regex.
* `match` **{Array}** - The match array from [RegExp.exec()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)

## Release history

See [the changelog](CHANGELOG.md).

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Related projects

You might also be interested in these projects:

* [snapdragon-lexer](https://www.npmjs.com/package/snapdragon-lexer): Converts a string into an array of tokens, with useful methods for looking ahead and… [more](https://github.com/here-be/snapdragon-lexer) | [homepage](https://github.com/here-be/snapdragon-lexer "Converts a string into an array of tokens, with useful methods for looking ahead and behind, capturing, matching, et cetera.")
* [snapdragon-node](https://www.npmjs.com/package/snapdragon-node): Snapdragon utility for creating a new AST node in custom code, such as plugins. | [homepage](https://github.com/jonschlinkert/snapdragon-node "Snapdragon utility for creating a new AST node in custom code, such as plugins.")
* [snapdragon-token](https://www.npmjs.com/package/snapdragon-token): Create a snapdragon token. Used by the snapdragon lexer, but can also be used by… [more](https://github.com/here-be/snapdragon-token) | [homepage](https://github.com/here-be/snapdragon-token "Create a snapdragon token. Used by the snapdragon lexer, but can also be used by plugins.")

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the MIT License.

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on November 19, 2018._