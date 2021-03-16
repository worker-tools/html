if (!('TextEncoderStream' in self)) {
  class TES {
    encoder!: TextEncoder;
    start() { this.encoder = new TextEncoder() }
    transform(chunk: string, controller: TransformStreamDefaultController<Uint8Array>) {
      controller.enqueue(this.encoder.encode(chunk))
    }
  }

  class JSTextEncoderStream extends TransformStream<string, Uint8Array> {
    #t: TES;
    // @ts-ignore
    constructor() {
      let t = new TES();
      super(t);
      this.#t = t;
    }
    get encoding() { return this.#t.encoder.encoding }
  }

  Object.defineProperty(self, 'TextEncoderStream', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: JSTextEncoderStream,
  });
}

if (!('TextDecoderStream' in self)) {
  class TDS {
    decoder!: TextDecoder;
    encoding: string;
    options: TextDecoderOptions;
    constructor(encoding: string, options: TextDecoderOptions) {
      this.encoding = encoding;
      this.options = options;
    }
    start() { this.decoder = new TextDecoder(this.encoding, this.options) }
    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<string>) {
      controller.enqueue(this.decoder.decode(chunk, { stream: true }))
    }
  }

  class JSTextDecoderStream extends TransformStream<Uint8Array, string> {
    #t: TDS;
    // @ts-ignore
    constructor(encoding = 'utf-8', { ...options } = {}) {
      let t = new TDS(encoding, options);
      super(t);
      this.#t = t;
    }
    get encoding() { return this.#t.decoder.encoding }
    get fatal() { return this.#t.decoder.fatal }
    get ignoreBOM() { return this.#t.decoder.ignoreBOM }
  }

  Object.defineProperty(self, 'TextDecoderStream', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: JSTextDecoderStream,
  });
}