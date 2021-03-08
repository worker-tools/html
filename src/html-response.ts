import '../vendor/text-encode-transform.js'
import { asyncIterableToStream } from 'whatwg-stream-to-async-iter';

import { aJoin, promiseToAsyncIterable } from './iter';
import { HTML } from './html';

export class HTMLResponse extends Response {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, init?: ResponseInit) {
    super(asyncIterableToStream(html).pipeThrough(new TextEncoderStream()), init);
    this.headers.set('Content-Type', HTMLResponse.contentType);
  }
}

/** @deprecated You can now use HTMLResponse in Cloudflare Workers */
export class CFWorkersHTMLResponse extends HTMLResponse {}

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
