import { escapeHtml } from './escape-html';
// import { aInterleaveFlattenSecond, map } from './iter';

type Primitive = undefined | boolean | number | string | bigint | symbol;
type Callable<T> = T | (() => T);

type Unpackable<T> =
  | T 
  | Iterable<T> 
  | Promise<T> 
  | Promise<Iterable<T>> 
  | Promise<Iterable<Promise<T>>>
  | AsyncIterable<T>
  | Promise<AsyncIterable<T>>

type Renderable = null | Primitive | HTML | UnsafeHTML | Fallback;
type HTMLContentStatic = Unpackable<Renderable>;
export type HTMLContent = Callable<HTMLContentStatic>;

const isIterable = <T>(x?: unknown): x is (object & Iterable<T>) => 
  typeof x === 'object' && x != null && Symbol.iterator in x;

const isAsyncIterable = <T>(x?: unknown): x is (object & AsyncIterable<T>) => 
  typeof x === 'object' && x != null && Symbol.asyncIterator in x;

async function* unpackContent(content: HTMLContentStatic): AsyncIterableIterator<string> {
  const x = await content;
  if (x == null) {/* noop */}
  else if (x instanceof AbstractHTML) yield* x;
  else if (isIterable(x)) for (const xi of x) yield* unpackContent(xi);
  else if (isAsyncIterable(x)) for await (const xi of x) yield* unpackContent(xi);
  else yield escapeHtml(x);
}

async function* unpack(content: HTMLContent): AsyncIterableIterator<string> {
  try {
    yield* unpackContent(typeof content === 'function' ? content() : content);
  } catch (err) {
    if (err instanceof HTML) yield* err;
    else throw err;
  }
}

export abstract class AbstractHTML {
  abstract [Symbol.asyncIterator](): AsyncIterableIterator<string>;
}

export class HTML extends AbstractHTML {
  strings: TemplateStringsArray;
  args: HTMLContent[];

  constructor(strings: TemplateStringsArray, args: HTMLContent[]) {
    super();
    this.strings = strings;
    this.args = args;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
    const stringsIt = this.strings[Symbol.iterator]();
    const argsIt = this.args[Symbol.iterator]();
    while (true) {
      const { done: stringDone, value: string } = stringsIt.next() as IteratorYieldResult<string>;
      if (stringDone) break;
      else yield string;

      const { done: argDone, value: arg } = argsIt.next() as IteratorYieldResult<HTMLContent>;
      if (argDone) break;
      else yield* unpack(arg);
    }
  }

  // async *[Symbol.asyncIterator]() {
  //   return aInterleaveFlattenSecond(this.strings, map(unpack)(this.args));
  // }
}

export class UnsafeHTML extends AbstractHTML {
  value: string;
  constructor(value: string) { super(); this.value = value }
  async *[Symbol.asyncIterator]() { yield this.value }
  toString() { return this.value }
  toJSON() { return this.value }
}

export class Fallback extends AbstractHTML {
  content: HTMLContent;
  fallback: HTML | ((e: any) => HTML);

  constructor(content: HTMLContent, fallback: HTML | ((e: any) => HTML)) {
    super();
    this.content = content;
    this.fallback = fallback;
  }

  async *[Symbol.asyncIterator]() {
    try {
      yield* unpack(this.content)
    } catch (e) {
      yield* typeof this.fallback === 'function'
        ? this.fallback(e)
        : this.fallback
    }
  }
}

export function html(strings: TemplateStringsArray, ...args: HTMLContent[]) {
  return new HTML(strings, args);
}

// For the purpose of generating strings, there is no difference between html and css
// so we can export this alias here to help with syntax highlighting and avoid confusion.
export { html as css, html as js }

export function fallback(content: HTMLContent, fallback: HTML | ((e: any) => HTML)) {
  return new Fallback(content, fallback);
}

export function unsafeHTML(content: string) {
  return new UnsafeHTML(content);
}
