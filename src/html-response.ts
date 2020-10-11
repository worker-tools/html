import { aMap } from './iter';
import { asyncIterable2Stream } from './stream-util';
import { HTML } from './html';

export class HTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    super(asyncIterable2Stream(html).pipeThrough(new TextEncoderStream()), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}

export class CFWorkersHTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    const encoder = new TextEncoder();
    const htmlGenerator = aMap((str: string) => encoder.encode(str))(html);
    super(asyncIterable2Stream(htmlGenerator), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}
