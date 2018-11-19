'use strict';

/**
 * Create a new Scanner with the given `str` and optional `rules`.
 *
 * ```js
 * const Scanner = require('snapdragon-scanner');
 * const scanner = new Scanner('var foo = "bar";', {
 *   rules: {
 *     space: /^ +/,
 *     tab: /^\t+/,
 *     newline: /^\n+/,
 *     text: /^\w+/,
 *     equal: /^=/,
 *     quote: /^["']/,
 *     semi: /^;/,
 *     dot: /^\./
 *   }
 * });
 * ```
 * @name Scanner
 * @param {String} `input` Input string to scan.
 * @param {Object} `options` (optional) Pass an object of regex patterns on `options.rules`, or use `.addRules()` or `.addRule()` after instantiating.
 * @api public
 */

class Scanner {
  constructor(str, options = {}) {
    assert(typeof str === 'string', 'expected a string');
    this.key = Symbol('scanner');
    this.options = options;
    this.rules = new Map();
    this.state = {
      consumed: '',
      position: 0,
      string: str,
      input: str,
      queue: []
    };

    if (options.rules) {
      this.addRules(options.rules);
    }
  }

  /**
   * Add a rule to the scanner.
   *
   * ```js
   * console.log(scanner.token('text', ['foo']);
   * //=> { rule: 'text', value: 'foo', match: [foo] };
   * ```
   * @name .addRule
   * @param {String} `rule`
   * @param {RegExp} `match` Match array from `RegExp.exec()`.
   * @api public
   */

  token(type, match) {
    if (this.options.Token) {
      return new this.options.Token(type, match);
    }
    return { type, value: match[1] || match[0], match };
  }

  /**
   * Add a rule to the scanner.
   *
   * ```js
   * scanner.addRule(rule, regex);
   * // example
   * scanner.addRule('text', /^\w+/);
   * ```
   * @name .addRule
   * @param {String} `rule`
   * @param {RegExp} `regex` Regular expression to use when [scanning](#scan).
   * @api public
   */

  addRule(rule, regex) {
    if (rule && typeof rule === 'object') {
      this.addRule(rule.type, rule.regex);
      return this;
    }
    this.rules.set(rule, [].concat(regex));
    return this;
  }

  /**
   * Add an object of rules to the scanner.
   *
   * ```js
   * scanner.addRules({
   *   text: /^\w+/,
   *   slash: /^\//,
   *   dot: /^\./
   * });
   * ```
   * @name .addRules
   * @param {Object} `rules`
   * @api public
   */

  addRules(rules) {
    if (Array.isArray(rules)) {
      rules.forEach(rule => this.addRule(rule));
      return this;
    }
    for (let type of Object.keys(rules)) {
      this.addRule(type, rules[type]);
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
   * const match = scanner.match(scanner.rules.get('text'));
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

    let match = regex.exec(this.state.string);
    if (match) {
      assert(match[0] !== '', 'unsafe regex: regex should not match an empty string');
      match.index = this.state.position;
      return match;
    }
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

  consume(len, value = this.state.string.slice(0, len)) {
    this.state.consumed += value;
    this.state.position += len;
    this.state.string = this.state.string.slice(len);
    return value;
  }

  /**
   * Push a token onto the `scanner.queue` array.
   *
   * ```js
   * console.log(scanner.queue.length); // 0
   * scanner.enqueue({ rule: 'foo' });
   * console.log(scanner.queue.length); // 1
   * ```
   * @name .enqueue
   * @param {object} `token`
   * @return {Object} Returns the token.
   * @api public
   */

  enqueue(token) {
    if (token) this.state.queue.push(token);
    return token;
  }

  /**
   * Shift a token from `scanner.queue`.
   *
   * ```js
   * console.log(scanner.queue.length); // 0
   * scanner.enqueue({ rule: 'foo' });
   * console.log(scanner.queue.length); // 1
   * scanner.dequeue();
   * console.log(scanner.queue.length); // 0
   * ```
   * @name .dequeue
   * @return {Object} Returns the first token in the `scanner.queue`.
   * @api public
   */

  dequeue() {
    return this.state.queue.shift();
  }

  /**
   * Iterates over the registered regex patterns until a match is found,
   * then returns a token from the match and regex `rule`.
   *
   * ```js
   * const token = scanner.advance();
   * console.log(token) // { rule: 'text', value: 'foo' }
   * ```
   * @name .advance
   * @return {Object} Returns a token with `rule`, `value` and `match` properties.
   * @api public
   */

  advance() {
    if (this.eos()) return;
    for (let [rule, patterns] of this.rules) {
      for (let regex of patterns) {
        try {
          let pos = this.state.position;
          let match = this.match(regex);
          if (match) {
            let token = this.token(rule, match);
            token.range = [pos, pos + token.match[0].length];
            return token;
          }
        } catch (err) {
          err.rule = rule;
          err.string = this.state.string.slice(0, 20);
          throw err;
        }
      }
    }
  }

  /**
   * Lookahead `n` tokens and return the last token. Pushes any
   * intermediate tokens onto `scanner.tokens.` To lookahead a single
   * token, use [.peek()](#peek).
   *
   * ```js
   * const token = scanner.lookahead(2);
   * ```
   * @name .lookahead
   * @param {number} `n`
   * @return {Object}
   * @api public
   */

  lookahead(n) {
    assert(typeof n === 'number', 'expected a number');
    let fetch = n - this.state.queue.length;
    while (fetch-- > 0 && this.enqueue(this.advance()));
    return this.state.queue[--n];
  }

  /**
   * Returns a token representing the next match, but without consuming the
   * matched substring (e.g. the cursor position is not advanced).
   *
   * ```js
   * const token = scanner.peek();
   * ```
   * @name .peek
   * @return {Object|undefined} Returns a token, or undefined if no match was found.
   * @api public
   */

  peek() {
    return this.lookahead(1);
  }

  /**
   * Returns a token representing the next match, but without consuming the
   * matched substring (e.g. the cursor position is not advanced).
   *
   * ```js
   * const token = scanner.peek();
   * ```
   * @name .peek
   * @return {Object|undefined} Returns a token, or undefined if no match was found.
   * @api public
   */

  next() {
    return this.state.queue.shift() || this.advance();
  }

  /**
   * Returns the next token and advances the cursor position.
   *
   * ```js
   * const token = scanner.scan();
   * ```
   * @name .scan
   * @return {Object|undefined} Returns a token, or undefined if no match was found.
   * @api public
   */

  scan() {
    let token = this.next();
    if (token) {
      this.consume(token.match[0].length, token.match[0]);
      return token;
    }
  }

  /**
   * Scan until the given `fn` does not return true.
   *
   * ```js
   * scanner.scanWhile(tok => tok.rule !== 'space');
   * ```
   * @name .scanWhile
   * @param {Function} `fn` Must return true to continue scanning.
   * @returns {Array} Returns an array if scanned tokens.
   * @api public
   */

  scanWhile(fn = (() => !this.eos())) {
    const scanned = [];
    while (fn.call(this, this.peek())) scanned.push(this.scan());
    return scanned;
  }

  /**
   * Returns true if the scanner has not consumed any of the input string.
   *
   * @name .bos
   * @return {Boolean}
   * @api public
   */

  bos() {
    return !this.state.consumed;
  }

  /**
   * Returns true if `scanner.string` and `scanner.queue` are empty.
   *
   * @name .eos
   * @return {Boolean}
   * @api public
   */

  eos() {
    return this.state.string === '' && this.state.queue.length === 0;
  }
}

function assert(val, msg) {
  if (!val) throw new Error(msg);
}

module.exports = Scanner;
