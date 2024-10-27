import type {
  DeleteParams,
  Entry,
  GetParams,
  HGetParams,
  HSetParams,
  LRangeParams,
  SetParams,
} from '@/types';

export class Store {
  store: Map<string, Entry>;

  constructor() {
    this.store = new Map<string, Entry>();
  }

  deleteExpiredKey(key: string) {
    if (this.store.has(key)) {
      const entry = this.store.get(key)!;
      if (entry.expiration && entry.expiration < new Date()) {
        this.store.delete(key);
      }
    }
  }

  typecheck<T extends 'string' | 'list' | 'hash'>(key: string, expectedType: T) {
    const entry = this.store.get(key);
    // Ignore typecheck on keys that are not yet set
    if (entry !== undefined && entry.type !== expectedType) {
      throw new Error(`Value is not a ${expectedType}`);
    }

    return entry as Extract<Entry, { type: T }>;
  }

  /**
   * Set the string value of a key. Returns 'OK' if successful or the value if GET.
   * Note: overwrites existing values regardless of type, as per Redis behavior.
   *
   * {@link https://redis.io/docs/latest/commands/set/}
   */
  public set({ key, value, nx, xx, get, ttl, keepTtl }: SetParams): string | null {
    console.log(this);
    this.deleteExpiredKey(key);

    // Check if key already exists and NX is set
    if (nx && this.store.has(key)) {
      return null;
    }

    // Check if key does not exist and XX is set
    if (xx && !this.store.has(key)) {
      return null;
    }

    // Keep old value if GET is set
    let oldEntry: string | null = null;
    if (get) {
      oldEntry = this.typecheck(key, 'string')?.value;
    }

    // Create new entry if key does not exist or is not a string
    if (!this.store.has(key) || this.store.get(key)!.type !== 'string') {
      const entry: Entry = { type: 'string', value: value };
      this.store.set(key, entry);
    }

    const entry = this.store.get(key)!;
    entry.value = value;

    // Clear TTL if not keep TTL
    if (!keepTtl && entry.expiration) {
      delete entry.expiration;
    }

    if (ttl) {
      entry.expiration = new Date(Date.now() + ttl);
    }

    return get ? (oldEntry ?? null) : 'OK';
  }

  /**
   * Get the value of the key. Returns null if the key does not exist.
   *
   * {@link https://redis.io/docs/latest/commands/get/}
   */
  public get(key: GetParams): string | null {
    this.deleteExpiredKey(key);

    const entry = this.typecheck(key, 'string');

    return entry?.value ?? null;
  }

  /**
   * Removes the specified keys, returning the count of keys
   * deleted. A key is ignored if it does not exist.
   *
   * {@link https://redis.io/docs/latest/commands/del/}
   */
  public delete({ keys }: DeleteParams): number {
    let count = 0;
    for (const key of keys) {
      this.deleteExpiredKey(key);
      if (this.store.has(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Adds new values to the list specified at `key`. If the key does not exist, a new list is created.
   * Returns the length of the list after the push operation.
   *
   * {@link https://redis.io/docs/latest/commands/lpush/}
   */
  public lpush({ key, values }: { key: string; values: string[] }): number {
    this.deleteExpiredKey(key);

    // Create new entry if key does not exist
    if (!this.store.has(key)) {
      this.store.set(key, { type: 'list', value: [] });
    }

    const entry = this.typecheck(key, 'list');

    // In reality, LPUSH would add to the head of the list
    // But for simplicity, we'll just add to the end and retrieve
    // in reverse. If RPUSH is implemented, we can change this
    // by unshifting values (O(n)) or using a doubly linked list (O(1))
    // Redis uses a doubly linked list for this purpose
    return entry.value.push(...values);
  }

  /**
   * Pops `count` elements from the list specified at `key`.
   * Returns the value(s) of the removed element(s) or null if the list is empty.
   *
   * {@link https://redis.io/docs/latest/commands/lpop/}
   */
  public lpop({ key, count }: { key: string; count: number }): string[] | null {
    this.deleteExpiredKey(key);

    const entry = this.typecheck(key, 'list');

    if (!entry) {
      return null;
    }

    const values = entry.value as string[];

    const popped: string[] = [];
    for (let i = 0; i < count; i++) {
      // If list is shorter than count, return list
      if (values.length === 0) {
        break;
      }
      popped.push(values.pop()!);
    }
    return popped.length ? popped : null;
  }

  /**
   * Find a range of elements from the list stored at `key`.
   * Returns a list of elements in the specified range, inclusive of `stop`.
   *
   * {@link https://redis.io/docs/latest/commands/lrange/}
   */
  public lrange({ key, start, stop }: LRangeParams): string[] | null {
    this.deleteExpiredKey(key);

    if (!this.store.has(key)) {
      return null;
    }

    const entry = this.typecheck(key, 'list');
    const values = entry.value;

    // Treat negative indices as offsets from the end of the list
    if (start < 0) {
      start = values.length + start;
    }

    if (stop < 0) {
      stop = values.length + stop;
    }

    // We will follow Redis' out of bounds practices
    // If start is greater than the end of the list, return empty list
    if (start >= values.length || start > stop) {
      return [];
    }

    // If stop is greater than the end of the list, set to end of list
    if (stop >= values.length) {
      stop = values.length - 1;
    }

    // Return range, INCLUSIVE of start and stop, indexing from end of array + reversing to
    // account for lpush/pop optimization (going from opposite side)
    return values.slice(values.length - 1 - stop, values.length - 1 - start + 1).reverse();
  }

  /**
   * Sets the specified fields to their respective values in the hash stored at `key`.
   * Returns the number of successfully set fields.
   *
   * {@link https://redis.io/docs/latest/commands/hset/}
   */
  public hset({ key, fields }: HSetParams): number {
    this.deleteExpiredKey(key);

    if (!this.store.has(key)) {
      const entry: Entry = { type: 'hash', value: new Map<string, string>() };
      this.store.set(key, entry);
    }

    const entry = this.typecheck(key, 'hash');

    const map = entry.value as Map<string, string>;

    let count = 0;
    for (const field in fields) {
      if (!map.has(field)) {
        count++;
      }
      map.set(field, fields[field]);
    }

    return count;
  }

  /**
   * Get the value of the field in the hash stored at `key`.
   * Returns the value of the field, or null when the field does not exist.
   *
   * {@link https://redis.io/docs/latest/commands/hget/}
   */
  public hget({ key, field }: HGetParams): string | null {
    this.deleteExpiredKey(key);

    const entry = this.typecheck(key, 'hash');

    if (!entry) {
      return null;
    }

    const map = entry.value as Map<string, string>;

    return map.get(field) ?? null;
  }
}
