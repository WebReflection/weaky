const proxies = new WeakMap;
const handler = {};

for (const key of Reflect.ownKeys(Reflect)) {
  const method = Reflect[key];
  handler[key] = key === 'get' || key === 'set' ?
    // proxy as receiver is trouble with get / set
    // @see https://es.discourse.group/t/reflect-set-args-receiver-throwing-for-no-reason/2462
    ((target, ...rest) => method(target.deref(), ...rest.slice(0, -1))) :
    ((target, ...rest) => method(target.deref(), ...rest))
  ;
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
export const proxy = value => {
  const wr = new WeakRef(value);
  const proxy = new Proxy(wr, handler);
  proxies.set(proxy, wr);
  return proxy;
};

/**
 * @template T
 * @param {T} proxy
 * @returns {T | undefined}
 */
export const deref = proxy => proxies.get(proxy)?.deref();
