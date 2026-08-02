const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "http://localhost:3000/" });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Node = dom.window.Node;
global.HTMLElement = dom.window.HTMLElement;
global.DOMParser = dom.window.DOMParser;
global.MutationObserver = dom.window.MutationObserver;
try {
  require('./test_bundle.js');
} catch (e) {
  console.error("BUNDLE ERROR:", e);
}
