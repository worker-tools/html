import { asyncIterableToStream } from 'https://ghuc.cc/qwtel/whatwg-stream-to-async-iter/index.ts';
import { aMap, aJoin, promiseToAsyncIterable } from './iter.ts';
import type { HTML } from './html.ts';

const isCFWorkers = (<any>self.navigator)?.userAgent?.includes('Cloudflare-Workers')
  || !('TextEncoderStream' in self) 
  || !('ReadableStream' in self) 
  || !('pipeThrough' in ReadableStream.prototype)

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
