export const INSTRUCTIONS: string = `
Welcome to Redis CLI.

Commands:
SET key value [NX|XX] [GET] [EX seconds | PX milliseconds | KEEPTTL]
GET key
DEL key [key ...]
LPUSH key value [value ...]
LPOP key [count]
LRANGE key start stop
HSET key field value [field value ...]
HGET key field

Type 'HELP' to see more details about command options.
`;

export const COMMAND_DESCRIPTIONS: string = `
Redis Commands:
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
`;
