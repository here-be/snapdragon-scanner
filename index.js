'use strict';

/**
 * Create a new Scanner with the given `str` and optional `types`.
 *
 * ```js
 * const Scanner = require('snapdragon-scanner');
 * const scanner = new Scanner('var foo = "bar";', {
 *   text: /^\w+/,
 *   star: /^\*)/,
 *   slash: /^\//,
 *   dot: /^\./
 * });
 * ```
 * @name Scanner
 * @param {String} `input` Input string to scan.
 * @param {Object} `types` (optional) Pass an object of types, or use `.addTypes()` or `.addType()` after instantiating.
 * @api public
 */

class Scanner {
  constructor(str, types = {}) {
    assert(typeof str === 'string', 'expected a string');
    this.key = Symbol('scanner');
    this.types = new Map();
    this.consumed = '';
    this.position = 0;
    this.string = str;
    this.input = str;
    this.queue = [];
    if (types) {
      this.addTypes(types);
    }
  }

  /**
   * Returns true if the scanner has not consumed any of the input string.
   *
   * @name .bos
   * @return {Boolean}
   * @api public
   */

  bos() {
    return !this.consumed;
  }

  /**
   * Returns true if `scanner.string` and `scanner.queue` are empty.
   *
   * @name .eos
   * @return {Boolean}
   * @api public
   */

  eos() {
    return this.string === '' && this.queue.length === 0;
  }

  /**
   * Add a type to the scanner.
   *
   * ```js
   * scanner.addType(type, regex);
   * // example
   * scanner.addType('text', /^\w+/);
   * ```
   * @name .addType
   * @param {String} `type`
   * @param {RegExp} `regex` Regular expression to use when [scanning](#scan).
   * @api public
   */

  addType(type, regex) {
    this.types.set(type, regex);
    return this;
  }

  /**
   * Add an object of types to the scanner.
   *
   * ```js
   * scanner.addType({ text: /^\w+/ });
   * ```
   * @name .addTypes
   * @param {Object} `types`
   * @api public
   */

  addTypes(types) {
    for (const type of Object.keys(types)) {
      this.addType(type, types[type]);
    }
    return this;
  }

  /**
   * Attempts to match `scanner.string` with the given regex. Also validates
   * the regex to ensure that it starts with `^` since matching should always be
   * against the beginning of the string, and throws if the regex matches an empty
   * string, to avoid catastrophic backtracking.
   *
   * ```js
   * const scanner = new Scanner('foo/bar', { text: /^\w+/ });
   * const match = scanner.match(scanner.types.get('text'));
   * console.log(match);
   * //=> [ 'foo', index: 0, input: 'foo/bar', groups: undefined ]
   * ```
   * @name .match
   * @param {RegExp} `regex` (required)
   * @return {Array|null} Returns the match array or null from `RegExp.exec`.
   * @api public
   */

  match(regex) {
    if (this.eos()) return null;

    assert(regex instanceof RegExp, 'expected a regular expression');
    if (regex[this.key] !== true) {
      assert(regex.source[0] === '^', 'expected regex to start with "^"');
      Reflect.defineProperty(regex, this.key, { value: true });
    }

    let match = regex.exec(this.string);
    if (!match) return null;
    assert(match[0] !== '', 'unsafe regex: regex should not match an empty string');
    match.index = this.position;
    return match;
  }

  /**
   * Remove the given length of substring from `scanner.string`.
   *
   * ```js
   * scanner.consume(1);
   * scanner.consume(1, '*');
   * ```
   * @name .consume
   * @param {Number} `len`
   * @param {String} `value` Optionally pass the value being consumed for minor performance improvement.
   * @return {String} Returns the consumed value
   * @api public
   */

  consume(len, value = this.string.slice(0, len)) {
    this.position += len;
    this.consumed += value;
    this.string = this.string.slice(len);
    return value;
  }

  /**
   * Returns a token representing the next match, without consuming the
   * substring from the input string (and without advancing the cursor position).
   *
   * ```js
   * const token = scanner.peek();
   * ```
   * @name .peek
   * @return {Object|undefined} Returns a token or undefined if no match was found.
   * @api public
   */

  peek() {
    if (this.eos()) return;
    if (this.queue.length) return this.queue[0];
    for (const [type, regex] of this.types) {
      try {
        let match = this.match(regex);
        if (match) {
          const token = { type, value: match[0], ...match.groups };
          Reflect.defineProperty(token, 'match', { value: match });
          this.queue.push(token);
          return token;
        }
      } catch (err) {
        err.type = type;
        throw err;
      }
    }
  }

  /**
   * Returns the next token, and advances the cursor position.
   *
   * ```js
   * const token = scanner.scan();
   * ```
   * @name .scan
   * @return {Object|undefined} Returns a token or undefined if no match was found.
   * @api public
   */

  scan() {
    let token = this.peek() && this.queue.shift();
    if (token) {
      this.consume(token.match[0].length, token.match[0]);
      return token;
    }
  }

  /**
   * Scan until the given `fn` does not return true.
   *
   * ```js
   * scanner.scanWhile(tok => tok.type !== 'space');
   * ```
   * @name .scanWhile
   * @param {Function} `fn` Must return true to continue scanning.
   * @returns {Array} Returns an array if scanned tokens.
   * @api public
   */

  scanWhile(fn) {
    const scanned = [];
    while (fn.call(this, this.peek())) scanned.push(this.scan());
    return scanned;
  }
}

function assert(val, msg) {
  if (!val) throw new Error(msg);
}

module.exports = Scanner;
