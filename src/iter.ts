type Awaitable<T> = T | Promise<T>;
type ForAwaitable<T> = Iterable<T> | AsyncIterable<T>;

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
  return async function* (forAwaitable: ForAwaitable<A>): AsyncIterableIterator<B> {
    for await (const x of forAwaitable) yield f(x);
  };
}

export const join = (xs: Iterable<string>) => [...xs].join('');
