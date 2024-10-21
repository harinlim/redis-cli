import { createInterface } from "readline";
import { INSTRUCTIONS, COMMAND_DESCRIPTIONS } from "./strings";
import { parseDeleteParams, parseGetParams, parseSetParams, parseLpushParams, parseLpopParams, parseLrangeParams, parseHsetParams, parseHgetParams } from "./utils";
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

// Format and output list
function handleListOutput(list: string[] | Error | null) {
  if (list instanceof Error) {
    console.log(list.message);
    return
  }

  if (list === null) {
    console.log(list);
    return;
  }

  list.forEach((value, index) => console.log(`${index + 1}) ${value}`));
}

function handleCommand(input: string, store: Store) {
  // Parse input and convert to argument array
  const command = input.trim().split(/\s+/);
  
  switch (command[0].toUpperCase()) {
    case "HELP":
      console.log(COMMAND_DESCRIPTIONS);
      break;
    case "SET":
      const setParams = parseSetParams(command);
      if (setParams instanceof Error) {
        console.log(setParams.message);
        break;
      }
      const result = store.set(setParams);
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
      if (value instanceof Error) {
        console.log(value.message);
        break;
      }
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
      const lpushParams = parseLpushParams(command);
      if (lpushParams instanceof Error) {
        console.log(lpushParams.message);
        break;
      }
      const length = store.lpush(lpushParams);
      if (length instanceof Error) {
        console.log(length.message);
        break;
      }
      console.log(length);
      break;
    case "LPOP":
      const lpopParams = parseLpopParams(command);
      if (lpopParams instanceof Error) {
        console.log(lpopParams.message);
        break;
      }
      const popped = store.lpop(lpopParams);
      handleListOutput(popped);
      break;
    case "LRANGE":
      const lrangeParams = parseLrangeParams(command);
      if (lrangeParams instanceof Error) {
        console.log(lrangeParams.message);
        break;
      }
      const range = store.lrange(lrangeParams);
      handleListOutput(range);
      break;
    case "HSET":
      const hsetParams = parseHsetParams(command);
      if (hsetParams instanceof Error) {
        console.log(hsetParams.message);
        break;
      }
      const hsetResult = store.hset(hsetParams);
      if (hsetResult instanceof Error) {
        console.log(hsetResult.message);
        break;
      }
      console.log(hsetResult);
      break;
    case "HGET":
      const hgetParams = parseHgetParams(command);
      if (hgetParams instanceof Error) {
        console.log(hgetParams.message);
        break;
      }
      const hgetResult = store.hget(hgetParams);
      if (hgetResult instanceof Error) {
        console.log(hgetResult.message);
        break;
      }
      console.log(hgetResult);
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
