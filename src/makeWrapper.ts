import isPromise from 'p-is-promise';
import CacheInterface from './interfaces/CacheInterface';
import makeCacheKey from './makeCacheKey';

/**
 * Create a memoizing wrapper for a method.
 *
 * @param originalMethod The original method (method to wrap)
 * @param target The decorated target (the class or instance)
 * @param propertyKey The decorated property key (name of the memoized method)
 * @param cache The cache
 * @param maxAge The maximum age of cached items
 *
 * @returns a version of `originalMethod` that memoizes its return value
 */
export default function makeWrapper(
  originalMethod: Function,
  target: any,
  propertyKey: string,
  cache: CacheInterface,
  maxAge: number
) {
  return function(...args: any[]) {
    const key = makeCacheKey(target, propertyKey, args);

    if (cache.has(key)) {
      const c = cache.get<any>(key);
      if (c && c.expiresAt > Date.now()) {
        return c.value;
      } else {
        cache.delete(key);
      }
    }

    const expiresAt = Date.now() + maxAge;
    // @ts-ignore: untyped this
    const value = originalMethod.call(this, ...args);

    cache.set(key, { expiresAt, value });

    if (isPromise(value)) {
      // don’t cache rejected Promises
      value.catch(() => cache.delete(key));
    }

    return value;
  };
}
