'use strict';

require('mocha');
const assert = require('assert');
const Scanner = require('./');
let scanner;

describe('scanner', function() {
  beforeEach(function() {
    scanner = new Scanner('//foo/bar.com');
  });

  it('should throw when regex matches an empty string', function() {
    scanner.rules = new Map();
    scanner.addType('foo', /^(?=.)/);
    assert.throws(() => scanner.scan(), /empty/);
  });

  it('should add type to error object', function(cb) {
    scanner.rules = new Map();
    scanner.addType('foo', /^(?=.)/);

    try {
      scanner.scan();
    } catch (err) {
      assert.equal(err.type, 'foo');
      cb();
    }
  });

  it('should get the next token from the given regex', function() {
    scanner = new Scanner('//foo/bar.com', {
      dot: /^\./,
      slash: /^\//,
      text: /^\w+/
    });

    assert.deepEqual(scanner.scan(), { type: 'slash', value: '/' });
    assert.deepEqual(scanner.scan(), { type: 'slash', value: '/' });
    assert.deepEqual(scanner.scan(), { type: 'text', value: 'foo' });
    assert.deepEqual(scanner.scan(), { type: 'slash', value: '/' });
    assert.deepEqual(scanner.scan(), { type: 'text', value: 'bar' });
    assert.deepEqual(scanner.scan(), { type: 'dot', value: '.' });
    assert.deepEqual(scanner.scan(), { type: 'text', value: 'com' });
  });
});
