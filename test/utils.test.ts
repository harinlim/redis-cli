import { expect } from 'chai';
import sinon from 'sinon';

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

describe('parseSetParams', () => {
  it('should return SetParams object if correct', () => {
    expect(parseSetParams(['SET', '1', '2'])).to.eql({ key: '1', value: '2' });
  });

  it('should throw error if less than 2 args', () => {
    expect(() => parseSetParams(['SET', '1'])).to.throw('SET requires at least 2 arguments');
  });

  it('should throw error if invalid arg', () => {
    expect(() => parseSetParams(['SET', '1', '2', '3'])).to.throw('Invalid argument: 3');
  });

  it('should succeed with lowercase', () => {
    expect(parseSetParams(['set', '1', '2', 'keepttl'])).to.eql({
      key: '1',
      value: '2',
      keepTtl: true,
    });
  });

  it('should return SetParams object if correct with ttl', () => {
    expect(parseSetParams(['SET', '1', '2', 'EX', '1'])).to.eql({
      key: '1',
      value: '2',
      ttl: 1000,
    });
  });

  it('should return SetParams object if correct with px', () => {
    expect(parseSetParams(['SET', '1', '2', 'PX', '1000'])).to.eql({
      key: '1',
      value: '2',
      ttl: 1000,
    });
  });

  it('should return SetParams object if correct with get', () => {
    expect(parseSetParams(['SET', '1', '2', 'GET'])).to.eql({ key: '1', value: '2', get: true });
  });

  it('should return SetParams object if correct with keepttl', () => {
    expect(parseSetParams(['SET', '1', '2', 'KEEPTTL'])).to.eql({
      key: '1',
      value: '2',
      keepTtl: true,
    });
  });

  it('should return SetParams object if correct with nx', () => {
    expect(parseSetParams(['SET', '1', '2', 'NX'])).to.eql({ key: '1', value: '2', nx: true });
  });

  it('should return SetParams object if correct with xx', () => {
    expect(parseSetParams(['SET', '1', '2', 'XX'])).to.eql({ key: '1', value: '2', xx: true });
  });

  it('should return SetParams object if correct with all options', () => {
    expect(parseSetParams(['SET', '1', '2', 'NX', 'EX', '1', 'GET'])).to.eql({
      key: '1',
      value: '2',
      nx: true,
      ttl: 1000,
      get: true,
    });
  });

  it('should throw error if no expiration time with EX', () => {
    expect(() => parseSetParams(['SET', '1', '2', 'EX'])).to.throw('Invalid expiration time');
  });

  it('should throw error if invalid EX expiration time', () => {
    expect(() => parseSetParams(['SET', '1', '2', 'EX', 'a'])).to.throw('Invalid expiration time');
  });

  it('should throw error if no expiration time with PX', () => {
    expect(() => parseSetParams(['SET', '1', '2', 'PX'])).to.throw('Invalid expiration time');
  });

  it('should throw error if invalid PX expiration time', () => {
    expect(() => parseSetParams(['SET', '1', '2', 'PX', 'a'])).to.throw('Invalid expiration time');
  });

  it('should throw error if nx and xx used together', () => {
    expect(() => parseSetParams(['SET', '1', '2', 'NX', 'XX'])).to.throw(
      'NX and XX cannot be used together'
    );
  });

  it('should throw error if ex and keepttl used together', () => {
    expect(() => parseSetParams(['SET', '1', '2', 'EX', '1', 'KEEPTTL'])).to.throw(
      'EX/PX and KEEPTTL cannot be used together'
    );
  });
});

describe('parseGetParams', () => {
  it('should return GetParams object if correct', () => {
    expect(parseGetParams(['GET', '1'])).to.eql('1');
  });

  it('should throw error if less than 1 arg', () => {
    expect(() => parseGetParams(['GET'])).to.throw('GET requires 1 argument');
  });

  it('should throw error if more than 1 arg', () => {
    expect(() => parseGetParams(['GET', '1', '2'])).to.throw('GET requires 1 argument');
  });
});

describe('parseDeleteParams', () => {
  it('should return DeleteParams object if correct', () => {
    expect(parseDeleteParams(['DEL', '1', '2'])).to.eql({ keys: ['1', '2'] });
  });

  it('should throw error if less than 1 arg', () => {
    expect(() => parseDeleteParams(['DEL'])).to.throw('DEL requires at least 1 argument');
  });
});

