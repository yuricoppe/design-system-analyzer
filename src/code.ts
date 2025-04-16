import { Component, Styles, AnalysisData, PluginMessage, ColorInfo } from './types';

// Configuração inicial da UI
figma.showUI(__html__, { width: 400, height: 600 });

// Função auxiliar para log
function log(message: string, data?: any) {
  console.log(`[Design System Analyzer] ${message}`, data || '');
}

// Função para converter RGB para Hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Função para processar preenchimentos (fills)
function processFills(fills: readonly Paint[], styles: Styles) {
  fills.forEach(fill => {
    if (fill.type === 'SOLID') {
      const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      
      // Verificar se é uma variável de cor
      let variableName: string | undefined;
      if ('boundVariables' in fill && fill.boundVariables?.color) {
        const variable = figma.variables.getVariableById(fill.boundVariables.color.id);
        if (variable) {
          variableName = variable.name;
        }
      }

      // Encontrar ou criar entrada para esta cor
      let colorInfo = styles.colors.find(c => c.hex === hexColor);
      if (!colorInfo) {
        colorInfo = {
          hex: hexColor,
          variableName,
          directUses: 0,
          variableUses: 0
        };
        styles.colors.push(colorInfo);
      }

      // Atualizar contagem de usos
      if (variableName) {
        colorInfo.variableUses++;
      } else {
        colorInfo.directUses++;
      }
    } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
      const gradientStops = fill.gradientStops.map(stop => 
        rgbToHex(stop.color.r, stop.color.g, stop.color.b)
      );
      const gradientName = `${fill.type} (${gradientStops.join(' → ')})`;
      
      // Adicionar gradiente como uma cor especial
      if (!styles.colors.some(c => c.hex === gradientName)) {
        styles.colors.push({
          hex: gradientName,
          directUses: 1,
          variableUses: 0
        });
      }
    }
  });
}

// Função para processar efeitos
function processEffects(effects: readonly Effect[], styles: Styles) {
  effects.forEach(effect => {
    let effectName = '';
    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      effectName = `${effect.type} (${effect.color.r}, ${effect.color.g}, ${effect.color.b}, ${effect.color.a})`;
    } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
      effectName = `${effect.type} (${effect.radius}px)`;
    }
    if (effectName && !styles.effects.includes(effectName)) {
      styles.effects.push(effectName);
    }
  });
}

// Função para processar um nó e seus filhos
function processNode(node: SceneNode, styles: Styles) {
  log('Processing node:', { type: node.type, name: node.name });

  // Processar preenchimentos
  if ('fills' in node && node.fills) {
    processFills(node.fills, styles);
  }

  // Processar estilos de texto
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    log('Processing text node:', { styleId: textNode.textStyleId });
    if (textNode.textStyleId && typeof textNode.textStyleId === 'string') {
      const style = figma.getStyleById(textNode.textStyleId);
      if (style && !styles.textStyles.includes(style.name)) {
        styles.textStyles.push(style.name);
        log('Added text style:', style.name);
      }
    }
  }

  // Processar efeitos
  if ('effects' in node && node.effects) {
    processEffects(node.effects, styles);
  }

  // Processar filhos recursivamente
  if ('children' in node) {
    const children = node.children as readonly SceneNode[];
    log('Processing children:', children.length);
    children.forEach(child => processNode(child, styles));
  }
}

// Função para coletar componentes
function collectComponents(node: SceneNode, components: Component[], processedIds: Set<string>) {
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    if (!processedIds.has(node.id)) {
      components.push({
        name: node.name,
        type: node.type
      });
      processedIds.add(node.id);
      log('Added component:', { name: node.name, type: node.type });
    }
  }

  if ('children' in node) {
    const children = node.children as readonly SceneNode[];
    children.forEach(child => collectComponents(child, components, processedIds));
  }
}

// Handler para mensagens da UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'analyze-design-system') {
    try {
      log('Starting analysis...');
      
      // Verificar seleção
      if (figma.currentPage.selection.length === 0) {
        throw new Error('Please select at least one frame or component to analyze.');
      }
      log('Selection found:', figma.currentPage.selection.length);

      // Inicializar dados
      const styles: Styles = {
        colors: [],
        textStyles: [],
        effects: []
      };

      const components: Component[] = [];
      const processedIds = new Set<string>();

      // Processar seleção
      figma.currentPage.selection.forEach(node => {
        collectComponents(node, components, processedIds);
        processNode(node, styles);
      });

      // Verificar inconsistências
      const inconsistencies: string[] = [];
      
      if (components.length === 0) {
        inconsistencies.push('No components found in selection');
      }
      if (styles.colors.length === 0) {
        inconsistencies.push('No colors found in selection');
      }
      if (styles.textStyles.length === 0) {
        inconsistencies.push('No text styles found in selection');
      }
      if (styles.effects.length === 0) {
        inconsistencies.push('No effects found in selection');
      }

      log('Analysis complete:', {
        components: components.length,
        colors: styles.colors.length,
        textStyles: styles.textStyles.length,
        effects: styles.effects.length,
        inconsistencies: inconsistencies.length
      });

      // Enviar resultados
      const analysisData: AnalysisData = {
        components,
        styles,
        inconsistencies
      };

      figma.ui.postMessage({
        type: 'analysis-results',
        data: analysisData
      } as PluginMessage);

    } catch (error) {
      log('Error during analysis:', error);
      figma.ui.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      } as PluginMessage);
    }
  }
}; 