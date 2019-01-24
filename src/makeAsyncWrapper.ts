import isPromise from 'p-is-promise';
import AsyncCacheInterface from './interfaces/AsyncCacheInterface';
import makeCacheKey from './makeCacheKey';

/**
 * Create a memoizing wrapper for a method that uses an asynchronous backing cache.
 *
 * @param originalMethod The original method (method to wrap)
 * @param target The decorated target (the class or instance)
 * @param propertyKey The decorated property key (name of the memoized method)
 * @param cache The cache
 * @param maxAge The maximum age of cached items
 *
 * @returns a version of `originalMethod` that memoizes its return value
 */
export default function makeAsyncWrapper(
  originalMethod: Function,
  target: any,
  propertyKey: string,
  cache: AsyncCacheInterface,
  maxAge: number
) {
  return async function(...args: any[]) {
    const key = makeCacheKey(target, propertyKey, args);

    if (await cache.has(key)) {
      const c = await cache.get<any>(key);
      if (c && c.expiresAt > Date.now()) {
        return c.value;
      } else {
        await cache.delete(key);
      }
    }

    const expiresAt = Date.now() + maxAge;
    // @ts-ignore: untyped this
    const value = originalMethod.call(this, ...args);

    if (!isPromise(value)) {
      throw new Error(
        'a memoizer using an async cache cannot memoize a function that does not ' +
          'return a Promise'
      );
    }

    await cache.set(key, { expiresAt, value });

    // don’t cache rejected promises
    value.catch(() => cache.delete(key));

    return value;
  };
}
