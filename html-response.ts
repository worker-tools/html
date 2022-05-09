import { StreamResponse, BufferedStreamResponse } from 'https://ghuc.cc/worker-tools/stream-response/index.ts';
import { HTML } from './html.ts';

const CONTENT_TYPE = 'Content-Type'

/**
 * TBD
 */
export class HTMLResponse extends StreamResponse {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, { headers: _headers, ...init }: ResponseInit = {}) {
    const headers = new Headers(_headers);
    if (!headers.has(CONTENT_TYPE)) headers.set(CONTENT_TYPE, HTMLResponse.contentType);
    super(html, { headers, ...init });
  }
}

/**
 * If for any reason you don't want to use streaming response bodies, 
 * you can use this class instead, which will buffer the entire body before releasing it to the network.
 * Note that headers will still be sent immediately.
 */
export class BufferedHTMLResponse extends BufferedStreamResponse {
  static contentType = 'text/html;charset=UTF-8';

  constructor(html: HTML, { headers: _headers, ...init }: ResponseInit = {}) {
    const headers = new Headers(_headers);
    if (!headers.has(CONTENT_TYPE)) headers.set(CONTENT_TYPE, BufferedHTMLResponse.contentType);
    super(html, { headers, ...init });
  }
}
