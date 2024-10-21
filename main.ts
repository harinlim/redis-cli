/*
The Problem
Redis is a popular in-memory data store. Many cloud software companies use it as a caching layer, database, streaming engine or message broker. At its core Redis stores key value pairs. Your task will be to implement some parts of Redis including in memory key/value storage and a few Redis commands.
Your Solution
● Will only store values in memory. You do not need to write anything to disk/file.
● When the program starts it will prompt for the command to run.
● Once the user inputs the command, assuming the command is valid, the command will operate.
● DO NOT use a redis library/redis database. You are building the redis database/commands.
● Must implement the following commands: SET, GET, DEL
● Bonus points for this set of commands: LPUSH, LPOP, LRANGE
● Even more bonus points for this set of commands: HSET, HGET
● Additional commands do not earn bonus points.
● Example program execution:
○ > What is your command?
○ >> SET myvalue GoQuiq
○ >OK
○ > What is your command?
○ >> GET myvalue
○ > “GoQuiq”
● The data storage does NOT need to persist after the program is ended/killed.
● Please include a README file that describes any assumptions you made and also highlights
anything about your solution you’d like us to know
● Although Quiq appreciates and requires folks with UX experience, there are no “bonus points” for
advanced user interface on this particular challenge. Our expectation is that this would be used as a command line tool. Please focus your efforts on the nuts and bolts of Redis.
*/
import { createInterface } from "readline";
import { INSTRUCTIONS, COMMAND_DESCRIPTIONS } from "./strings";
import { parseDeleteParams, parseGetParams, parseSetParams } from "./utils";
import Store from "./store";

const inputReader = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function handleInput(command: string, store: Store) {
  handleCommand(command, store);
  inputReader.prompt();
}

function handleExit() {
  console.log("Exiting...");
  process.exit(0);
}

function handleCommand(input: string, store: Store) {
  // Parse input and convert to argument array
  const command = input.trim().split(" ").map((x) => x.toUpperCase());
  
  switch (command[0]) {
    case "HELP":
      console.log(COMMAND_DESCRIPTIONS);
      break;
    case "SET":
      const params = parseSetParams(command);
      if (params instanceof Error) {
        console.log(params.message);
        break;
      }
      const result = store.set(params);
      if (result instanceof Error) {
        console.log(result.message);
        break;
      }
      console.log(result);
      break;
    case "GET":
      const key = parseGetParams(command);
      if (key instanceof Error) {
        console.log(key.message);
        break;
      }
      const value = store.get(key);
      console.log(value);
      break;
    case "DEL":
      const keys = parseDeleteParams(command);
      if (keys instanceof Error) {
        console.log(keys.message);
        break;
      }
      const count = store.delete(keys);
      console.log(count + " key" + (count === 1 ? "" : "s") + " removed");
      break;
    case "LPUSH":
      break;
    case "LPOP":
      break;
    case "LRANGE":
      break;
    case "HSET":
      break;
    case "HGET":
      break;
    case "EXIT":
      inputReader.close();
    default:
      console.log("Command not found");
  }
}

function main() {
  const store = new Store();
  console.log(INSTRUCTIONS);

  inputReader.setPrompt(">> ");
  inputReader.prompt();

  inputReader.on("line", (command) => handleInput(command, store)).on("close", handleExit);
}

main();
