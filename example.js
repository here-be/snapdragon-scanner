
const Scanner = require('./');
const scanner = new Scanner('**/foo/.bar.baz/@(a|b)', {
  rules: {
    text: /^(\\.|[^|/.@*!+?()]+)/,
    star: /^(?<star>\*)/,
    pipe: /^\|/,
    paren: /^(?<prefix>[@*!+?]?)[()]/,
    slash: /^\//,
    dot: /^\./
  }
});

console.log(scanner.scanWhile(tok => tok && tok.type !== 'dot'));
// console.log(scanner.scanWhile(() => !scanner.eos()));
// console.log(scanner.consume(5))
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan())
// console.log(scanner.scan()) // undefined

// const scanner2 = new Scanner('foo/bar', { rules: { text: /^\w+/ } });
// const match = scanner2.match(scanner2.rules.get('text')[0]);
// console.log(match)
