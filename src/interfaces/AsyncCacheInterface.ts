import { CacheItem } from './CacheInterface';

/**
 * Implement this interface to provide a caching mechanism for memoizing functions, where
 * the backing cache is asynchronous (such as Redis).
 */
export default interface AsyncCacheInterface {
  /** checks if the key exists in the cache */
  has: (key: string) => Promise<boolean>;
  /** stores a cached value */
  set: <T>(key: string, item: CacheItem<T>) => Promise<void>;
  /** gets a cached value, or undefined if the item is not in cache */
  get: <T>(key: string) => Promise<CacheItem<T> | undefined>;
  /** deletes a cached value */
  delete: (key: string) => Promise<void>;
}
