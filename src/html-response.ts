import { asyncIterableToStream } from 'whatwg-stream-to-async-iter';
import { aMap, aBuffer } from './iter';
import { HTML } from './html';

export class HTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    if (typeof TextEncoderStream !== 'undefined') {
      super(asyncIterableToStream(html).pipeThrough(new TextEncoderStream()), init);
    } else {
      // If `TextEncoderStream` is not available, we can use an asynchronous map 
      // to pass strings to a text encoder on demand.
      const encoder = new TextEncoder();
      const textEncoderGenerator = aMap((str: string) => encoder.encode(str));
      super(asyncIterableToStream(textEncoderGenerator(html)), init);
    }
    // Since this class is for HTML responses only, and `TextEncoder` only supports UTF-8, 
    // we can set this header reliably:
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
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
  constructor(html: HTML, init?: ResponseInit) {
    const bufferedHTML = aBuffer(html);
    const textEncoderGenerator = aMap((str: string) => new TextEncoder().encode(str));
    super(asyncIterableToStream(textEncoderGenerator(bufferedHTML)), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}
