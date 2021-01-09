import { filterXSS } from 'xss';
// import { aInterleaveFlattenSecond, map } from './iter';

type Repeatable<T> = T | T[];
type Awaitable<T> = T | Promise<T>;
type Callable<T> = T | (() => T);
type Primitive = undefined | boolean | number | string | BigInt | Symbol;

type Renderable = null | Primitive | HTML | UnsafeHTML | Fallback;
type HTMLContentStatic = Repeatable<Awaitable<Repeatable<Renderable>>>;
export type HTMLContent = Callable<HTMLContentStatic>;

async function* unpackContent(content: HTMLContentStatic): AsyncIterableIterator<string> {
  const x = await content;
  if (Array.isArray(x)) for (const xi of x) yield* unpackContent(xi);
  else if (x instanceof Unpackable) yield* x;
  else yield filterXSS(x as string); // relying on string coercion for primitives within the xss module here
}

async function* unpack(content: HTMLContent): AsyncIterableIterator<string> {
  try {
    yield* unpackContent(typeof content === 'function' ? content() : content);
  } catch (err) {
    if (err instanceof HTML) yield* err;
    else throw err;
  }
}

abstract class Unpackable {
  abstract [Symbol.asyncIterator](): AsyncIterableIterator<string>;
}

export class HTML extends Unpackable {
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
      const { done: stringDone, value: string } = stringsIt.next();
      if (stringDone) break;
      else yield string;

      const { done: argDone, value: arg } = argsIt.next();
      if (argDone) break;
      else yield* unpack(arg);
    }
  }

  // async *[Symbol.asyncIterator]() {
  //   return aInterleaveFlattenSecond(this.strings, map(unpack)(this.args));
  // }
}

export class UnsafeHTML extends Unpackable {
  value: string;
  constructor(value: string) { super(); this.value = value }
  async *[Symbol.asyncIterator]() { yield this.value }
  toString() { return this.value }
  toJSON() { return this.value }
}

export class Fallback extends Unpackable {
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
