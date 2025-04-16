import { Component, Styles, AnalysisData, PluginMessage, ColorInfo, ComponentInfo, VariableInfo } from './types';

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

// Função para converter Hex para RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error('Invalid hex color');
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  };
}

// Função para verificar se dois valores RGB são iguais
function isSameColor(color1: RGB, color2: RGB): boolean {
  return Math.abs(color1.r - color2.r) < 0.001 && 
         Math.abs(color1.g - color2.g) < 0.001 && 
         Math.abs(color1.b - color2.b) < 0.001;
}

// Função para criar uma variável de cor
async function createColorVariable(hex: string): Promise<any> {
  const rgb = hexToRgb(hex);
  
  // Obter todas as coleções de variáveis disponíveis
  const collections = figma.variables.getLocalVariableCollections();
  
  // Se não houver coleções, criar uma nova
  if (collections.length === 0) {
    const collection = figma.variables.createVariableCollection('Colors');
    const mode = collection.modes[0];
    const variable = figma.variables.createVariable(
      `color-${collection.variableIds.length + 1}`,
      collection,
      'COLOR'
    );
    variable.setValueForMode(mode.modeId, rgb);
    return variable;
  }
  
  // Se houver apenas uma coleção, usar ela
  if (collections.length === 1) {
    const collection = collections[0];
    const mode = collection.modes[0];
    const variable = figma.variables.createVariable(
      `color-${collection.variableIds.length + 1}`,
      collection,
      'COLOR'
    );
    variable.setValueForMode(mode.modeId, rgb);
    return variable;
  }
  
  // Se houver múltiplas coleções, mostrar diálogo para seleção
  const collectionNames = collections.map(c => c.name);
  const selectedCollectionName = await figma.clientStorage.getAsync('lastUsedCollection') || collectionNames[0];
  
  const selectedCollection = collections.find(c => c.name === selectedCollectionName) || collections[0];
  const mode = selectedCollection.modes[0];
  
  const variable = figma.variables.createVariable(
    `color-${selectedCollection.variableIds.length + 1}`,
    selectedCollection,
    'COLOR'
  );
  variable.setValueForMode(mode.modeId, rgb);
  
  // Salvar a coleção selecionada para uso futuro
  await figma.clientStorage.setAsync('lastUsedCollection', selectedCollection.name);
  
  return variable;
}

interface RemoteInfo {
  name: string;
}

interface LocalVariableInfo {
  id: string;
  key: string;
  name: string;
  value: RGB;
  collection: string;
  isFromLibrary: boolean;
  libraryName?: string;
}

// Função para encontrar todas as variáveis com um determinado valor hexadecimal
async function findVariablesWithHex(hex: string): Promise<LocalVariableInfo[]> {
  const variables: LocalVariableInfo[] = [];
  const rgb = hexToRgb(hex);
  
  const allVariables = await figma.variables.getLocalVariablesAsync('COLOR');
  
  for (const variable of allVariables) {
    try {
      const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
      if (!collection) continue;

      const mode = collection.modes[0];
      const value = variable.valuesByMode[mode.modeId];
      
      if (value && typeof value === 'object' && 'r' in value) {
        const colorValue = value as RGB;
        if (isSameColor(colorValue, rgb)) {
          const variableInfo: LocalVariableInfo = {
            id: variable.id,
            key: variable.key,
            name: variable.name,
            value: colorValue,
            collection: collection.name,
            isFromLibrary: variable.remote,
            libraryName: collection.remote ? collection.name : undefined
          };
          variables.push(variableInfo);
        }
      }
    } catch (error) {
      console.error('Error processing variable:', error);
    }
  }
  
  return variables;
}

// Função para substituir preenchimentos diretos por variáveis
async function replaceDirectFillsWithVariable(node: any, hex: string, variableKey: string) {
  try {
    // Primeiro tenta obter a variável localmente
    let variable = figma.variables.getLocalVariables('COLOR').find(v => v.key === variableKey);
    
    // Se não encontrou localmente, tenta importar da biblioteca
    if (!variable) {
      try {
        variable = await figma.variables.importVariableByKeyAsync(variableKey);
        console.log('Variable imported successfully:', variable.name);
      } catch (error) {
        console.error('Error importing variable:', error);
        figma.notify('Failed to import color variable from library');
        return; // Encerra a função se não conseguiu importar
      }
    }

    if (!variable) {
      figma.notify('Variable not found');
      return;
    }

    if ('fills' in node) {
      const fills = node.fills as Paint[];
      if (Array.isArray(fills)) {
        const newFills = fills.map(fill => {
          if (fill.type === 'SOLID') {
            const fillHex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
            if (fillHex === hex) {
              return figma.variables.setBoundVariableForPaint(fill, 'color', variable);
            }
          }
          return fill;
        });
        node.fills = newFills as Paint[];
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        await replaceDirectFillsWithVariable(child, hex, variableKey);
      }
    }
  } catch (error: any) {
    console.error('Error replacing fills:', error);
    figma.notify(`Error: ${error.message || 'Unknown error occurred'}`);
  }
}

