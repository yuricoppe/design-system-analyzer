(()=>{"use strict";({927:function(){var e=this&&this.__awaiter||function(e,t,n,s){return new(n||(n=Promise))((function(o,i){function a(e){try{r(s.next(e))}catch(e){i(e)}}function c(e){try{r(s.throw(e))}catch(e){i(e)}}function r(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(a,c)}r((s=s.apply(e,t||[])).next())}))};function t(){const e={componentUsage:new Map,tokenUsage:new Map,inconsistencies:[],adoption:{total:0,byTeam:new Map}};return figma.root.children.forEach((t=>{t.children.forEach((t=>{n(t,e)}))})),e}function n(e,t){if("INSTANCE"===e.type&&e.mainComponent){const n=e.mainComponent.name;t.componentUsage.set(n,(t.componentUsage.get(n)||0)+1)}if("fills"in e&&Array.isArray(e.fills)&&e.fills.forEach((e=>{if("SOLID"===e.type){const n=`${e.color.r},${e.color.g},${e.color.b}`;t.tokenUsage.set(n,(t.tokenUsage.get(n)||0)+1)}})),"TEXT"===e.type){const n=e.textStyleId;if("string"==typeof n){const e=figma.getStyleById(n);e&&t.tokenUsage.set(e.name,(t.tokenUsage.get(e.name)||0)+1)}}!function(e,t){"TEXT"===e.type&&(e.textStyleId&&e.textStyleId!==figma.mixed||t.inconsistencies.push({type:"style",message:"Text without consistent style",nodeId:e.id,severity:"medium"})),"FRAME"===e.type&&(e.layoutMode||t.inconsistencies.push({type:"component",message:"Frame without layout mode",nodeId:e.id,severity:"low"}))}(e,t),"children"in e&&e.children.forEach((e=>n(e,t)))}function s(e){const t={};return e.forEach(((e,n)=>{t[n]=e})),t}figma.showUI(__html__,{width:400,height:600}),figma.ui.onmessage=n=>e(void 0,void 0,void 0,(function*(){if("collect-metrics"===n.type){const e=t();figma.ui.postMessage({type:"metrics-data",data:{componentUsage:s(e.componentUsage),tokenUsage:s(e.tokenUsage),inconsistencies:e.inconsistencies,adoption:{total:e.adoption.total,byTeam:s(e.adoption.byTeam)}}})}if("analyze-design-system"===n.type)try{const e=figma.currentPage.selection;if(0===e.length)return void figma.ui.postMessage({type:"error",message:"Please select at least one frame or component to analyze."});const t={components:[],styles:{colors:[],textStyles:[],effects:[]},inconsistencies:[]},n=e=>{if("COMPONENT"!==e.type&&"INSTANCE"!==e.type||t.components.push({name:e.name,type:e.type}),"fills"in e&&e.fills&&e.fills.forEach((e=>{if("SOLID"===e.type){const n=e.color,s=`rgb(${Math.round(255*n.r)}, ${Math.round(255*n.g)}, ${Math.round(255*n.b)})`;t.styles.colors.includes(s)||t.styles.colors.push(s)}})),"TEXT"===e.type){const n=e.textStyleId;if("string"==typeof n){const e=figma.getStyleById(n);e&&!t.styles.textStyles.includes(e.name)&&t.styles.textStyles.push(e.name)}}if("effects"in e&&e.effects&&e.effects.forEach((e=>{if("DROP_SHADOW"===e.type||"INNER_SHADOW"===e.type){const n=`${e.type}: ${Math.round(e.radius)}px`;t.styles.effects.includes(n)||t.styles.effects.push(n)}})),"INSTANCE"===e.type){const n=e.mainComponent;if(n){const s="overrides"in e?e.overrides:[];s&&s.length>0&&t.inconsistencies.push({message:`Instance "${e.name}" has ${s.length} overrides from main component "${n.name}"`})}}"children"in e&&e.children.forEach((e=>n(e)))};e.forEach((e=>n(e))),figma.ui.postMessage({type:"analysis-results",data:t})}catch(e){figma.ui.postMessage({type:"error",message:"An error occurred during analysis: "+(e instanceof Error?e.message:String(e))})}}))}})[927]()})();