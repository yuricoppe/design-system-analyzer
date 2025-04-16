document.getElementById('analyze-button').onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'analyze-design-system' } }, '*');
};

// Função para criar um elemento de cor
function createColorElement(color) {
  const colorDiv = document.createElement('div');
  colorDiv.className = 'color-item';
  
  const colorPreview = document.createElement('div');
  colorPreview.className = 'color-preview';
  colorPreview.style.backgroundColor = color.hex;
  
  const colorInfo = document.createElement('div');
  colorInfo.className = 'color-info';
  
  const colorHex = document.createElement('span');
  colorHex.className = 'color-hex';
  colorHex.textContent = color.hex;
  
  const colorUses = document.createElement('span');
  colorUses.className = 'color-uses';
  colorUses.textContent = `${color.uses} uses`;
  
  const actionButtons = document.createElement('div');
  actionButtons.className = 'action-buttons';
  
  const findVariablesButton = document.createElement('button');
  findVariablesButton.textContent = 'Find Variables';
  findVariablesButton.onclick = () => {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'find-variables',
        data: color.hex
      }
    }, '*');
  };
  
  colorInfo.appendChild(colorHex);
  colorInfo.appendChild(colorUses);
  actionButtons.appendChild(findVariablesButton);
  
  colorDiv.appendChild(colorPreview);
  colorDiv.appendChild(colorInfo);
  colorDiv.appendChild(actionButtons);
  
  return colorDiv;
}

// Função para criar um elemento de variável
function createVariableElement(variable, hex) {
  const variableDiv = document.createElement('div');
  variableDiv.className = 'variable-item';
  
  const variableInfo = document.createElement('div');
  variableInfo.className = 'variable-info';
  
  const variableName = document.createElement('span');
  variableName.className = 'variable-name';
  variableName.textContent = variable.name;
  
  const variableCollection = document.createElement('span');
  variableCollection.className = 'variable-collection';
  variableCollection.textContent = variable.collection;
  
  const useVariableButton = document.createElement('button');
  useVariableButton.textContent = 'Use Variable';
  useVariableButton.onclick = () => {
    parent.postMessage({
      pluginMessage: {
        type: 'use-variable',
        data: {
          hex,
          variableKey: variable.key
        }
      }
    }, '*');
  };
  
  variableInfo.appendChild(variableName);
  variableInfo.appendChild(variableCollection);
  variableDiv.appendChild(variableInfo);
  variableDiv.appendChild(useVariableButton);
  
  return variableDiv;
}

// Função para mostrar os resultados da análise
function showAnalysisResults(data) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  
  if (data.colors && data.colors.length > 0) {
    const colorsSection = document.createElement('section');
    colorsSection.className = 'colors-section';
    
    const colorsTitle = document.createElement('h2');
    colorsTitle.textContent = 'Colors';
    colorsSection.appendChild(colorsTitle);
    
    data.colors.forEach(color => {
      colorsSection.appendChild(createColorElement(color));
    });
    
    resultsDiv.appendChild(colorsSection);
  }
  
  if (data.components && data.components.length > 0) {
    const componentsSection = document.createElement('section');
    componentsSection.className = 'components-section';
    
    const componentsTitle = document.createElement('h2');
    componentsTitle.textContent = 'Components';
    componentsSection.appendChild(componentsTitle);
    
    const componentsList = document.createElement('ul');
    data.components.forEach(component => {
      const li = document.createElement('li');
      li.textContent = `${component.name} (${component.type})`;
      componentsList.appendChild(li);
    });
    
    componentsSection.appendChild(componentsList);
    resultsDiv.appendChild(componentsSection);
  }
}

// Função para mostrar variáveis encontradas
function showVariables(variables, hex) {
  const variablesDiv = document.getElementById('variables-results');
  variablesDiv.innerHTML = '';
  
  if (variables.length === 0) {
    const noVariables = document.createElement('p');
    noVariables.textContent = 'No variables found for this color.';
    variablesDiv.appendChild(noVariables);
    return;
  }
  
  variables.forEach(variable => {
    variablesDiv.appendChild(createVariableElement(variable, hex));
  });
}

// Função para mostrar mensagens de erro
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  resultsDiv.appendChild(errorDiv);
}

// Listener para mensagens do plugin
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.error) {
    showError(msg.error);
    return;
  }
  
  switch (msg.type) {
    case 'analyze-design-system':
      showAnalysisResults(msg.data);
      break;
    case 'variables-found':
      showVariables(msg.data, msg.hex);
      break;
  }
}; 