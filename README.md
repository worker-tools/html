# @werker/html

[HTML templating](#html-templating) and [streaming response](#streaming-responses) library for Service Worker-like environments such as Cloudflare Workers.


## HTML Templating

Templating is done purely in JavaScript using tagged template strings, inspired by [hyperHTML](https://github.com/WebReflection/hyperhtml) and [lit-html](https://github.com/polymer/lit-html). 

This library is using the way tagged template strings work to create streaming response bodies on the fly,
using no special template syntax and giving you the full power of JS for composition. 

String interpolation works just like regular template strings,
but all content is sanitized by default.

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
    <footer>Powered by @werker/html</footer>
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

Note that this works regardless of worker environment: Cloudflare Workers, Service Workers in the browser, and hopefully other worker environments that have yet to be implemented.

Since the use of tagged string literals for HTML is not new (see above), there exists tooling for syntax highlighting, such as [`lit-html` in VSCode](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html).


## Streaming Responses

As a side effect of this approach, responses are streams by default. This means you can use async data, without delaying sending the headers and HTML content. 

In this example, everything up to and including `<p>The current time is` will be sent immediately:

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

While there's ways around the lack of async/await in the above example (namely IIAFEs), @werker/html supports passing async functions as html content directly:

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

Note that there are some subtle differences here (these follow from the way async/await works):
- The initial response will include headers and html up to and including `<h1>Hello World!</h1>`
- The time API request will not be sent until the headers and html up to and including `<h1>Hello World!</h1>` have hit the wire.

If for any reason you don't want to use streaming response bodies, you can import the `BufferedHTMLResponse` instead, which will buffer the entire body before releasing it to the network.

## See Other
You can combine this library with tools from the [@werker family of tools](https://github.com/worker-utils) such as `@werker/response-creators`:

```ts
import { internalServerError } from '@werker/response-creators';

function handleRequest(event: FetchEvent) {
  return new HTMLResponse(
    pageLayout('Ooops', html`<h1>Something went wrong</h1>`), 
    internalServerError(),
  );
}
```

You can also see the [Clap Button Worker](https://github.com/getclaps/worker) source code for an example of how to build an entire web app on the edge using Cloudflare Workers and @werker tools, including @werker/html.

Finally, you can read [The Joys and Perils of Writing Plain Old Web Apps](https://qwtel.com/posts/software/the-joys-and-perils-of-writing-plain-old-web-apps/) for a personal account of building web apps in a Web 2.0 way. 
