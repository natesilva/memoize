import CacheInterface from './interfaces/CacheInterface';
import makeCacheKey from './makeCacheKey';
import isPromise from 'p-is-promise';
import makeWrapper from './makeWrapper';
import AsyncCacheInterface from './interfaces/AsyncCacheInterface';
import makeAsyncWrapper from './makeAsyncWrapper';

export interface MemoizeOptions {
  /** how long to cache the memoized result (default: don’t expire) */
  maxAge?: number;
  /** The cache interface to use (default: new Map()) */
  cache?: CacheInterface;
}

export interface AsyncMemoizeOptions {
  /** how long to cache the memoized result (default: don’t expire) */
  maxAge?: number;
  /** The cache interface to use (default: new Map()) */
  cache?: AsyncCacheInterface;
}

/**
 * Creates a memoizer using a synchronous backing cache. This memoizer can wrap both async
 * and non-async methods.
 *
 * @return a memoize wrapper
 */
export function createMemoize(options?: MemoizeOptions) {
  options = Object.assign({ cache: new Map() }, options);

  const cache = options.cache!;
  const maxAge = options.maxAge || Infinity;

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // descriptor.value is the method being decorated; wrap it with memoization
    descriptor.value = makeWrapper(descriptor.value, target, propertyKey, cache, maxAge);
  };
}

/**
 * Creates a memoizer using an asynchronous backing cache, such as Redis. This memoizer
 * can wrap only async methods.
 *
 * @return a memoize wrapper that can be applied to async methods
 */
export function createAsyncMemoize(options?: AsyncMemoizeOptions) {
  options = Object.assign({ cache: new Map() }, options);

  const cache = options.cache!;
  const maxAge = options.maxAge || Infinity;

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // descriptor.value is the method being decorated; wrap it with memoization
    descriptor.value = makeAsyncWrapper(
      descriptor.value,
      target,
      propertyKey,
      cache,
      maxAge
    );
  };
}
