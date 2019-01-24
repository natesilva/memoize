import * as crypto from 'crypto';

function getClassName(target: any) {
  return (typeof target === 'function' && target.name) || target.constructor.name;
}

export default function makeCacheKey(target: any, functionName: string, args: any[]) {
  const keyHash = crypto.createHash('sha1');
  const className = getClassName(target);

  keyHash.update('memoizer-key-v1');
  keyHash.update(className);
  keyHash.update(functionName);

  if (args.length === 0) {
    keyHash.update('__defaultKey');
  } else {
    keyHash.update(JSON.stringify(args));
  }

  return keyHash.digest('hex');
}
