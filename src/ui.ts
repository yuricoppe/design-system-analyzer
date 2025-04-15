interface AnalysisComponent {
  name: string;
  type: 'COMPONENT' | 'INSTANCE';
}

interface AnalysisStyle {
  type: string;
  value: string;
}

interface AnalysisData {
  components: AnalysisComponent[];
  styles: {
    colors: string[];
    textStyles: string[];
    effects: string[];
  };
  inconsistencies: {
    message: string;
  }[];
}

window.onload = () => {
  document.getElementById('analyze')?.addEventListener('click', () => {
    document.getElementById('error')!.style.display = 'none';
    document.getElementById('results')!.style.display = 'none';
    parent.postMessage({ pluginMessage: { type: 'analyze-design-system' } }, '*');
  });
};

window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.type === 'error') {
    const errorDiv = document.getElementById('error')!;
    errorDiv.textContent = msg.message;
    errorDiv.style.display = 'block';
    document.getElementById('results')!.style.display = 'none';
    return;
  }
  
  if (msg.type === 'analysis-results') {
    document.getElementById('error')!.style.display = 'none';
    document.getElementById('results')!.style.display = 'block';
    
    const data = msg.data as AnalysisData;
    
    updateSection('components', data.components.map(c => `${c.name} (${c.type})`));
    updateSection('colors', data.styles.colors);
    updateSection('textStyles', data.styles.textStyles);
    updateSection('effects', data.styles.effects);
    updateSection('inconsistencies', data.inconsistencies.map(i => i.message));
  }
};

function updateSection(id: string, items: string[]) {
  const container = document.getElementById(id)!;
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
    div.textContent = item;
    container.appendChild(div);
  });
} 