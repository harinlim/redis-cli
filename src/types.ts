export type Entry =
  | { type: 'string'; expiration?: Date; value: string }
  | { type: 'list'; expiration?: Date; value: string[] }
  | { type: 'hash'; expiration?: Date; value: Map<string, string> };

export type Command = 'SET' | 'GET' | 'DEL' | 'LPUSH' | 'LPOP' | 'LRANGE' | 'HSET' | 'HGET';

export type CommandHandlers = Record<
  Command,
  (args: string[]) => string | string[] | number | null
>;

export type SetParams = {
  key: string;
  value: string;
  nx?: boolean;
  xx?: boolean;
  get?: boolean;
  ttl?: number;
  keepTtl?: boolean;
};

export type GetParams = string;

export type DeleteParams = {
  keys: string[];
};

export type LPushParams = {
  key: string;
  values: string[];
};

export type LPopParams = {
  key: string;
  count: number;
};

export type LRangeParams = {
  key: string;
  start: number;
  stop: number;
};

export type HSetParams = {
  key: string;
  fields: Record<string, string>;
};

export type HGetParams = {
  key: string;
  field: string;
};
