'use strict';

require('mocha');
const assert = require('assert');
const Scanner = require('./');
let scanner;

describe('scanner', () => {
  beforeEach(() => {
    scanner = new Scanner('//foo/bar.com');
  });

  it('should throw when regex matches an empty string', () => {
    scanner.addRule('foo', /^(?=.)/);
    assert.throws(() => scanner.scan(), /regex should not match an empty string/);
  });

  it('should add rule to error object', cb => {
    scanner.addRule('foo', /^(?=.)/);

    try {
      scanner.scan();
    } catch (err) {
      assert.equal(err.rule, 'foo');
      cb();
    }
  });

  it('should get the next token from the given regex', () => {
    scanner = new Scanner('//foo/bar.com', {
      rules: {
        dot: /^\./,
        slash: /^\//,
        text: /^\w+/
      }
    });

    assert.deepEqual(scanner.scan().value, '/' );
    assert.deepEqual(scanner.scan().value, '/' );
    assert.deepEqual(scanner.scan().value, 'foo' );
    assert.deepEqual(scanner.scan().value, '/' );
    assert.deepEqual(scanner.scan().value, 'bar' );
    assert.deepEqual(scanner.scan().value, '.' );
    assert.deepEqual(scanner.scan().value, 'com' );
  });
});
