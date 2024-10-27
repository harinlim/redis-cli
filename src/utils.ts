import type {
  DeleteParams,
  GetParams,
  HGetParams,
  HSetParams,
  LPopParams,
  LPushParams,
  LRangeParams,
  SetParams,
} from '@/types';

export const parseSetParams = (command: string[]): SetParams => {
  console.log(this);
  // Check for minimum number of arguments
  if (command.length < 3) {
    throw new Error('SET requires at least 2 arguments');
  }

  const params: SetParams = {
    key: command[1],
    value: command[2],
  };

  // Check for optional arguments
  for (let i = 3; i < command.length; i++) {
    switch (command[i].toUpperCase()) {
      case 'NX':
        params.nx = true;
        break;
      case 'XX':
        params.xx = true;
        break;
      case 'GET':
        params.get = true;
        break;
      case 'EX':
        if (i + 1 >= command.length || Number.isNaN(parseInt(command[i + 1]))) {
          throw new Error('Invalid expiration time');
        }
        params.ttl = parseInt(command[i + 1]) * 1000;
        i++;
        break;
      case 'PX':
        if (i + 1 >= command.length || Number.isNaN(parseInt(command[i + 1]))) {
          throw new Error('Invalid expiration time');
        }
        params.ttl = parseInt(command[i + 1]);
        i++;
        break;
      case 'KEEPTTL':
        params.keepTtl = true;
        break;
      default:
        throw new Error('Invalid argument: ' + command[i]);
    }
  }

  // If NX and XX are both set, return an error
  if (params.nx && params.xx) {
    throw new Error('NX and XX cannot be used together');
  }

  // If EX/PX are set with KEEPTTL, return an error
  if (params.keepTtl && params.ttl) {
    throw new Error('EX/PX and KEEPTTL cannot be used together');
  }

  return params;
};

export const parseGetParams = (command: string[]): GetParams => {
  // Check for minimum number of arguments
  if (command.length !== 2) {
    throw new Error('GET requires 1 argument');
  }

  return command[1];
};

export const parseDeleteParams = (command: string[]): DeleteParams => {
  // Check for minimum number of arguments
  if (command.length < 2) {
    throw new Error('DEL requires at least 1 argument');
  }

  return { keys: command.slice(1) };
};

export const parseLpushParams = (command: string[]): LPushParams => {
  // Check for minimum number of arguments
  if (command.length < 3) {
    throw new Error('LPUSH requires at least 2 arguments');
  }

  return { key: command[1], values: command.slice(2) };
};

export const parseLpopParams = (command: string[]): LPopParams => {
  // Check for minimum number of arguments
  if (command.length < 2) {
    throw new Error('LPOP requires at least 1 argument');
  }

  if (command.length > 3) {
    throw new Error('LPOP cannot have more than 2 arguments');
  }

  const params = { key: command[1], count: 1 };

  // Check for optional count argument
  if (command.length > 2) {
    if (Number.isNaN(parseInt(command[2]))) {
      throw new Error('Invalid count argument');
    }
    params.count = parseInt(command[2]);
  }

  return params;
};

export const parseLrangeParams = (command: string[]): LRangeParams => {
  // Check for minimum number of arguments
  if (command.length !== 4) {
    throw new Error('LRANGE requires 3 arguments');
  }

  // Check for start and stop arguments
  if (Number.isNaN(parseInt(command[2])) || Number.isNaN(parseInt(command[3]))) {
    throw new Error('Invalid start or stop argument');
  }

  const params: LRangeParams = {
    key: command[1],
    start: parseInt(command[2]),
    stop: parseInt(command[3]),
  };

  return params;
};

export const parseHsetParams = (command: string[]): HSetParams => {
  // Check for minimum number of arguments
  if (command.length < 4 || command.length % 2 !== 0) {
    throw new Error('HSET requires field-value pairs');
  }

  const params: HSetParams = { key: command[1], fields: {} };

  // Note, overwrites duplicate fields
  for (let i = 2; i < command.length; i += 2) {
    params.fields[command[i]] = command[i + 1];
  }

  return params;
};

export const parseHgetParams = (command: string[]): HGetParams => {
  // Check for minimum number of arguments
  if (command.length !== 3) {
    throw new Error('HGET requires 2 arguments');
  }

  return { key: command[1], field: command[2] };
};

export const print = (result: string | number | null | string[]): void => {
  if (result === null) {
    console.log(result);
    return;
  }

  if (Array.isArray(result)) {
    result.forEach((value, index) => console.log(`${index + 1}) ${value}`));
    return;
  }

  console.log(result);
};
