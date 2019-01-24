import test, { afterEach, beforeEach } from 'ava';
import * as td from 'testdouble';

const makeCacheKey = td.replace('../src//makeCacheKey').default;
const { createAsyncMemoize } = require('../src/index');

beforeEach(() => {
  // stub out makeCacheKey to always return a known value
  td.when(
    makeCacheKey(td.matchers.anything(), td.matchers.anything(), td.matchers.anything())
  ).thenReturn('the key');
});

afterEach(() => {
  td.reset();
});

test.serial('rejects if wrapping a non-async method', async t => {
  const memoize = createAsyncMemoize();

  class C {
    @memoize
    static fn() {
      return 'the result';
    }
  }

  await t.throwsAsync(() => C.fn() as any, /cannot memoize/);
});

test.serial('calls wrapped static methods', async t => {
  const memoize = createAsyncMemoize();

  class C {
    @memoize
    static async fn() {
      return 'the result';
    }
  }

  t.is(await C.fn(), 'the result');
});

test.serial('returns cached results on calls to wrapped static methods', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenResolve(true);

  td.when(cache.get('the key')).thenResolve({
    expiresAt: Infinity,
    value: 'the cached result'
  });

  const memoize = createAsyncMemoize({ cache });

  class C {
    @memoize
    /* istanbul ignore next: this function should not be called */
    static async fn() {
      return 'the result';
    }
  }

  t.is(await C.fn(), 'the cached result');
});

test.serial('calls wrapped instance methods', async t => {
  const memoize = createAsyncMemoize();

  class C {
    @memoize
    async fn() {
      return 'the result';
    }
  }

  const c = new C();
  t.is(await c.fn(), 'the result');
});

test.serial('returns cached results on calls to wrapped instance methods', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenResolve(true);

  td.when(cache.get('the key')).thenResolve({
    expiresAt: Infinity,
    value: 'the cached result'
  });

  const memoize = createAsyncMemoize({ cache });

  class C {
    @memoize
    /* istanbul ignore next: this function should not be called */
    async fn() {
      return 'the result';
    }
  }

  const c = new C();
  t.is(await c.fn(), 'the cached result');
});

test.serial('uses the maxAge to set the expiresAt value', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  const memoize = createAsyncMemoize({ cache, maxAge: 5000 });

  td.replace(Date, 'now');
  td.when(Date.now()).thenReturn(1000);

  class C {
    @memoize
    static async fn() {
      return 'the result';
    }
  }

  await C.fn();

  td.verify(cache.set('the key', td.matchers.contains({ expiresAt: 6000 })));
  t.pass();
});

test.serial('sets expiresAt to Infinity if no maxAge is provided', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  const memoize = createAsyncMemoize({ cache });

  class C {
    @memoize
    static async fn() {
      return 'the result';
    }
  }

  await C.fn();

  td.verify(cache.set('the key', td.matchers.contains({ expiresAt: Infinity })));
  t.pass();
});

test.serial('returns unexpired cached results', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenResolve(true);

  td.when(cache.get('the key')).thenResolve({
    expiresAt: 1000,
    value: 'the cached result'
  });

  td.replace(Date, 'now');
  td.when(Date.now()).thenReturn(100);

  const memoize = createAsyncMemoize({ cache });

  class C {
    @memoize
    /* istanbul ignore next: this function should not be called */
    static async fn() {
      return 'the result';
    }
  }

  t.is(await C.fn(), 'the cached result');
});

test.serial('does not return expired cached results', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenResolve(true);

  td.when(cache.get('the key')).thenResolve({
    expiresAt: 1000,
    value: 'the cached result'
  });

  td.replace(Date, 'now');
  td.when(Date.now()).thenReturn(2000);

  const memoize = createAsyncMemoize({ cache });

  class C {
    @memoize
    static async fn() {
      return 'the result';
    }
  }

  t.is(await C.fn(), 'the result');
});

test.serial('does not cache rejected Promises', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  const memoize = createAsyncMemoize({ cache });

  class C {
    @memoize
    static async fn() {
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('err');
    }
  }

  await t.throwsAsync(C.fn());
  td.verify(cache.delete('the key'));
});

test.serial('wrapped static methods use the class static `this`', async t => {
  const memoize = createAsyncMemoize();

  class C {
    static val = 'class static value';

    @memoize
    static async fn() {
      return this.val;
    }
  }

  t.is(await C.fn(), 'class static value');
});

test.serial('wrapped static methods use the instance `this`', async t => {
  const memoize = createAsyncMemoize();

  class C {
    private val = 'instance value';

    @memoize
    async fn() {
      return this.val;
    }
  }

  const c = new C();
  t.is(await c.fn(), 'instance value');
});
