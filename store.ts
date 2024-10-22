import { Entry, HSetParams, LRangeParams, SetParams } from "./types";

class Store {
  private store: Map<string, Entry>;

  constructor() {
    this.store = new Map<string, Entry>();
  }

  // Lazily expire keys, check if key is expired and delete if necessary
  public deleteExpiredKey(key: string) {
    if (this.store.has(key)) {
      const entry = this.store.get(key)!;
      if (entry.expiration && entry.expiration < new Date()) {
        this.store.delete(key);
      }
    }
  }

  // Set key to value
  // Note: overwrites existing key regardless of type
  public set({ key, value, nx, xx, get, ttl, keepTtl }: SetParams) {
    this.deleteExpiredKey(key);

    // Check if key already exists and NX is set
    if (nx && this.store.has(key)) {
      return new Error("Key already exists");
    }

    // Check if key does not exist and XX is set
    if (xx && !this.store.has(key)) {
      return new Error("Key does not exist");
    }

    // Create new entry if key does not exist or is not a string
    if (!this.store.has(key) || this.store.get(key)!.type !== "string") {
      const entry: Entry = { type: "string", value: value };
      this.store.set(key, entry);
    } 

    const entry = this.store.get(key)!;
    entry.value = value;

    // Clear TTL if not keep TTL
    if (!keepTtl && entry.expiration) {
      delete entry.expiration;
    }

    // Set TTL if specified
    if (ttl) {
      entry.expiration = new Date(Date.now() + ttl * 1000);
    }

    return get ? entry.value : "OK";
  }

  public get(key: string) {
    this.deleteExpiredKey(key);

    // Type check
    if (this.store.has(key) && this.store.get(key)!.type !== "string") {
      return new Error("Value is not a string");
    }

    return this.store.get(key)?.value ?? null;
  }

  // TODO: potentially make verbose mode which specifies which keys were deleted
  public delete(keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        count++;
      }
    };
    return count;
  }

  public lpush({ key, values }: { key: string, values: string[] }) {
    this.deleteExpiredKey(key);

    // Check if key already exists
    if (!this.store.has(key)) {
      const entry: Entry = { type: "list", value: [] };
      this.store.set(key, entry);
    }

    const entry = this.store.get(key)!;

    // Check if value is a list
    if (entry.type !== "list") {
      return new Error("Value is not a list");
    }

    // In reality, LPUSH would add to the head of the list
    // But for simplicity, we'll just add to the end and retrieve
    // in reverse. If RPUSH is implemented, we can change this
    // by unshifting values or using a doubly linked list.
    return (entry.value as string[]).push(...values);
  }

  public lpop({ key, count }: { key: string, count: number }) {
    this.deleteExpiredKey(key);

    // Check if key exists
    if (!this.store.has(key)) {
      return null;
    }

    const entry = this.store.get(key)!;

    // Type check
    if (entry.type !== "list") {
      return new Error("Value is not a list");
    }

    const values = entry.value as string[];

    const popped: string[] = []
    for (let i = 0; i < count; i++) {
      // If list is shorter than count, return list
      if (values.length === 0) {
        break;
      }
      popped.push(values.pop()!);
    }
    return popped.length ? popped : null;
  }

  public lrange({ key, start, stop }: LRangeParams) {
    this.deleteExpiredKey(key);

    // Check if key exists
    if (!this.store.has(key)) {
      return null;
    }

    const entry = this.store.get(key)!;

    // Type check
    if (entry.type !== "list") {
      return new Error("Value is not a list");
    }

    const values = entry.value as string[];

    // We will follow Redis' out of bounds practices
    // If start is greater than the end of the list, return empty list
    if (start >= values.length || start > stop) {
      return [];
    }

    // If stop is greater than the end of the list, set to end of list
    if (stop >= values.length) {
      stop = values.length - 1;
    }

    // Treat negative indices as offsets from the end of the list
    if (start < 0) {
      start = values.length + start;
    }

    if (stop < 0) {
      stop = values.length + stop;
    }
    
    // Return range, INCLUSIVE of start and stop, indexing from end of array + reversing to
    // account for lpush/pop optimization (going from opposite side)
    return values.slice(values.length - 1 - stop, values.length - 1 - start + 1).reverse();
  }

  public hset({ key, fields }: HSetParams) {
    this.deleteExpiredKey(key);

    // Check if key already exists
    if (!this.store.has(key)) {
      const entry: Entry = { type: "hash", value: new Map<string, string>() };
      this.store.set(key, entry);
    }

    const entry = this.store.get(key)!;

    // Check if value is a hash
    if (entry.type !== "hash") {
      return new Error("Value is not a hash");
    }

    const map = entry.value as Map<string, string>;

    // Overwrite fields if they already exist
    let count = 0;
    for (const field in fields) {
      if (!map.has(field)) {
        count++;
      }
      map.set(field, fields[field]);
    }

    return count;
  }

  public hget({ key, field }: { key: string, field: string } ) {
    this.deleteExpiredKey(key);

    // Check if key exists
    if (!this.store.has(key)) {
      return null;
    }

    const entry = this.store.get(key)!;

    // Type check
    if (entry.type !== "hash") {
      return new Error("Value is not a hash");
    }

    const map = entry.value as Map<string, string>;

    return map.get(field) ?? null;
  }
}

export default Store;