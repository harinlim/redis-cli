import { expect } from 'chai';
import sinon from 'sinon';

import { createCommandHandlers, handleCommand } from '@/main';
import { Store } from '@/store';
import { COMMAND_DESCRIPTIONS } from '@/strings';

import type { CommandHandlers } from '@/types';

describe('CLI Application', () => {
  let store: Store;
  let commandHandlers: CommandHandlers;
  let consoleSpy: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    store = new Store();

    commandHandlers = createCommandHandlers(store);

    consoleSpy = sinon.stub(console, 'log');

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  describe('handleCommand', () => {
    it('should print error if command does not exist', () => {
      handleCommand('INVALID', commandHandlers);
      expect(consoleSpy.calledWith('Command not found')).to.be.true;
    });

    it('should print instructions if command is HELP', () => {
      handleCommand('HELP', commandHandlers);
      expect(consoleSpy.calledWith(COMMAND_DESCRIPTIONS)).to.be.true;
    });

    it('should print error if command is missing arguments', () => {
      handleCommand('SET', commandHandlers);
      expect(consoleSpy.calledWith('SET requires at least 2 arguments')).to.be.true;
    });
  });

  describe('SET', () => {
    it('should call store.set', () => {
      handleCommand('SET key value', commandHandlers);
      expect(store.get('key')).to.equal('value');
      expect(consoleSpy.calledWith('OK')).to.be.true;
    });

    it('should call store.set with GET', () => {
      handleCommand('SET key value1 GET', commandHandlers);
      handleCommand('SET key value2 GET', commandHandlers);
      expect(store.get('key')).to.equal('value2');
      expect(consoleSpy.calledWith('value1')).to.be.true;
    });

    it('should only store value for EX seconds', async () => {
      handleCommand('SET key value EX 1', commandHandlers);
      expect(store.get('key')).to.equal('value');

      clock.tick(2000);

      expect(store.get('key')).to.be.null;
    });

    it('should only store value for PX milliseconds', async () => {
      handleCommand('SET key value PX 1000', commandHandlers);
      expect(store.get('key')).to.equal('value');

      clock.tick(2000);

      expect(store.get('key')).to.be.null;
    });

    it('should not overwrite existing key if NX', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('SET key value NX', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
      expect(store.get('key')).to.equal('value');
    });

    it('should not set key if XX', () => {
      handleCommand('SET key value XX', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
      expect(store.get('key')).to.be.null;
    });

    it('should keep TTL if KEEPTTL', async () => {
      handleCommand('SET key value PX 4999', commandHandlers);
      handleCommand('SET key value1 KEEPTTL', commandHandlers);
      expect(store.get('key')).to.equal('value1');

      clock.tick(5000);

      expect(store.get('key')).to.be.null;
    });

    it('should overwrite regardless of type', () => {
      handleCommand('LPUSH key value', commandHandlers);
      handleCommand('SET key value', commandHandlers);
      expect(store.get('key')).to.equal('value');
    });
  });

  describe('GET', () => {
    it('should call store.get', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('GET key', commandHandlers);
      expect(consoleSpy.calledWith('value')).to.be.true;
    });

    it('should return null if key does not exist', () => {
      handleCommand('GET key', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
    });

    it('should throw error if key is not a string', () => {
      store.lpush({ key: 'key', values: ['value'] });
      handleCommand('GET key', commandHandlers);
      expect(consoleSpy.calledWith('Value is not a string')).to.be.true;
    });

    it('should delete key if expired', async () => {
      store.set({ key: 'expired', value: 'value', ttl: 1000 }); // Expire in 1 second

      handleCommand('GET expired', commandHandlers);
      expect(store.get('expired')).to.equal('value');

      clock.tick(5000);

      handleCommand('GET expired', commandHandlers);
      expect(store.get('expired')).to.be.null;
    });
  });

  describe('DEL', () => {
    it('should call store.delete', () => {
      store.set({ key: 'key1', value: 'value1' });
      store.set({ key: 'key2', value: 'value2' });
      handleCommand('DEL key1 key2', commandHandlers);
      expect(consoleSpy.calledWith(2)).to.be.true;
      expect(store.get('key1')).to.be.null;
      expect(store.get('key2')).to.be.null;
    });

    it('should return 0 if key does not exist', () => {
      handleCommand('DEL key', commandHandlers);
      expect(consoleSpy.calledWith(0)).to.be.true;
    });

    it('should delete key if expired but not count', async () => {
      store.set({ key: 'expired', value: 'value', ttl: 1000 });
      expect(store.get('expired')).to.equal('value');

      clock.tick(5000);

      handleCommand('DEL expired', commandHandlers);
      expect(store.get('expired')).to.be.null;
      expect(consoleSpy.calledWith(0)).to.be.true;
    });
  });

  describe('LPUSH', () => {
    it('should call store.lpush', () => {
      handleCommand('LPUSH key value1 value2', commandHandlers);
      expect(store.lrange({ key: 'key', start: 0, stop: 100 })).to.eql(['value2', 'value1']);
      expect(consoleSpy.calledWith(2)).to.be.true;
    });

    it('should create new list if key does not exist', () => {
      handleCommand('LPUSH key value', commandHandlers);
      expect(store.lrange({ key: 'key', start: 0, stop: 100 })).to.eql(['value']);
      expect(consoleSpy.calledWith(1)).to.be.true;
    });

    it('should throw error if key is not a list', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('LPUSH key value', commandHandlers);
      expect(consoleSpy.calledWith('Value is not a list')).to.be.true;
    });

    it('should delete key if expired', async () => {
      store.set({ key: 'expired', value: 'value', ttl: 1000 });
      expect(store.get('expired')).to.eql('value');

      clock.tick(5000);

      handleCommand('LPUSH expired value1 value2', commandHandlers);
      expect(store.lrange({ key: 'expired', start: 0, stop: 100 })).to.eql(['value2', 'value1']);
    });
  });

  describe('LPOP', () => {
    it('should call store.lpop', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2'] });
      handleCommand('LPOP key', commandHandlers);
      expect(store.lrange({ key: 'key', start: 0, stop: 100 })).to.eql(['value1']);
      expect(consoleSpy.calledWith('1) value2')).to.be.true;
    });

    it('should call store.lpop with count', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2'] });
      handleCommand('LPOP key 2', commandHandlers);
      expect(store.lrange({ key: 'key', start: 0, stop: 100 })).to.eql([]);
      expect(consoleSpy.calledWith('1) value2')).to.be.true;
      expect(consoleSpy.calledWith('2) value1')).to.be.true;
    });

    it('should return null if key does not exist', () => {
      handleCommand('LPOP key', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
    });

    it('should throw error if key is not a list', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('LPOP key', commandHandlers);
      expect(consoleSpy.calledWith('Value is not a list')).to.be.true;
    });
  });

  describe('LRANGE', () => {
    it('should call store.lrange for head', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key 0 0', commandHandlers);
      expect(consoleSpy.calledWith('1) value3')).to.be.true;
    });

    it('should return null if key does not exist', () => {
      handleCommand('LRANGE key 0 1', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
    });

    it('should throw error if key is not a list', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('LRANGE key 0 1', commandHandlers);
      expect(consoleSpy.calledWith('Value is not a list')).to.be.true;
    });

    it('should throw error if start or stop is not a number', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key a 1', commandHandlers);
      expect(consoleSpy.calledWith('Invalid start or stop argument')).to.be.true;
    });

    it('should return indexed from left side', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key 0 2', commandHandlers);
      expect(consoleSpy.calledWith('1) value3')).to.be.true;
      expect(consoleSpy.calledWith('2) value2')).to.be.true;
      expect(consoleSpy.calledWith('3) value1')).to.be.true;
    });

    it('should accept negative start single value', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key -2 1', commandHandlers);
      expect(consoleSpy.calledWith('1) value2')).to.be.true;
    });

    it('should accept negative start multiple value', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key -3 1', commandHandlers);
      expect(consoleSpy.calledWith('1) value3')).to.be.true;
      expect(consoleSpy.calledWith('2) value2')).to.be.true;
    });

    it('should return null if start is greater than stop', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key 1 0', commandHandlers);
      expect(consoleSpy.neverCalledWith()).to.be.true;
    });

    it('should return empty list if start is greater than list length', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key 3 4', commandHandlers);
      expect(consoleSpy.neverCalledWith()).to.be.true;
    });

    it('should set stop to end of list if greater than list length', () => {
      store.lpush({ key: 'key', values: ['value1', 'value2', 'value3'] });
      handleCommand('LRANGE key 1 4', commandHandlers);
      expect(consoleSpy.calledWith('1) value2')).to.be.true;
      expect(consoleSpy.calledWith('2) value1')).to.be.true;
    });
  });

  describe('HSET', () => {
    it('should call store.hset', () => {
      handleCommand('HSET key field1 value1 field2 value2', commandHandlers);
      expect(store.hget({ key: 'key', field: 'field1' })).to.equal('value1');
      expect(store.hget({ key: 'key', field: 'field2' })).to.equal('value2');
      expect(consoleSpy.calledWith(2)).to.be.true;
    });

    it('should create new hash if key does not exist', () => {
      handleCommand('HSET key field value', commandHandlers);
      expect(store.hget({ key: 'key', field: 'field' })).to.equal('value');
      expect(consoleSpy.calledWith(1)).to.be.true;
    });

    it('should throw error if key is not a hash', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('HSET key field value', commandHandlers);
      expect(consoleSpy.calledWith('Value is not a hash')).to.be.true;
    });

    it('should overwrite duplicate fields', () => {
      handleCommand('HSET key field value1 field value2', commandHandlers);
      expect(store.hget({ key: 'key', field: 'field' })).to.equal('value2');
      expect(consoleSpy.calledWith(1)).to.be.true;
    });

    it('should overwrite existing fields in hash', () => {
      handleCommand('HSET key field value', commandHandlers);
      handleCommand('HSET key field value1', commandHandlers);
      expect(store.hget({ key: 'key', field: 'field' })).to.equal('value1');
      expect(consoleSpy.calledWith(1)).to.be.true;
    });
  });

  describe('HGET', () => {
    it('should call store.hget', () => {
      store.hset({ key: 'key', fields: { field: 'value' } });
      handleCommand('HGET key field', commandHandlers);
      expect(consoleSpy.calledWith('value')).to.be.true;
    });

    it('should return null if key does not exist', () => {
      handleCommand('HGET key field', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
    });

    it('should throw error if key is not a hash', () => {
      store.set({ key: 'key', value: 'value' });
      handleCommand('HGET key field', commandHandlers);
      expect(consoleSpy.calledWith('Value is not a hash')).to.be.true;
    });

    it('should return null if field does not exist', () => {
      store.hset({ key: 'key', fields: { field: 'value' } });
      handleCommand('HGET key field1', commandHandlers);
      expect(consoleSpy.calledWith(null)).to.be.true;
    });
  });
});
