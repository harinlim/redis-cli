# Redis CLI

Redis CLI is a command line tool that replicates basic functionality for Redis using TypeScript. 

## Differences from Redis

Most of the functionality closely matches Redis behavior, but there were some areas where I chose to modify behavior for simplicity.

1/ `(nil) -> null`: any case where Redis would output `(nil)`, output `null` for JS adaptation

2/ `lpush`, `lpop`, `lrange` are implemented with an array where the head is at the end of the array with backwards indexing for simpler implementation and to closely match performance as `Array#shift` / `Array#unshift` are $O(n)$ in cost due to dynamic resizing. In other words, I implemented this as a JS "stack".

- Redis uses doubly linked lists, but since we didn't need to implement `rpush`, `rpop`, etc., I didn't see the need to import a performant JS library for this (as JS doesn't natively have lists).

3/ Lazily expire keys on access. This means that keys that are never accessed after expiring are not removed from memory, but since this is a small scale project, we assume that memory is not an issue. There are alternative implementations, and I found [this article](https://www.pankajtanwar.in/blog/how-redis-expires-keys-a-deep-dive-into-how-ttl-works-internally-in-redis) which dives into the approaches that Redis took.



## Redis Commands
```
SET key value [NX|XX] [GET] [EX seconds | PX milliseconds | KEEPTTL]  
    Description: Set the string value of a key
    Returns: OK if successful or value if GET.
    Options:
        - NX: Only set the key if it does not already exist.
        - XX: Only set the key if it already exist.
        - GET: Return the value of the key after setting the value.
        - EX seconds: Set the specified expire time, in seconds.
        - PX milliseconds: Set the specified expire time, in milliseconds.
        - KEEPTTL: Retain the time to live already associated with the key.
GET key                                                     
    Description: Get the string value of a key
    Returns: The value of the key or null if it doesn't exist.
DEL key [key ...]                                           
    Description: Delete all specified keys.
    Returns: Number of removed keys.
    Options:
        - key: Additional keys to delete.
LPUSH key value [value ...]
    Description: Insert all the specified values at the head of the list stored at key.
    Returns: The length of the list after the push operation.
    Options:
        - value.. : Additional values to insert.
LPOP key [count]
    Description: Removes and returns first [count] (defaults to 1) elements.
    Returns: The value(s) of the removed element(s).
    Options:
        - count: The number of elements to remove.
LRANGE key start stop
    Description: Get a range of elements from a list.
    Returns: A list of elements in the specified range, inclusive of stop.
HSET key field value [field value ...]
    Description: Set the string value of a hash field.
    Returns: Number of successfully set fields.
    Options:
        - field value: Additional field value pairs.
HGET key field
    Description: Get the value of a hash field.
    Returns: The value of the field, or null when the field does not exist.

CLI Commands:
HELP - Show this help message.
EXIT - Exit the CLI. Warning: Data will not persist.
```

## Development

Make sure you have `node v22` and `pnpm v8` installed.

To install packages:
```
pnpm install
```

To run the CLI
```
pnpm start
```

To run tests
```
pnpm test
```