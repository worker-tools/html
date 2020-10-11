import { aMap } from './iter';
import { asyncIterableToStream } from './stream-util';
import { HTML } from './html';

export class HTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    super(asyncIterableToStream(html).pipeThrough(new TextEncoderStream()), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}

export class CFWorkersHTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    const encoder = new TextEncoder();
    const htmlGenerator = aMap((str: string) => encoder.encode(str))(html);
    super(asyncIterableToStream(htmlGenerator), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}
