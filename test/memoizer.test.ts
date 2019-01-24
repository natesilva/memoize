import test, { afterEach, beforeEach } from 'ava';
import isPromise from 'p-is-promise';
import * as td from 'testdouble';

const makeCacheKey = td.replace('../src//makeCacheKey').default;
const { createMemoize } = require('../src/index');

beforeEach(() => {
  // stub out makeCacheKey to always return a known value
  td.when(
    makeCacheKey(td.matchers.anything(), td.matchers.anything(), td.matchers.anything())
  ).thenReturn('the key');
});

afterEach(() => {
  td.reset();
});

test.serial('calls wrapped static methods', t => {
  const memoize = createMemoize();

  class C {
    @memoize
    static fn() {
      return 'the result';
    }
  }

  t.is(C.fn(), 'the result');
});

test.serial('returns cached results on calls to wrapped static methods', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenReturn(true);

  td.when(cache.get('the key')).thenReturn({
    expiresAt: Infinity,
    value: 'the cached result'
  });

  const memoize = createMemoize({ cache });

  class C {
    @memoize
    /* istanbul ignore next: this function should not be called */
    static fn() {
      return 'the result';
    }
  }

  t.is(C.fn(), 'the cached result');
});

test.serial('calls wrapped instance methods', t => {
  const memoize = createMemoize();

  class C {
    @memoize
    fn() {
      return 'the result';
    }
  }

  const c = new C();
  t.is(c.fn(), 'the result');
});

test.serial('returns cached results on calls to wrapped instance methods', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenReturn(true);

  td.when(cache.get('the key')).thenReturn({
    expiresAt: Infinity,
    value: 'the cached result'
  });

  const memoize = createMemoize({ cache });

  class C {
    @memoize
    /* istanbul ignore next: this function should not be called */
    fn() {
      return 'the result';
    }
  }

  const c = new C();
  t.is(c.fn(), 'the cached result');
});

test.serial('uses the maxAge to set the expiresAt value', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  const memoize = createMemoize({ cache, maxAge: 5000 });

  td.replace(Date, 'now');
  td.when(Date.now()).thenReturn(1000);

  class C {
    @memoize
    static fn() {
      return 'the result';
    }
  }

  C.fn();

  td.verify(cache.set('the key', td.matchers.contains({ expiresAt: 6000 })));
  t.pass();
});

test.serial('sets expiresAt to Infinity if no maxAge is provided', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  const memoize = createMemoize({ cache });

  class C {
    @memoize
    static fn() {
      return 'the result';
    }
  }

  C.fn();

  td.verify(cache.set('the key', td.matchers.contains({ expiresAt: Infinity })));
  t.pass();
});

test.serial('returns unexpired cached results', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenReturn(true);

  td.when(cache.get('the key')).thenReturn({
    expiresAt: 1000,
    value: 'the cached result'
  });

  td.replace(Date, 'now');
  td.when(Date.now()).thenReturn(100);

  const memoize = createMemoize({ cache });

  class C {
    @memoize
    /* istanbul ignore next: this function should not be called */
    static fn() {
      return 'the result';
    }
  }

  t.is(C.fn(), 'the cached result');
});

test.serial('does not return expired cached results', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  td.when(cache.has('the key')).thenReturn(true);

  td.when(cache.get('the key')).thenReturn({
    expiresAt: 1000,
    value: 'the cached result'
  });

  td.replace(Date, 'now');
  td.when(Date.now()).thenReturn(2000);

  const memoize = createMemoize({ cache });

  class C {
    @memoize
    static fn() {
      return 'the result';
    }
  }

  t.is(C.fn(), 'the result');
});

test.serial('does not cache rejected Promises', async t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);

  const memoize = createMemoize({ cache });

  class C {
    @memoize
    static fn() {
      return new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error('err')), 100)
      );
    }
  }

  await t.throwsAsync(C.fn());
  td.verify(cache.delete('the key'));
});

test.serial('wrapped static methods use the class static `this`', t => {
  const memoize = createMemoize();

  class C {
    static val = 'class static value';

    @memoize
    static fn() {
      return this.val;
    }
  }

  t.is(C.fn(), 'class static value');
});

test.serial('wrapped static methods use the instance `this`', t => {
  const memoize = createMemoize();

  class C {
    private val = 'instance value';

    @memoize
    fn() {
      return this.val;
    }
  }

  const c = new C();
  t.is(c.fn(), 'instance value');
});

test.serial('returns the Promise for wrapped async methods', async t => {
  const memoize = createMemoize();

  class C {
    @memoize
    static async fn() {
      return 'the result';
    }
  }

  const shouldBePromise = C.fn();
  t.true(isPromise(shouldBePromise));
  t.is(await shouldBePromise, 'the result');
});

test.serial('caches the Promise for wrapped async methods', t => {
  const cache = td.object(['has', 'get', 'set', 'delete']);
  const memoize = createMemoize({ cache });

  class C {
    @memoize
    static async fn() {
      return 'the result';
    }
  }

  C.fn();
  td.verify(
    cache.set('the key', td.matchers.contains({ value: td.matchers.isA(Promise) }))
  );
  t.pass();
});
