import './text-encoder-stream-polyfill';
import { asyncIterableToStream } from 'whatwg-stream-to-async-iter';
import { aMap, aJoin, promiseToAsyncIterable } from './iter';
import { HTML } from './html';

// Other worker envs don't provide the `default` key in caches, so we use it to distinguish CF Workers.
const isCFWorkers = !('TextEncoderStream' in self)

class DefaultHTMLResponse extends Response {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, init?: ResponseInit) {
    super(asyncIterableToStream(html).pipeThrough(new TextEncoderStream()), init);
    this.headers.set('Content-Type', DefaultHTMLResponse.contentType);
  }
}

export class CFWorkersHTMLResponse extends Response {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, init?: ResponseInit) {
    const encoder = new TextEncoder();
    const encode = aMap<string, Uint8Array>(x => encoder.encode(x));
    super(asyncIterableToStream(encode(html)), init);
    this.headers.set('Content-Type', CFWorkersHTMLResponse.contentType);
  }
}

// CF Workers doesn't support non-binary Transform Streams, 
// so we use a version that does the byte encoding in a async iterator instead:
export const HTMLResponse: typeof DefaultHTMLResponse = isCFWorkers
  ? CFWorkersHTMLResponse
  : DefaultHTMLResponse;

/**
 * If for any reason you don't want to use streaming response bodies, 
 * you can use this class instead, which will buffer the entire body before releasing it to the network.
 * Note that headers will still be sent immediately.
 */
export class BufferedHTMLResponse extends Response {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, init?: ResponseInit) {
    const bufferedHTML = aJoin(html).then(str => new TextEncoder().encode(str));
    super(asyncIterableToStream(promiseToAsyncIterable(bufferedHTML)), init);
    this.headers.set('Content-Type', BufferedHTMLResponse.contentType);
  }
}
