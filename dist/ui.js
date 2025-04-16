(()=>{"use strict";var n,e={22:(n,e,t)=>{t.r(e),t.d(e,{default:()=>s});const s="<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n      margin: 0;\n      padding: 16px;\n      color: #333;\n    }\n    \n    .container {\n      max-width: 100%;\n    }\n    \n    h1 {\n      font-size: 16px;\n      margin-bottom: 16px;\n    }\n    \n    button {\n      background: #18A0FB;\n      color: white;\n      border: none;\n      padding: 8px 16px;\n      border-radius: 6px;\n      cursor: pointer;\n      font-size: 14px;\n      width: 100%;\n      margin-bottom: 16px;\n    }\n    \n    button:hover {\n      background: #0D8DE3;\n    }\n    \n    .results {\n      display: none;\n    }\n    \n    .section {\n      margin-bottom: 16px;\n    }\n    \n    .section h2 {\n      font-size: 14px;\n      margin: 0 0 8px 0;\n      color: #666;\n    }\n    \n    .list {\n      list-style: none;\n      padding: 0;\n      margin: 0;\n    }\n    \n    .list li {\n      padding: 8px;\n      background: #F5F5F5;\n      margin-bottom: 4px;\n      border-radius: 4px;\n      font-size: 13px;\n    }\n    \n    .error {\n      color: #FF4D4D;\n      padding: 8px;\n      background: #FFF5F5;\n      border-radius: 4px;\n      margin-top: 16px;\n      display: none;\n    }\n    \n    .color-item {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    }\n    \n    .color-square {\n      width: 20px;\n      height: 20px;\n      border-radius: 4px;\n      border: 1px solid #E5E5E5;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <h1>Design System Analyzer</h1>\n    <button id=\"analyze\">Analyze Selection</button>\n    \n    <div class=\"results\">\n      <div class=\"section\">\n        <h2>Components</h2>\n        <ul id=\"components\" class=\"list\"></ul>\n      </div>\n      \n      <div class=\"section\">\n        <h2>Colors</h2>\n        <ul id=\"colors\" class=\"list\"></ul>\n      </div>\n      \n      <div class=\"section\">\n        <h2>Text Styles</h2>\n        <ul id=\"textStyles\" class=\"list\"></ul>\n      </div>\n      \n      <div class=\"section\">\n        <h2>Effects</h2>\n        <ul id=\"effects\" class=\"list\"></ul>\n      </div>\n      \n      <div class=\"section\">\n        <h2>Inconsistencies</h2>\n        <ul id=\"inconsistencies\" class=\"list\"></ul>\n      </div>\n    </div>\n    \n    <div class=\"error\" id=\"error\"></div>\n  </div>\n\n  <script>\n    document.getElementById('analyze').onclick = () => {\n      parent.postMessage({ pluginMessage: { type: 'analyze-design-system' } }, '*');\n    };\n\n    function updateSection(id, items) {\n      const list = document.getElementById(id);\n      list.innerHTML = '';\n      \n      items.forEach(item => {\n        const li = document.createElement('li');\n        \n        if (id === 'colors') {\n          const colorItem = document.createElement('div');\n          colorItem.className = 'color-item';\n          \n          const colorSquare = document.createElement('div');\n          colorSquare.className = 'color-square';\n          colorSquare.style.backgroundColor = item;\n          \n          const colorName = document.createElement('span');\n          colorName.textContent = item;\n          \n          colorItem.appendChild(colorSquare);\n          colorItem.appendChild(colorName);\n          li.appendChild(colorItem);\n        } else {\n          li.textContent = item;\n        }\n        \n        list.appendChild(li);\n      });\n    }\n\n    onmessage = (event) => {\n      const message = event.data.pluginMessage;\n      \n      if (message.type === 'analysis-results') {\n        document.querySelector('.results').style.display = 'block';\n        document.getElementById('error').style.display = 'none';\n        \n        const data = message.data;\n        updateSection('components', data.components.map(c => `${c.name} (${c.type})`));\n        updateSection('colors', data.styles.colors);\n        updateSection('textStyles', data.styles.textStyles);\n        updateSection('effects', data.styles.effects);\n        updateSection('inconsistencies', data.inconsistencies);\n      } else if (message.type === 'error') {\n        document.querySelector('.results').style.display = 'none';\n        const errorElement = document.getElementById('error');\n        errorElement.style.display = 'block';\n        errorElement.textContent = message.message;\n      }\n    };\n  <\/script>\n</body>\n</html> "}},t={};function s(n){var o=t[n];if(void 0!==o)return o.exports;var l=t[n]={exports:{}};return e[n](l,l.exports,s),l.exports}function o(n,e){const t=document.getElementById(n);if(t){if(t.innerHTML="",0===e.length){const n=document.createElement("div");return n.className="empty-message",n.textContent="None found",void t.appendChild(n)}e.forEach((e=>{const s=document.createElement("div");if(s.className="list-item","colors"===n){const n=document.createElement("div");n.className="color-square",n.style.backgroundColor=e;const t=document.createElement("span");t.textContent=e,s.appendChild(n),s.appendChild(t)}else s.textContent=e;t.appendChild(s)}))}}s.d=(n,e)=>{for(var t in e)s.o(e,t)&&!s.o(n,t)&&Object.defineProperty(n,t,{enumerable:!0,get:e[t]})},s.o=(n,e)=>Object.prototype.hasOwnProperty.call(n,e),s.r=n=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})},__html__=s(22),null===(n=document.getElementById("analyze"))||void 0===n||n.addEventListener("click",(()=>{const n=document.getElementById("error"),e=document.getElementById("results");n&&e&&(n.style.display="none",e.style.display="none",parent.postMessage({pluginMessage:{type:"analyze-design-system"}},"*"))})),onmessage=n=>{const e=n.data.pluginMessage;if("error"!==e.type){if("analysis-results"===e.type){const n=document.getElementById("error"),t=document.getElementById("results");if(n&&t){n.style.display="none",t.style.display="block";const s=e.data;o("components",s.components.map((n=>`${n.name} (${n.type})`))),o("colors",s.styles.colors),o("textStyles",s.styles.textStyles),o("effects",s.styles.effects),o("inconsistencies",s.inconsistencies)}}}else{const n=document.getElementById("error"),t=document.getElementById("results");n&&t&&(n.textContent=e.message,n.style.display="block",t.style.display="none")}}})();