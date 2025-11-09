const proxies = new WeakMap;
const methods = new WeakMap;

const { apply, get, set } = Reflect;

// helps passing the right context to the function
const fn = {
  apply(target, self, args) {
    const type = typeof self;
    return apply(
      target,
      (type === 'object' && self) || type === 'function' ?
        (deref(self) ?? self) : self,
      args
    );
  }
};

// avoid proxy as receiver in both get & set traps
// @see https://es.discourse.group/t/reflect-set-args-receiver-throwing-for-no-reason/2462
const handler = {
  get(target, prop) {
    const value = get(target.deref(), prop);
    // guard proxies as context when p.method() is called
    return typeof value === 'function' ?
      (methods.get(value) ?? guard(value)) : value;
  },
  set: (target, prop, value) => set(target.deref(), prop, value),
};

const guard = method => {
  const proxy = new Proxy(method, fn);
  methods.set(method, proxy);
  return proxy;
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
