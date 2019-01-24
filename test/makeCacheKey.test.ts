import test, { afterEach } from 'ava';
import * as crypto from 'crypto';
import * as td from 'testdouble';
import makeCacheKey from '../src/makeCacheKey';

class ExampleClass {}

afterEach(() => {
  td.reset();
});

test.serial(
  'uses the class name as part of the hash when the target is a class (static methods)',
  t => {
    const mockHash = td.object(['update', 'digest']);
    td.replace(crypto, 'createHash');
    td.when(crypto.createHash('sha1')).thenReturn(mockHash);

    const result = makeCacheKey(ExampleClass, 'the static method name', []);
    td.verify(mockHash.update('ExampleClass'));

    t.pass();
  }
);

test.serial(
  'uses the class name as part of the hash when the target is an instance (instance methods)',
  t => {
    const mockHash = td.object(['update', 'digest']);
    td.replace(crypto, 'createHash');
    td.when(crypto.createHash('sha1')).thenReturn(mockHash);

    const instance = new ExampleClass();

    const result = makeCacheKey(instance, 'the instance method name', []);
    td.verify(mockHash.update('ExampleClass'));

    t.pass();
  }
);

test.serial('uses a static method name as part of the hash', t => {
  const mockHash = td.object(['update', 'digest']);
  td.replace(crypto, 'createHash');
  td.when(crypto.createHash('sha1')).thenReturn(mockHash);

  const result = makeCacheKey(ExampleClass, 'the static method name', []);
  td.verify(mockHash.update('the static method name'));

  t.pass();
});

test.serial('uses an instance method name as part of the hash', t => {
  const mockHash = td.object(['update', 'digest']);
  td.replace(crypto, 'createHash');
  td.when(crypto.createHash('sha1')).thenReturn(mockHash);

  const instance = new ExampleClass();

  const result = makeCacheKey(instance, 'the instance method name', []);
  td.verify(mockHash.update('the instance method name'));

  t.pass();
});

test.serial('uses a default value as part of the hash when no args are passed', t => {
  const mockHash = td.object(['update', 'digest']);
  td.replace(crypto, 'createHash');
  td.when(crypto.createHash('sha1')).thenReturn(mockHash);

  const result = makeCacheKey(ExampleClass, 'the instance method name', []);
  td.verify(mockHash.update('__defaultKey'));

  t.pass();
});

test.serial('includes the args as part of the hash', t => {
  const mockHash = td.object(['update', 'digest']);
  td.replace(crypto, 'createHash');
  td.when(crypto.createHash('sha1')).thenReturn(mockHash);

  /* istanbul ignore next: we never really call the function defined here */
  const args = [() => {}, true, 42, 'some string', ['a', 'b', 'c'], { key: 'value' }];

  const result = makeCacheKey(ExampleClass, 'the static method name', args);
  td.verify(mockHash.update(JSON.stringify(args)));

  t.pass();
});

test.serial('returns the hex digest of the hash', t => {
  const mockHash = td.object(['update', 'digest']);
  td.replace(crypto, 'createHash');
  td.when(crypto.createHash('sha1')).thenReturn(mockHash);
  td.when(mockHash.digest('hex')).thenReturn('the hex digest');

  const result = makeCacheKey(ExampleClass, 'the instance method name', []);
  t.is(result, 'the hex digest');
});

test.serial('includes a versioned string as part of the hash', t => {
  const mockHash = td.object(['update', 'digest']);
  td.replace(crypto, 'createHash');
  td.when(crypto.createHash('sha1')).thenReturn(mockHash);
  td.when(mockHash.digest('hex')).thenReturn('the hex digest');

  const result = makeCacheKey(ExampleClass, 'the instance method name', []);
  td.verify(mockHash.update('memoizer-key-v1'));
  t.pass();
});
