import { filterXSS } from 'xss';

type Repeatable<T> = T | T[];
type Awaitable<T> = T | Promise<T>;
type Callable<T> = T | (() => T);
type DataTypes = undefined | boolean | number | string | BigInt | Symbol;

type Renderable = null | DataTypes | HTML | UnsafeHTML | Fallback;
type Content = Repeatable<Awaitable<Repeatable<Renderable>>>;
export type HTMLContent = Callable<Content>;

async function* unpackContent(content: Content): AsyncIterableIterator<string> {
  const x = await content;
  if (Array.isArray(x)) for (const xi of x) yield* unpackContent(xi);
  else if (x instanceof HTML) yield* x;
  else if (x instanceof UnsafeHTML) yield x.value;
  else if (x instanceof Fallback) try {
    yield* unpack(x.content)
  } catch (e) {
    yield* typeof x.fallback === 'function'
      ? x.fallback(e)
      : x.fallback;
  }
  else yield filterXSS(x as string);
}

async function* unpack(content: HTMLContent): AsyncIterableIterator<string> {
  try {
    yield* unpackContent(typeof content === 'function' ? content() : content);
  } catch (err) {
    if (err instanceof HTML) yield* err;
    else throw err;
  }
}

export class HTML {
  strings: TemplateStringsArray;
  args: HTMLContent[];

  constructor(strings: TemplateStringsArray, args: HTMLContent[]) {
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

  // [Symbol.asyncIterator]() {
  //   return aInterleaveFlattenSecond(this.strings, map(aHelper)(this.args));
  // }
}

export function html(strings: TemplateStringsArray, ...args: HTMLContent[]) {
  return new HTML(strings, args);
}

export { html as css }

export class UnsafeHTML {
  value: string;
  constructor(value: string) { this.value = value }
  toString() { return this.value }
  toJSON() { return this.value }
}

export class Fallback {
  content: HTMLContent;
  fallback: HTML | ((e: any) => HTML);
  constructor(content: HTMLContent, fallback: HTML | ((e: any) => HTML)) {
    this.content = content;
    this.fallback = fallback;
  }
}

export function fallback(content: HTMLContent, fallback: HTML | ((e: any) => HTML)) {
  return new Fallback(content, fallback);
}

export function unsafeHTML(content: string) {
  return new UnsafeHTML(content);
}