// Função para processar preenchimentos (fills)
function processFills(fills: readonly Paint[] | PluginAPI['mixed']): ColorInfo[] {
  const colors: ColorInfo[] = [];
  
  if (fills === figma.mixed || !fills.length) {
    return colors;
  }

  fills.forEach((fill) => {
    if (fill.type === 'SOLID') {
      const hex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      let colorInfo = colors.find(c => c.hex === hex);
      
      if (!colorInfo) {
        colorInfo = {
          hex,
          directUses: 0,
          variableUses: 0
        };
        colors.push(colorInfo);
      }

      if (fill.boundVariables?.color) {
        const variable = figma.variables.getVariableById(fill.boundVariables.color.id);
        if (variable) {
          // Formatar o nome da variável para ser mais amigável
          const variablePath = variable.name.split('/');
          const variableName = variablePath.length > 1 
            ? variablePath[variablePath.length - 2] + '/' + variablePath[variablePath.length - 1]
            : variable.name;
            
          colorInfo.variableName = variableName;
          colorInfo.variableId = variable.id;
          colorInfo.variableKey = variable.key;
          colorInfo.variableUses++;
          
          // Adicionar informação sobre a coleção se disponível
          const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
          if (collection) {
            colorInfo.variableName = `${collection.name}/${variableName}`;
          }
        }
      } else {
        colorInfo.directUses++;
      }
    }
  });

  return colors;
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

// Map to store variables
const variables = new Map<string, VariableInfo>();

function createVariableInfo(variable: any): VariableInfo {
  return {
    id: variable.id,
    key: variable.key,
    name: variable.name,
    value: variable.valuesByMode[Object.keys(variable.valuesByMode)[0]],
    collection: variable.collectionId,
    isFromLibrary: variable.remote,
    libraryName: variable.remote ? variable.libraryName : undefined,
    remote: variable.remote,
    valuesByMode: variable.valuesByMode,
    resolvedType: variable.resolvedType
  };
}

// Função para processar um nó e seus filhos
async function processNode(node: SceneNode, styles: Styles): Promise<void> {
  try {
    // Verificar se o nó está visível
    if (node.visible !== false) {
      // Processar o nó atual como componente/frame
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE') {
        const componentInfo: ComponentInfo = {
          id: node.id,
          name: node.name,
          description: node.type === 'INSTANCE' 
            ? `Instance of ${(node as InstanceNode).mainComponent?.name || 'Unknown'}`
            : node.type
        };
        if (!styles.components.some(c => c.id === componentInfo.id)) {
          styles.components.push(componentInfo);
          log('Added component:', componentInfo);
        }
      } else if (node.type === 'FRAME') {
        const componentInfo: ComponentInfo = {
          id: node.id,
          name: node.name,
          description: 'Frame'
        };
        if (!styles.components.some(c => c.id === componentInfo.id)) {
          styles.components.push(componentInfo);
          log('Added frame:', componentInfo);
        }
      }

      // Processar preenchimentos do nó atual
      if ('fills' in node) {
        // Processar fills diretos
        if (node.fills) {
          const colors = processFills(node.fills);
          colors.forEach(color => {
            let existingColor = styles.colors.find(c => c.hex === color.hex);
            if (!existingColor) {
              styles.colors.push(color);
              log('Added color from fills:', color);
            } else {
              existingColor.directUses += color.directUses;
              existingColor.variableUses += color.variableUses;
              if (color.variableName) {
                existingColor.variableName = color.variableName;
                existingColor.variableId = color.variableId;
                existingColor.variableKey = color.variableKey;
              }
            }
          });
        }

        // Processar backgrounds
        if ('backgrounds' in node && node.backgrounds) {
          const bgColors = processFills(node.backgrounds);
          bgColors.forEach(color => {
            let existingColor = styles.colors.find(c => c.hex === color.hex);
            if (!existingColor) {
              styles.colors.push(color);
              log('Added color from background:', color);
            } else {
              existingColor.directUses += color.directUses;
              existingColor.variableUses += color.variableUses;
              if (color.variableName) {
                existingColor.variableName = color.variableName;
                existingColor.variableId = color.variableId;
                existingColor.variableKey = color.variableKey;
              }
            }
          });
        }

        // Processar strokes
        if ('strokes' in node && node.strokes) {
          const strokeColors = processFills(node.strokes);
          strokeColors.forEach(color => {
            let existingColor = styles.colors.find(c => c.hex === color.hex);
            if (!existingColor) {
              styles.colors.push(color);
              log('Added color from stroke:', color);
            } else {
              existingColor.directUses += color.directUses;
              existingColor.variableUses += color.variableUses;
              if (color.variableName) {
                existingColor.variableName = color.variableName;
                existingColor.variableId = color.variableId;
                existingColor.variableKey = color.variableKey;
              }
            }
          });
        }
      }

      // Processar estilos de texto
      if ('textStyleId' in node && node.textStyleId && node.type === 'TEXT') {
        const textStyle = figma.getStyleById(node.textStyleId as string);
        if (textStyle && textStyle.name) {
          const styleName = textStyle.name.split('/').pop() || textStyle.name;
          if (!styles.textStyles.includes(styleName)) {
            styles.textStyles.push(styleName);
            log('Added text style:', styleName);
          }
        }
      }

      // Processar efeitos
      if ('effects' in node && node.effects && node.effects.length > 0) {
        processEffects(node.effects, styles);
      }

      // Process variables
      if (node.boundVariables) {
        for (const [field, value] of Object.entries(node.boundVariables)) {
          if (value && typeof value === 'object' && 'id' in value) {
            const variableId = typeof value.id === 'string' ? value.id : value.id.toString();
            const variable = await figma.variables.getVariableByIdAsync(variableId);
            if (variable) {
              const variableInfo = createVariableInfo(variable);
              if (!variables.has(variableInfo.id)) {
                variables.set(variableInfo.id, variableInfo);
                log('Added variable:', variableInfo);
              }
            }
          }
        }
      }

      // Processar nós filhos recursivamente
      if ('children' in node) {
        for (const child of node.children) {
          await processNode(child, styles);
        }
      }
    }
  } catch (error) {
    console.error('Error processing node:', error);
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
    node.children.forEach(child => collectComponents(child, components, processedIds));
  }
}

