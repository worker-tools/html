import 'https://gist.githubusercontent.com/qwtel/b14f0f81e3a96189f7771f83ee113f64/raw/TestRequest.ts'
import {
  assert,
  assertExists,
  assertEquals,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
  assertRejects,
  assertArrayIncludes,
} from 'https://deno.land/std@0.133.0/testing/asserts.ts'
const { test } = Deno;

import { html, HTMLResponse } from '../index.ts'

test('exists', () => {
  assertExists(html)
  assertExists(HTMLResponse)
})

test('exists II', () => {
  assertExists(html`<div></div>`)
  assertExists(new HTMLResponse(html`<div></div>`))
})

test('stringify', async () => {
  assertEquals(await new HTMLResponse(html`<div></div>`).text(), '<div></div>')
})

test('headers', () => {
  assertStringIncludes(new HTMLResponse(html`<div></div>`).headers.get('content-type')!, 'text/html')
})

test('escaping', async () => {
  assertEquals(
    await new HTMLResponse(html`<div>${'<div></div>'}</div>`).text(),
    '<div>&lt;div&gt;&lt;/div&gt;</div>'
  )
})

test('async functions as values', async () => {
  assertEquals(
    await new HTMLResponse(html`<div>${async () => {
      await new Promise(r => setTimeout(r, 10));
      return html`<div></div>`
    }}</div>`).text(),
    '<div><div></div></div>'
  )
})

test('promises as as values', async () => {
  assertEquals(await new HTMLResponse(html`<div>${(async () => {
    await new Promise(r => setTimeout(r, 10));
    return html`<div></div>`
  })()}</div>`).text(), '<div><div></div></div>')
})

const timeout = (n: number) => new Promise(r => setTimeout(r, n))

test('async generator functions as values', async () => {
  assertEquals(await new HTMLResponse(html`<ul>${async function* () {
    await timeout(10);
    yield html`<li>1</li>`
    await timeout(10);
    yield html`<li>2</li>`
  }}</ul>`).text(), '<ul><li>1</li><li>2</li></ul>')
})

test('async generators as values', async () => {
  assertEquals(await new HTMLResponse(html`<ul>${(async function* () {
    await timeout(10);
    yield html`<li>1</li>`
    await timeout(10);
    yield html`<li>2</li>`
  })()}</ul>`).text(), '<ul><li>1</li><li>2</li></ul>')
})

import { unsafeHTML } from '../index.ts'

test('unsafe html', async () => {
  assertEquals(
    await new HTMLResponse(html`<div>${unsafeHTML('<div></div>')}</div>`).text(),
    '<div><div></div></div>'
  )
})

test('multiple interleaved values', async () => {
  assertEquals(
    await new HTMLResponse(html`<div>${html`<span></span>`}<br>${html`<span></span>`}</div>`).text(),
    '<div><span></span><br><span></span></div>'
  )
})

test('promises of lists as values', async () => {
  assertEquals(await new HTMLResponse(html`<ul>${(async () => {
    await new Promise(r => setTimeout(r, 10));
    return [html`<li>1</li>`, html`<li>2</li>`]
  })()}</ul>`).text(), '<ul><li>1</li><li>2</li></ul>')
})

test('promises of async generators as values', async () => {
  assertEquals(await new HTMLResponse(html`<ul>${(async () => {
    await new Promise(r => setTimeout(r, 10));
    return (async function* () {
    await timeout(10);
    yield html`<li>1</li>`
    await timeout(10);
    yield html`<li>2</li>`
    })();
  })()}</ul>`).text(), '<ul><li>1</li><li>2</li></ul>')
})

import { fallback } from '../index.ts'

test('fallback values', async () => {
  assertEquals(
    await new HTMLResponse(html`<div>${
      fallback(html`<main>${() => { throw Error() }}</main>`, html`<span>An error occurred</span>`)
    }</div>`).text(),
    '<div><main><span>An error occurred</span></div>')
})

test('fallback functions', async () => {
  assertEquals(
    await new HTMLResponse(html`<div>${
      fallback(html`<main>${() => { throw Error('foo') }}</main>`, e => html`<span>An error occurred: ${e.message}</span>`)
    }</div>`).text(),
    '<div><main><span>An error occurred: foo</span></div>')
})
