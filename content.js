let wasmModule;
let searchFunc;

(async () => {
  const response = await fetch(chrome.runtime.getURL("build/search.js"));
  const jsCode = await response.text();
  eval(jsCode); // Loads `Module` defined by Emscripten

  wasmModule = await new Promise(resolve => {
    Module.onRuntimeInitialized = () => resolve(Module);
  });

  searchFunc = wasmModule.cwrap("search", "number", ["string", "string", "string", "number", "number"]);
})();

function highlightMatches(text, ranges) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let offset = 0;

  let node;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    const start = offset;
    const end = offset + len;

    ranges.forEach(([s, e]) => {
      if (s >= start && e <= end) {
        const relativeStart = s - start;
        const relativeEnd = e - start;
        const span = document.createElement("span");
        span.style.backgroundColor = "yellow";
        span.textContent = node.textContent.substring(relativeStart, relativeEnd);
        const before = document.createTextNode(node.textContent.substring(0, relativeStart));
        const after = document.createTextNode(node.textContent.substring(relativeEnd));
        const parent = node.parentNode;
        parent.replaceChild(after, node);
        parent.insertBefore(span, after);
        parent.insertBefore(before, span);
      }
    });

    offset = end;
  }
}

window.addEventListener("WGS_SEARCH", (e) => {
  const { word1, gap, word2 } = e.detail;
  const text = document.body.innerText;

  const resultPtr = wasmModule._malloc(4);
  const ptr = searchFunc(text, word1, word2, gap, resultPtr);

  const count = wasmModule.HEAP32[resultPtr >> 2];
  const results = [];

  for (let i = 0; i < count; i += 2) {
    const start = wasmModule.HEAP32[(ptr >> 2) + i];
    const end = wasmModule.HEAP32[(ptr >> 2) + i + 1];
    results.push([start, end]);
  }

  wasmModule._free(resultPtr);
  highlightMatches(text, results);
});
