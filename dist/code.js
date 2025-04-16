(()=>{"use strict";function e(e,t){console.log(`[Design System Analyzer] ${e}`,t||"")}function t(e,t,n){const o=e=>{const t=Math.round(255*e).toString(16);return 1===t.length?"0"+t:t};return`#${o(e)}${o(t)}${o(n)}`}function n(o,s){if(e("Processing node:",{type:o.type,name:o.name}),"fills"in o&&o.fills&&function(n,o){n.forEach((n=>{if("SOLID"===n.type){const s=t(n.color.r,n.color.g,n.color.b);o.colors.includes(s)||(o.colors.push(s),e("Added color:",s))}else if("GRADIENT_LINEAR"===n.type||"GRADIENT_RADIAL"===n.type){const s=n.gradientStops.map((e=>t(e.color.r,e.color.g,e.color.b))),c=`${n.type} (${s.join(" → ")})`;o.colors.includes(c)||(o.colors.push(c),e("Added gradient:",c))}}))}(o.fills,s),"TEXT"===o.type){const t=o;if(e("Processing text node:",{styleId:t.textStyleId}),t.textStyleId&&"string"==typeof t.textStyleId){const n=figma.getStyleById(t.textStyleId);n&&!s.textStyles.includes(n.name)&&(s.textStyles.push(n.name),e("Added text style:",n.name))}}if("effects"in o&&o.effects&&function(t,n){t.forEach((t=>{let o="";"DROP_SHADOW"===t.type||"INNER_SHADOW"===t.type?o=`${t.type} (${t.color.r}, ${t.color.g}, ${t.color.b}, ${t.color.a})`:"LAYER_BLUR"!==t.type&&"BACKGROUND_BLUR"!==t.type||(o=`${t.type} (${t.radius}px)`),o&&!n.effects.includes(o)&&(n.effects.push(o),e("Added effect:",o))}))}(o.effects,s),"children"in o){const t=o.children;e("Processing children:",t.length),t.forEach((e=>n(e,s)))}}function o(t,n,s){"COMPONENT"!==t.type&&"COMPONENT_SET"!==t.type||s.has(t.id)||(n.push({name:t.name,type:t.type}),s.add(t.id),e("Added component:",{name:t.name,type:t.type})),"children"in t&&t.children.forEach((e=>o(e,n,s)))}figma.showUI(__html__,{width:400,height:600}),figma.ui.onmessage=t=>{return s=void 0,c=void 0,l=function*(){if("analyze-design-system"===t.type)try{if(e("Starting analysis..."),0===figma.currentPage.selection.length)throw new Error("Please select at least one frame or component to analyze.");e("Selection found:",figma.currentPage.selection.length);const t={colors:[],textStyles:[],effects:[]},s=[],c=new Set;figma.currentPage.selection.forEach((e=>{o(e,s,c),n(e,t)}));const i=[];0===s.length&&i.push("No components found in selection"),0===t.colors.length&&i.push("No colors found in selection"),0===t.textStyles.length&&i.push("No text styles found in selection"),0===t.effects.length&&i.push("No effects found in selection"),e("Analysis complete:",{components:s.length,colors:t.colors.length,textStyles:t.textStyles.length,effects:t.effects.length,inconsistencies:i.length});const l={components:s,styles:t,inconsistencies:i};figma.ui.postMessage({type:"analysis-results",data:l})}catch(t){e("Error during analysis:",t),figma.ui.postMessage({type:"error",message:t instanceof Error?t.message:"An unknown error occurred"})}},new((i=void 0)||(i=Promise))((function(e,t){function n(e){try{r(l.next(e))}catch(e){t(e)}}function o(e){try{r(l.throw(e))}catch(e){t(e)}}function r(t){var s;t.done?e(t.value):(s=t.value,s instanceof i?s:new i((function(e){e(s)}))).then(n,o)}r((l=l.apply(s,c||[])).next())}));var s,c,i,l}})();