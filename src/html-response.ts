import { asyncIterableToStream } from 'whatwg-stream-to-async-iter';
import { aMap } from './iter';
import { HTML } from './html';

export class HTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    if (typeof TextEncoderStream !== 'undefined') {
      super(asyncIterableToStream(html).pipeThrough(new TextEncoderStream()), init);
    } else {
      const encoder = new TextEncoder();
      const htmlGenerator = aMap((str: string) => encoder.encode(str))(html);
      super(asyncIterableToStream(htmlGenerator), init);
    }
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}

export { HTMLResponse as CFWorkersHTMLResponse }
