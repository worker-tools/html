import { StreamResponse, BufferedResponse } from 'https://ghuc.cc/worker-tools/stream-response/index.ts';
import { HTML } from './html.ts';

/**
 * TBD
 */
export class HTMLResponse extends StreamResponse {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, init?: ResponseInit) {
    super(html, init);
    if (!this.headers.has('content-type'))
      this.headers.set('Content-Type', HTMLResponse.contentType);
  }
}

/**
 * If for any reason you don't want to use streaming response bodies, 
 * you can use this class instead, which will buffer the entire body before releasing it to the network.
 * Note that headers will still be sent immediately.
 */
export class BufferedHTMLResponse extends BufferedResponse {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, init?: ResponseInit) {
    super(html, init);
    if (!this.headers.has('content-type'))
      this.headers.set('content-type', BufferedHTMLResponse.contentType);
  }
}
