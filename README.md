# weaky

<sup>**Social Media Photo by [Igor Dresjan A.P.](https://unsplash.com/@igordresjan) on [Unsplash](https://unsplash.com/)**</sup>


An easy way to avoid leaks.

### Example

```js
import { signal, effect } from 'https://esm.run/@preact/signals';
import { proxy, deref } from 'https://esm.run/weaky';

const fr = new FinalizationRegistry(cleanup => {
  console.log('cleaning up the effect');
  cleanup();
});

function Button(value) {
  const counter = signal(value);

  const button = Object.assign(
    document.createElement('button'),
    { onclick() { counter.value++ } }
  );

  // avoid retaining the `node` reference within the effect
  // because it would prevent GC from collecting the button
  // because such button will be referenced as parentNode
  const node = proxy(document.createTextNode(''));

  // use deref(proxy(value)) to get the original value
  button.append(deref(node));

  // cleanup the effect when the button is removed from the DOM
  fr.register(button, effect(() => {
    // forward operations to the internal reference
    // if that's still alive
    node.data = counter.value;
  }));

  return button;
}

// test one or thousand components
let [zero, one, two] = [Button(0), Button(1), Button(2)];
document.body.append(zero, one, two);

// test cleanup in a second (requires GC to kick in)
setTimeout(() => { one = one.remove() }, 1000);
```