// Handler para mensagens da UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'analyze-design-system') {
    try {
      // Verificar seleção
      if (figma.currentPage.selection.length === 0) {
        throw new Error('Please select at least one frame or component to analyze.');
      }

      // Inicializar dados
      const styles: Styles = {
        colors: [],
        textStyles: [],
        effects: [],
        components: []
      };

      // Processar seleção
      for (const node of figma.currentPage.selection) {
        // Primeiro processar o nó atual
        await processNode(node, styles);
        
        // Se for um frame ou componente, processar seus filhos
        if ('children' in node) {
          for (const child of node.children) {
            await processNode(child, styles);
          }
        }
      }

      // Verificar inconsistências
      const inconsistencies: string[] = [];
      
      if (styles.components.length === 0) {
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

      // Log para debug
      log('Analysis results:', {
        components: styles.components.length,
        colors: styles.colors.length,
        textStyles: styles.textStyles.length,
        effects: styles.effects.length
      });

      // Enviar resultados
      const analysisData: AnalysisData = {
        components: styles.components.map(c => ({
          name: c.name,
          type: c.description.includes('Instance') ? 'INSTANCE' : 
                c.description === 'Frame' ? 'FRAME' : 'COMPONENT'
        })),
        styles,
        inconsistencies
      };

      figma.ui.postMessage({
        type: 'analysis-results',
        data: analysisData
      } as PluginMessage);

    } catch (error) {
      console.error('Analysis error:', error);
      figma.ui.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      } as PluginMessage);
    }
  } else if (msg.type === 'find-variables') {
    try {
      const { hex } = msg.data;
      const variables = await findVariablesWithHex(hex);
      
      if (variables.length === 0) {
        throw new Error('No variables found with this color');
      }
      
      figma.ui.postMessage({
        type: 'variable-options',
        data: {
          hex,
          variables
        }
      } as PluginMessage);
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to find variables'
      } as PluginMessage);
    }
  } else if (msg.type === 'use-variable') {
    try {
      const { hex, variableKey } = msg.data;
      
      // Substituir todos os usos diretos pela variável
      for (const node of figma.currentPage.selection) {
        await replaceDirectFillsWithVariable(node, hex, variableKey);
      }

      // Reanalisar para atualizar a UI
      figma.ui.postMessage({ 
        pluginMessage: { 
          type: 'analyze-design-system' 
        } 
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to use color variable'
      } as PluginMessage);
    }
  }
}; 