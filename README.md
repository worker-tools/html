# Worker HTML

[HTML templating](#html-templating) and [streaming response](#streaming-responses) library for [Worker Runtimes](https://workers.js.org) such as Cloudflare Workers.


## HTML Templating

Templating is done purely in JavaScript using tagged template strings, inspired by [hyperHTML](https://github.com/WebReflection/hyperhtml) and [lit-html](https://github.com/polymer/lit-html). 

This library is using tagged template strings to create _streaming response bodies_ on the fly,
using no special template syntax and giving you the full power of JS for composition. 

### Examples
String interpolation works just like regular template strings,
but all content is sanitized by default:

```ts
const helloWorld = 'Hello World!';
const h1El = html`<h1>${helloWorld}</h1>`;
```

What is known as "partials" in string-based templating libraries are just functions here:

```ts
const timeEl = (ts = new Date()) => html`
  <time datetime="${ts.toISOString()}">${ts.toLocalString()}</time>
`;
```

What is known as "layouts" are just functions as well:

```ts
const baseLayout = (title: string, content: HTMLContent) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body>${content}</body>
  </html>
`;
```

Layouts can "inherit" from each other, again using just functions:

```ts
const pageLayout = (title: string, content: HTMLContent) => baseLayout(title, html`
  <main>
    ${content}
    <footer>Powered by @worker-tools/html</footer>
  </main>
`);
```

Many more features of string-based templating libraries can be replicated using functions.
Most satisfying should be the use of `map` to replace a whole host of custom looping syntax:

```ts
html`<ul>${['Foo', 'Bar', 'Baz'].map(x => html`<li>${x}</li>`)}</ul>`;
```

Putting it all together:

```ts
function handleRequest(event: FetchEvent) {
  const page = pageLayout(helloWorld, html`
    ${h1El}
    <p>The current time is ${timeEl()}.</p>
    <ul>${['Foo', 'Bar', 'Baz'].map(x => html`<li>${x}</li>`)}</ul>
  `));

  return new HTMLResponse(page);
}

self.addEventListener('fetch', ev => ev.respondWith(handleRequest(ev)));
```

Note that this works regardless of worker runtime: Cloudflare Workers, Service Workers in the browser, and hopefully other [Worker Runtimes](https://workers.js.org) that have yet to be implemented.

### Tooling
Since the use of tagged string literals for HTML is not new (see hyperHTML, lit-html), there exists tooling for syntax highlighting, such as [`lit-html` in VSCode](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html).


## Streaming Responses

As a side effect of this approach, responses are streams by default. This means you can use async data, without delaying sending the headers and HTML content. 

In the example below, everything up to and including `<p>The current time is` will be sent immediately, with the reset sent after the API request completes:

```ts
function handleRequest(event: FetchEvent) {
  // NOTE: No `await` here!
  const timeElPromise = fetch('https://time.api/now')
    .then(r => r.text())
    .then(t => timeEl(new Date(t)));

  return new HTMLResponse(pageLayout('Hello World!', html`
    <h1>Hello World!</h1>
    <p>The current time is ${timeElPromise}.</p>
  `));
}
```

While there's ways around the lack of async/await in the above example (namely IIAFEs), @worker-tools/html supports passing async functions as html content directly:

```ts
function handleRequest(event: FetchEvent) {
  return new HTMLResponse(pageLayout('Hello World!', html`
    <h1>Hello World!</h1>
    ${async () => {
      const timeStamp = new Date(
        await fetch('https://time.api/now').then(r => r.text())
      );
      return html`<p>The current time is ${timeEl(timeStamp)}.</p>`
    }}
  `));
}
```

Note that there are some subtle differences compared to the earlier examples. 
- The initial response will include headers and html up to and including `<h1>Hello World!</h1>`
- The time API request will not be sent until the headers and html up to and including `<h1>Hello World!</h1>` have hit the wire.

These follow from the way async/await works, so shouldn't be too surprising to those already familiar with common async/await pitfalls.

If for any reason you don't want to use streaming response bodies, you can use the `BufferedHTMLResponse` instead, which will buffer the entire body before releasing it to the network.

## See Other
You can combine this library with tools from the [Worker Tools family](https://workers.tolls) such as `@worker-tools/response-creators`:

```ts
import { internalServerError } from '@worker-tools/response-creators';

function handleRequest(event: FetchEvent) {
  return new HTMLResponse(
    pageLayout('Ooops', html`<h1>Something went wrong</h1>`), 
    internalServerError(),
  );
}
```

You can also see the [Worker News source code](https://github.com/worker-tools/worker-news) for an example of how to build an entire web app on the edge using Worker HTML.

Finally, you can read [The Joys and Perils of Writing Plain Old Web Apps](https://qwtel.com/posts/software/the-joys-and-perils-of-writing-plain-old-web-apps/) for a personal account of building web apps in a Web 2.0 way.

--------

<center>
  <a href="https://workers.tools"><img src="https://workers.tools/assets/img/logo.svg" width="100" height="100" /></a>
  <h2>Part of <a href="https://workers.tools">Worker Tools</a></h2>
  <p><small>This module is part of the Worker Tools collection.</small><br/>⚙</p>
</center>

Worker Tools are a collection of TypeScript libraries for writing web servers in [Worker Runtimes](https://workers.js.org) such as Cloudflare Workers, Deno Deploy and Service Workers. 

If you liked this module, you might also like:

- 🧭 [__Worker Router__][router] --- Complete routing solution that works across CF Workers, Deno and Service Workers
- 🔋 [__Worker Middleware__][middleware] --- A suite of standalone HTTP server-side middleware with TypeScript support
- 📄 [__Worker HTML__][html] --- HTML templating and streaming response library
- 📦 [__Storage Area__][kv-storage] --- Key-value store abstraction across [Cloudflare KV][cloudflare-kv-storage], [Deno][deno-kv-storage] and browsers.
- 🆗 [__Response Creators__][response-creators] --- Factory functions for responses with pre-filled status and status text
- 🎏 [__Stream Response__][stream-response] --- Use async generators to build streaming responses for SSE, etc...
- 🥏 [__JSON Fetch__][json-fetch] --- Drop-in replacements for Fetch API classes with first class support for JSON.
- 🦑 [__JSON Stream__][json-stream] --- Streaming JSON parser/stingifier with first class support for web streams.

Worker Tools also includes a number of polyfills that help bridge the gap between Worker Runtimes:
- ✏️ [__HTML Rewriter__][html-rewriter] --- Cloudflare's HTML Rewriter for use in Deno, browsers, etc...
- 📍 [__Location Polyfill__][location-polyfill] --- A `Location` polyfill for Cloudflare Workers.
- 🦕 [__Deno Fetch Event Adapter__][deno-fetch-event-adapter] --- Dispatches global `fetch` events using Deno’s native HTTP server.

[router]: https://workers.tools/router
[middleware]: https://workers.tools/middleware
[html]: https://workers.tools/html
[kv-storage]: https://workers.tools/kv-storage
[cloudflare-kv-storage]: https://workers.tools/cloudflare-kv-storage
[deno-kv-storage]: https://workers.tools/deno-kv-storage
[kv-storage-polyfill]: https://workers.tools/kv-storage-polyfill
[response-creators]: https://workers.tools/response-creators
[stream-response]: https://workers.tools/stream-response
[json-fetch]: https://workers.tools/json-fetch
[json-stream]: https://workers.tools/json-stream
[request-cookie-store]: https://workers.tools/request-cookie-store
[extendable-promise]: https://workers.tools/extendable-promise
[html-rewriter]: https://workers.tools/html-rewriter
[location-polyfill]: https://workers.tools/location-polyfill
[deno-fetch-event-adapter]: https://workers.tools/deno-fetch-event-adapter

Fore more visit [workers.tools](https://workers.tools).
