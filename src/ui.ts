import { Component } from './types';

// @ts-ignore
__html__ = require('./ui.html');

document.getElementById('analyze')?.addEventListener('click', () => {
  const errorDiv = document.getElementById('error');
  const resultsDiv = document.getElementById('results');
  
  if (errorDiv && resultsDiv) {
    errorDiv.style.display = 'none';
    resultsDiv.style.display = 'none';
    parent.postMessage({ pluginMessage: { type: 'analyze-design-system' } }, '*');
  }
});

function updateSection(id: string, items: string[]) {
  const container = document.getElementById(id);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (items.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'None found';
    container.appendChild(emptyMessage);
    return;
  }
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    if (id === 'colors') {
      const colorSquare = document.createElement('div');
      colorSquare.className = 'color-square';
      colorSquare.style.backgroundColor = item;
      
      const colorName = document.createElement('span');
      colorName.textContent = item;
      
      div.appendChild(colorSquare);
      div.appendChild(colorName);
    } else {
      div.textContent = item;
    }
    
    container.appendChild(div);
  });
}

onmessage = (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.type === 'error') {
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    
    if (errorDiv && resultsDiv) {
      errorDiv.textContent = msg.message;
      errorDiv.style.display = 'block';
      resultsDiv.style.display = 'none';
    }
    return;
  }
  
  if (msg.type === 'analysis-results') {
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    
    if (errorDiv && resultsDiv) {
      errorDiv.style.display = 'none';
      resultsDiv.style.display = 'block';
      
      const data = msg.data;
      
      updateSection('components', data.components.map((c: Component) => `${c.name} (${c.type})`));
      updateSection('colors', data.styles.colors);
      updateSection('textStyles', data.styles.textStyles);
      updateSection('effects', data.styles.effects);
      updateSection('inconsistencies', data.inconsistencies);
    }
  }
}; 