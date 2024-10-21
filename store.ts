import { Entry, SetParams, StoreValue } from "./types";

class Store {
  private store: Map<string, Entry>;

  constructor() {
    this.store = new Map<string, Entry>();
  }

  // Check if value is correct type for key
  public isValidType(value: StoreValue, expectedType: "string" | "list" | "hash"): boolean {
    if (expectedType === "string") {
      return typeof value === "string";
    } else if (expectedType === "list") {
      return Array.isArray(value);
    } else if (expectedType === "hash") {
      return value instanceof Map;
    }
    return false;
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

    // Check if value is correct type
    if (!this.isValidType(value, "string")) {
      return new Error("Invalid value type");
    }

    // Create new entry if key does not exist
    if (!this.store.has(key)) {
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
}

export default Store;