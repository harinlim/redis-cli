/*
Helper functions to parse command input and run the appropriate command.
*/

import { HSetParams, LRangeParams, SetParams } from "./types";

const parseSetParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length < 3) {
    return new Error("SET requires at least 2 arguments");
  }

  const params: SetParams = { 
    key: command[1], 
    value: command[2]
  };

  // Check for optional arguments
  for (let i = 3; i < command.length; i++) {
    switch (command[i].toUpperCase()) {
      case "NX":
        params.nx = true;
        break;
      case "XX":
        params.xx = true;
        break;
      case "GET":
        params.get = true;
        break;
      case "EX":
        if (i + 1 >= command.length || isNaN(parseInt(command[i + 1]))) {
          return new Error("Invalid expiration time");
        }
        params.ttl = parseInt(command[i + 1]);
        i++;
        break;
      case "PX":
        if (i + 1 >= command.length || isNaN(parseInt(command[i + 1]))) {
          return new Error("Invalid expiration time");
        }
        params.ttl = parseInt(command[i + 1]) / 1000;
        i++;
        break;
      case "KEEPTTL":
        params.keepTtl = true;
        break;
      default:
        return new Error("Invalid argument: " + command[i]);
    }
  }

  // If NX and XX are both set, return an error
  if (params.nx && params.xx) {
    return new Error("NX and XX cannot be used together");
  }

  // If EX/PX are set with KEEPTTL, return an error
  if (params.keepTtl && params.ttl) {
    return new Error("EX/PX and KEEPTTL cannot be used together");
  }
  
  return params;
}

const parseGetParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length !== 2) {
    return new Error("GET requires 1 argument");
  }

  return command[1];
}

const parseDeleteParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length < 2) {
    return new Error("DEL requires at least 1 argument");
  }

  return command.slice(1);
}

const parseLpushParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length < 3) {
    return new Error("LPUSH requires at least 2 arguments");
  }

  return { key: command[1], values: command.slice(2) };
}

const parseLpopParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length < 2) {
    return new Error("LPOP requires at least 1 argument");
  }

  const params = { key: command[1], count: 1 };

  // Check for optional count argument
  if (command.length > 2) {
    if (isNaN(parseInt(command[2]))) {
      return new Error("Invalid count argument");
    }
    params.count = parseInt(command[2]);
  }

  return params;
}

const parseLrangeParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length !== 4) {
    return new Error("LRANGE requires 3 arguments");
  }

  // Check for start and stop arguments
  if (isNaN(parseInt(command[2])) || isNaN(parseInt(command[3]))) {
    return new Error("Invalid start or stop argument");
  }

  const params: LRangeParams = { 
    key: command[1], 
    start: parseInt(command[2]), 
    stop: parseInt(command[3]) 
  };

  return params;
}

const parseHsetParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length < 4 || command.length % 2 !== 0) {
    return new Error("HSET requires field-value pairs");
  }

  const params: HSetParams = { key: command[1], fields: {} };

  // Note, overwrites duplicate fields
  for (let i = 2; i < command.length; i += 2) {
    params.fields[command[i]] = command[i + 1];
  }

  return params;
}

const parseHgetParams = (command: string[]) => {
  // Check for minimum number of arguments
  if (command.length !== 3) {
    return new Error("HGET requires 2 arguments");
  }

  return { key: command[1], field: command[2] };
}

export { 
  parseSetParams, 
  parseGetParams, 
  parseDeleteParams, 
  parseLpushParams, 
  parseLpopParams,
  parseLrangeParams,
  parseHsetParams,
  parseHgetParams
};