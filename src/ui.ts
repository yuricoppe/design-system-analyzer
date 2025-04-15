interface Component {
  name: string;
  count: number;
}

interface Style {
  name: string;
  count: number;
}

interface Inconsistency {
  message: string;
}

interface AnalysisResults {
  components: Component[];
  styles: Style[];
  inconsistencies: Inconsistency[];
}

interface PluginMessage {
  type: string;
  error?: string;
  data?: AnalysisResults;
}

const analyzeButton = document.getElementById('analyze');
if (analyzeButton) {
  analyzeButton.addEventListener('click', () => {
    parent.postMessage({ pluginMessage: { type: 'analyze-design-system' } }, '*');
  });
}

window.onmessage = (event) => {
  const message = event.data.pluginMessage as PluginMessage;
  const resultsDiv = document.getElementById('results');
  
  if (!resultsDiv) return;

  if (message.type === 'error') {
    resultsDiv.innerHTML = `
      <div class="error">
        ${message.error}
      </div>
    `;
    return;
  }

  if (message.type === 'analysis-results' && message.data) {
    const { components, styles, inconsistencies } = message.data;
    
    let html = '';
    
    if (components.length > 0) {
      html += '<h2>Components Found</h2>';
      html += '<ul class="component-list">';
      components.forEach((component: Component) => {
        html += `<li>${component.name} (${component.count} instances)</li>`;
      });
      html += '</ul>';
    }

    if (styles.length > 0) {
      html += '<h2>Styles Found</h2>';
      html += '<ul class="style-list">';
      styles.forEach((style: Style) => {
        html += `<li>${style.name} (${style.count} instances)</li>`;
      });
      html += '</ul>';
    }

    if (inconsistencies.length > 0) {
      html += '<h2>Inconsistencies Found</h2>';
      html += '<ul class="inconsistency-list">';
      inconsistencies.forEach((inconsistency: Inconsistency) => {
        html += `<li>${inconsistency.message}</li>`;
      });
      html += '</ul>';
    }

    if (components.length === 0 && styles.length === 0 && inconsistencies.length === 0) {
      html = '<p>No design system elements found in the selection.</p>';
    }

    resultsDiv.innerHTML = html;
  }
}; 