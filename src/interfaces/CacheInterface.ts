export interface CacheItem<T> {
  expiresAt: number;
  value: T;
}

/**
 * Implement this interface to provide a caching mechanism for memoizing functions.
 */
export default interface CacheInterface {
  /** checks if the key exists in the cache */
  has: (key: string) => boolean;
  /** stores a cached value */
  set: <T>(key: string, item: CacheItem<T>) => void;
  /** gets a cached value, or undefined if the item is not in cache */
  get: <T>(key: string) => CacheItem<T> | undefined;
  /** deletes a cached value */
  delete: (key: string) => void;
}