describe('parseLpushParams', () => {
  it('should return LPushParams object if correct', () => {
    expect(parseLpushParams(['LPUSH', '1', '2', '3'])).to.eql({ key: '1', values: ['2', '3'] });
  });

  it('should throw error if less than 2 args', () => {
    expect(() => parseLpushParams(['LPUSH', '1'])).to.throw('LPUSH requires at least 2 arguments');
  });
});

describe('parseLpopParams', () => {
  it('should return LPopParams object if correct', () => {
    expect(parseLpopParams(['LPOP', '1', '2'])).to.eql({ key: '1', count: 2 });
  });

  it('should return LPopParams object if correct with default count', () => {
    expect(parseLpopParams(['LPOP', '1'])).to.eql({ key: '1', count: 1 });
  });

  it('should throw error if less than 1 arg', () => {
    expect(() => parseLpopParams(['LPOP'])).to.throw('LPOP requires at least 1 argument');
  });

  it('should throw error if more than 2 args', () => {
    expect(() => parseLpopParams(['LPOP', '1', '2', '3'])).to.throw(
      'LPOP cannot have more than 2 arguments'
    );
  });

  it('should throw error if invalid count arg', () => {
    expect(() => parseLpopParams(['LPOP', '1', 'a'])).to.throw('Invalid count argument');
  });
});

describe('parseLrangeParams', () => {
  it('should return LRangeParams object if correct', () => {
    expect(parseLrangeParams(['LRANGE', '1', '0', '1'])).to.eql({ key: '1', start: 0, stop: 1 });
  });

  it('should throw error if less than 3 args', () => {
    expect(() => parseLrangeParams(['LRANGE', '1', '0'])).to.throw('LRANGE requires 3 arguments');
  });

  it('should throw error if more than 3 args', () => {
    expect(() => parseLrangeParams(['LRANGE', '1', '0', '1', '2'])).to.throw(
      'LRANGE requires 3 arguments'
    );
  });

  it('should throw error if invalid start arg', () => {
    expect(() => parseLrangeParams(['LRANGE', '1', 'a', '1'])).to.throw(
      'Invalid start or stop argument'
    );
  });

  it('should throw error if invalid stop arg', () => {
    expect(() => parseLrangeParams(['LRANGE', '1', '0', 'a'])).to.throw(
      'Invalid start or stop argument'
    );
  });
});

describe('parseHsetParams', () => {
  it('should return HSetParams object if correct', () => {
    expect(parseHsetParams(['HSET', 'hash', '1', '2', '3', '4'])).to.eql({
      key: 'hash',
      fields: { '1': '2', '3': '4' },
    });
  });

  it('should throw error if less than 3 args', () => {
    expect(() => parseHsetParams(['HSET', 'hash', '1'])).to.throw(
      'HSET requires field-value pairs'
    );
  });

  it('should throw error if odd number of args', () => {
    expect(() => parseHsetParams(['HSET', 'hash', '1', '2', '3'])).to.throw(
      'HSET requires field-value pairs'
    );
  });

  it('should overwrite duplicates', () => {
    expect(parseHsetParams(['HSET', 'hash', '1', '2', '1', '3'])).to.eql({
      key: 'hash',
      fields: { '1': '3' },
    });
  });
});

describe('parseHgetParams', () => {
  it('should return HGetParams object if correct', () => {
    expect(parseHgetParams(['HGET', 'hash', '1'])).to.eql({ key: 'hash', field: '1' });
  });

  it('should throw error if less than 2 args', () => {
    expect(() => parseHgetParams(['HGET', 'hash'])).to.throw('HGET requires 2 arguments');
  });

  it('should throw error if more than 2 args', () => {
    expect(() => parseHgetParams(['HGET', 'hash', '1', '2'])).to.throw('HGET requires 2 arguments');
  });
});

describe('print', () => {
  let consoleSpy: sinon.SinonSpy;
  beforeEach(() => {
    consoleSpy = sinon.stub(console, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should print string', () => {
    print('string');
    expect(consoleSpy.calledWith('string')).to.be.true;
  });

  it('should print number', () => {
    print(1);
    expect(consoleSpy.calledWith(1)).to.be.true;
  });

  it('should print null', () => {
    print(null);
    expect(consoleSpy.calledWith(null)).to.be.true;
  });

  it('should print array', () => {
    print(['1', '2', '1']);
    expect(consoleSpy.calledThrice).to.be.true;
    expect(consoleSpy.calledWith('1) 1')).to.be.true;
    expect(consoleSpy.calledWith('2) 2')).to.be.true;
  });
});
