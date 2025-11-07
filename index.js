const proxies = new WeakMap;
const handler = {};

for (const key of Reflect.ownKeys(Reflect)) {
  handler[key] = key === 'set' ?
    // proxy as receiver is trouble with set
    ((target, prop, value) => Reflect.set(target.deref(), prop, value)) :
    ((target, ...rest) => Reflect[key](target.deref(), ...rest))
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
