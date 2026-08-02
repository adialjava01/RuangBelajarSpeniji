const { JSDOM } = require('jsdom');
(async () => {
  const dom = await JSDOM.fromURL("http://localhost:3000/", {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  });
  dom.window.console.log = (...args) => console.log('LOG:', ...args);
  dom.window.console.error = (...args) => console.error('ERROR:', ...args);
  dom.window.console.warn = (...args) => console.warn('WARN:', ...args);
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('Root HTML:', dom.window.document.getElementById('root').innerHTML.substring(0, 100));
})();
