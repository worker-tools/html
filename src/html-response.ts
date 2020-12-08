import { asyncIterableToStream } from 'whatwg-stream-to-async-iter';
import { aMap } from './iter';
import { HTML } from './html';

class TextEncoderStreamHTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    super(asyncIterableToStream(html).pipeThrough(new TextEncoderStream()), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}

export class MapTextEncodeHTMLResponse extends Response {
  constructor(html: HTML, init?: ResponseInit) {
    const encoder = new TextEncoder();
    const htmlGenerator = aMap((str: string) => encoder.encode(str))(html);
    super(asyncIterableToStream(htmlGenerator), init);
    this.headers.set('Content-Type', 'text/html;charset=UTF-8');
  }
}

export const HTMLResponse = typeof TextEncoderStream !== 'undefined'
  ? TextEncoderStreamHTMLResponse
  : MapTextEncodeHTMLResponse;

export { MapTextEncodeHTMLResponse as CFWorkersHTMLResponse }
