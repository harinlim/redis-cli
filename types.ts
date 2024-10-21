type StoreValue = string | string[] | Map<string, string>;

type Entry = {
  type: "string" | "list" | "hash";
  expiration?: Date;
  value: StoreValue
};

type SetParams = {
  key: string;
  value: string;
  nx?: boolean;
  xx?: boolean;
  get?: boolean;
  ttl?: number;
  keepTtl?: boolean;
}

type LRangeParams = {
  key: string;
  start: number;
  stop: number;
}

export { SetParams, StoreValue, Entry, LRangeParams };