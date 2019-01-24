# memoizer

A memoize decorator for use with JavaScript and TypeScript classes

## Install

```
$ npm i @reallyuseful/memoizer
```

## Use

```typescript
const { createMemoize } = require('@reallyuseful/memoize');

const memoize = createMemoize();

class C {
  constructor() {
    this.value = 0;
  }

  @memoize
  fn() {
    this.value += 1;
    return this.value;
  }
}

const c = new C();

console.log('the value is:', c.fn()); // the value is: 1
console.log('the value is:', c.fn()); // the value is: 1 (memoized result)
```

## Options

`createMemoize(options)`

- `cache` 
    - Default: `new Map()`
    - Provides an object to use for the memoization cache. It must have a `Map`-like interface, with the methods: `has`, `set`, `get`, and `delete`.
- `maxAge`
    - Default: `Infinity`
    - How long, in milliseconds, memoized items should remain cached.

## Using an asynchronous cache, such as Redis

Use `createAsyncMemoize()` to create a memoizer that uses an asynchronous caching mechanism.

An asynchronous cache has the same methods as a non-async cache: `has`, `set`, `get`, and `delete`. However, all of these methods return Promises instead of raw values.

When using an asynchronous cache, you cannot memoize non-async methods.