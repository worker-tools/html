if (!('TextEncoderStream' in self)) {
  class TES {
    encoder!: TextEncoder;
    start() { this.encoder = new TextEncoder() }
    transform(chunk: string, controller: TransformStreamDefaultController<Uint8Array>) {
      controller.enqueue(this.encoder.encode(chunk))
    }
  }

  let t: TES;
  class JSTextEncoderStream extends TransformStream {
    #t: TES;
    constructor() {
      super(t = new TES());
      this.#t = t;
    }
    get encoding() { return this.#t.encoder.encoding }
  }

  self.TextEncoderStream = JSTextEncoderStream;
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

  let t: TDS;
  class JSTextDecoderStream extends TransformStream {
    #t: TDS;
    constructor(encoding = 'utf-8', { ...options } = {}) {
      super(t = new TDS(encoding, options));
      this.#t = t;
    }
    get encoding() { return this.#t.decoder.encoding }
    get fatal() { return this.#t.decoder.fatal }
    get ignoreBOM() { return this.#t.decoder.ignoreBOM }
  }

  self.TextDecoderStream = JSTextDecoderStream;
}