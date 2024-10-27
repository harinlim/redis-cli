import { createInterface } from 'node:readline';

import { Store } from '@/store';
import { COMMAND_DESCRIPTIONS, INSTRUCTIONS } from '@/strings';
import {
  parseDeleteParams,
  parseGetParams,
  parseHgetParams,
  parseHsetParams,
  parseLpopParams,
  parseLpushParams,
  parseLrangeParams,
  parseSetParams,
  print,
} from '@/utils';

import type { Command, CommandHandlers } from '@/types';

const inputReader = createInterface({
  input: process.stdin,
  output: process.stdout,
});

export function createCommandHandlers(store: Store): CommandHandlers {
  // Can't use a pipe helper because the store callback would lose the `this` reference lol
  return {
    SET: (args) => store.set(parseSetParams(args)),
    GET: (args) => store.get(parseGetParams(args)),
    DEL: (args) => store.delete(parseDeleteParams(args)),
    LPUSH: (args) => store.lpush(parseLpushParams(args)),
    LPOP: (args) => store.lpop(parseLpopParams(args)),
    LRANGE: (args) => store.lrange(parseLrangeParams(args)),
    HSET: (args) => store.hset(parseHsetParams(args)),
    HGET: (args) => store.hget(parseHgetParams(args)),
  } as const;
}

export function handleCommand(input: string, commandHandlers: CommandHandlers) {
  // Parse input and convert to argument array
  const commands = input.trim().split(/\s+/);
  const command = commands[0].toUpperCase();

  if (command === 'EXIT') {
    inputReader.close();
    return;
  }

  if (command === 'HELP') {
    console.log(COMMAND_DESCRIPTIONS);
    return;
  }

  if (!(command in commandHandlers)) {
    console.log('Command not found');
    return;
  }

  const execute = commandHandlers[command as Command];

  try {
    const result = execute(commands);
    print(result);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
}

function main() {
  const store = new Store();

  console.log(INSTRUCTIONS);

  inputReader.setPrompt('>> ');
  inputReader.prompt();

  const commandHandlers = createCommandHandlers(store);

  function handleInput(command: string) {
    handleCommand(command, commandHandlers);
    inputReader.prompt();
  }

  function handleExit() {
    console.log('Exiting...');
    process.exit(0);
  }

  inputReader.on('line', handleInput).on('close', handleExit);
}

if (require.main === module) {
  main();
}
