const proxies = new WeakMap;
const cbs = new WeakMap;

const { apply, get, set } = Reflect;

const fn = { apply: (t, p, a) => apply(t, (p && deref(p)) ?? p, a) };

const guard = cb => cbs.set(cb, new Proxy(cb, fn)).get(cb);

// proxy as receiver is trouble with get / set
// @see https://es.discourse.group/t/reflect-set-args-receiver-throwing-for-no-reason/2462
const handler = {
  get(target, prop) {
    const r = get(target.deref(), prop);
    return typeof r === 'function' ? (cbs.get(r) ?? guard(r)) : r;
  },
  set: (target, prop, value) => set(target.deref(), prop, value),
};

for (const key of Reflect.ownKeys(Reflect))
  handler[key] ??= ((target, ...rest) => Reflect[key](target.deref(), ...rest));

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
