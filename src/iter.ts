type Awaitable<T> = T | Promise<T>;
type ForOfAwaitable<T> = Iterable<T> | AsyncIterable<T>;

/**
 * Alternates items from the first and second iterable in the output iterable, until either input runs out of items.
 */
export function* interleave<X, Y>(xs: Iterable<X>, ys: Iterable<Y>): IterableIterator<X | Y> {
  const itx = xs[Symbol.iterator]();
  const ity = ys[Symbol.iterator]();
  while (true) {
    const rx = itx.next();
    if (rx.done) break;
    else yield rx.value;
    const ry = ity.next();
    if (ry.done) break;
    else yield ry.value;
  }
}

/**
 * It's like interleave, but will flatten items of the second (async) iterable.
 */
export async function* aInterleaveFlattenSecond<X, Y>(xs: Iterable<X>, ys: Iterable<AsyncIterable<Y>>): AsyncIterableIterator<X | Y> {
  const itx = xs[Symbol.iterator]();
  const ity = ys[Symbol.iterator]();
  while (true) {
    const rx = itx.next();
    if (rx.done) break;
    else yield rx.value;
    const ry = ity.next();
    if (ry.done) break;
    else yield* ry.value;
  }
}

export function map<A, B>(f: (a: A) => B) {
  return function* (iterable: Iterable<A>): IterableIterator<B> {
    for (const x of iterable) yield f(x);
  };
}

export function aMap<A, B>(f: (a: A) => Awaitable<B>) {
  return async function* (iterable: ForOfAwaitable<A>): AsyncIterableIterator<B> {
    for await (const x of iterable) yield f(x);
  };
}

export function join(iterable: Iterable<string>): string {
  return [...iterable].join('');
}

export async function aJoin(iterable: ForOfAwaitable<string>): Promise<string> {
  const chunks = [];
  for await (const x of iterable) chunks.push(x);
  return chunks.join('');
}

export async function* promiseToAsyncIterable<T>(promise: Promise<T>): AsyncIterableIterator<T> {
  yield await promise;
}
