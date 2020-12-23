import { asyncIterableToStream } from 'whatwg-stream-to-async-iter';
import { aMap } from './iter';
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
    // Since this class is for HTML responses  and `TextEncoder` only supports UTF-8, 
    // we can set this header reliably:
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}

/** @deprecated Keep around for backwards compatibility */
export class CFWorkersHTMLResponse extends HTMLResponse {}
