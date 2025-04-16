/// <reference types="@figma/plugin-typings" />

import { ColorInfo, ComponentInfo, VariableInfo, EffectInfo, AnalysisData, PluginMessage, StylesData } from './types';

// Plugin initialization and error handling
try {
  // Configure UI with error boundaries
  figma.showUI(__html__, { 
    width: 400, 
    height: 600,
    themeColors: true
  });

  // Initialize error handler
  figma.ui.onmessage = async (msg: PluginMessage) => {
    try {
      switch (msg.type) {
        case 'analyze-design-system':
          await handleAnalyzeSelection();
          break;
        case 'create-variable':
          await handleCreateVariable(msg.data.hex);
          break;
        case 'replace-color':
          await handleReplaceColor(msg.data.hex, msg.data.variableKey);
          break;
        default:
          console.error('Unknown message type:', msg.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      figma.notify('An error occurred. Check console for details.');
    }
  };
} catch (error) {
  console.error('Plugin initialization error:', error);
  figma.notify('Failed to initialize plugin');
}

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
  const tolerance = 0.001; // Small tolerance for floating point comparison
  return Math.abs(color1.r - color2.r) < tolerance &&
         Math.abs(color1.g - color2.g) < tolerance &&
         Math.abs(color1.b - color2.b) < tolerance;
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
async function findVariablesWithHex(hex: string): Promise<VariableInfo[]> {
  const variables: VariableInfo[] = [];
  const rgb = hexToRgb(hex);
  
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    for (const collection of collections) {
      const colorVariables = collection.variableIds
        .map(id => figma.variables.getVariableById(id))
        .filter(v => v && v.resolvedType === 'COLOR') as Variable[];
      
      for (const variable of colorVariables) {
        const mode = collection.modes[0];
        const value = variable.valuesByMode[mode.modeId];
        
        if (value && typeof value === 'object' && 'r' in value) {
          const colorValue = value as RGB;
          if (isSameColor(colorValue, rgb)) {
            variables.push({
              id: variable.id,
              key: variable.key,
              name: variable.name,
              collection: collection.name,
              isFromLibrary: variable.remote,
              libraryName: collection.remote ? collection.name : undefined
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error finding variables:', error);
    figma.notify('Error searching for color variables');
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

  fills.forEach(fill => {
    if (fill.type === 'SOLID') {
      const hex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      
      // Check if this color is already in our list
      const existingColor = colors.find(c => c.hex === hex);
      if (!existingColor) {
        // Add new color info
        const colorInfo: ColorInfo = {
          hex,
          isVariable: false
        };

        // Check if this color is bound to a variable
        if (fill.boundVariables && fill.boundVariables.color) {
          const variableAlias = fill.boundVariables.color;
          const variable = figma.variables.getVariableById(variableAlias.id);
          if (variable) {
            colorInfo.isVariable = true;
            colorInfo.name = variable.name;
            colorInfo.variableId = variable.id;
          }
        }

        colors.push(colorInfo);
      }
    }
  });

  return colors;
}

// Função para processar efeitos
function processEffects(effects: readonly Effect[], styles: StylesData) {
  effects.forEach(effect => {
    const effectInfo: EffectInfo = {
      name: effect.type.toLowerCase(),
      type: effect.visible ? 'active' : 'inactive'
    };
    styles.effects.push(effectInfo);
  });
}

// Map to store variables
const variables = new Map<string, VariableInfo>();

function createVariableInfo(variable: Variable): VariableInfo {
  const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
  return {
    id: variable.id,
    name: variable.name,
    value: typeof variable.valuesByMode === 'string' ? variable.valuesByMode : JSON.stringify(variable.valuesByMode),
    collection: collection ? collection.name : 'Unknown Collection'
  };
}

// Função para processar um nó e seus filhos
async function processNode(node: SceneNode, styles: StylesData, paintStyles: PaintStyle[]): Promise<void> {
  try {
    // Process fills if available
    if ('fills' in node) {
      const fills = node.fills;
      if (fills !== figma.mixed) {
        const colors = processFills(fills);
        styles.colors.push(...colors);
      }
    }

    // Process text styles if available
    if (node.type === 'TEXT') {
      const textStyle = node.textStyleId;
      if (typeof textStyle === 'string' && textStyle !== '') {
        const style = figma.getStyleById(textStyle);
        if (style && !styles.textStyles.includes(style.name)) {
          styles.textStyles.push(style.name);
        }
      }
    }

    // Process effects if available
    if ('effects' in node) {
      const effects = node.effects;
      if (Array.isArray(effects)) {
        processEffects(effects, styles);
      }
    }

    // Process children recursively
    if ('children' in node) {
      for (const child of node.children) {
        await processNode(child, styles, paintStyles);
      }
    }
  } catch (error) {
    console.error('Error processing node:', error);
  }
}

// Função para coletar componentes
function collectComponents(node: SceneNode, components: ComponentInfo[], processedIds: Set<string>) {
  if (processedIds.has(node.id)) {
    return;
  }
  processedIds.add(node.id);

  if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME') {
    const componentInfo: ComponentInfo = {
      name: node.name,
      type: node.type
    };
    components.push(componentInfo);
  }

  if ('children' in node) {
    for (const child of node.children) {
      collectComponents(child, components, processedIds);
    }
  }
}

// Add new handler functions
async function handleAnalyzeSelection() {
  try {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.notify('Please select at least one frame or component to analyze');
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select at least one frame or component to analyze.'
      });
      return;
    }

    const analysis: AnalysisData = {
      components: [],
      styles: {
        colors: [],
        textStyles: [],
        effects: []
      },
      inconsistencies: []
    };

    const processedNodes = new Set<string>();
    const colorUsage = new Map<string, { direct: number, variable: number, info?: ColorInfo }>();

    // Process each selected node
    for (const node of selection) {
      await processNodeColors(node, colorUsage);
      await processNodeComponents(node, analysis.components, processedNodes);
    }

    // Convert color usage to ColorInfo array
    analysis.styles.colors = Array.from(colorUsage.values()).map(usage => usage.info!);

    // Send results back to UI
    figma.ui.postMessage({
      type: 'analysis-results',
      data: analysis
    });

  } catch (error) {
    console.error('Error analyzing selection:', error);
    figma.notify('Error analyzing selection');
    figma.ui.postMessage({
      type: 'error',
      message: 'Error analyzing selection: ' + (error instanceof Error ? error.message : String(error))
    });
  }
}

async function processNodeColors(node: SceneNode, colorUsage: Map<string, { direct: number, variable: number, info?: ColorInfo }>) {
  if ('fills' in node && node.fills) {
    const fills = node.fills as Paint[];
    if (Array.isArray(fills)) {
      for (const fill of fills) {
        if (fill.type === 'SOLID') {
          const hex = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
          
          let usage = colorUsage.get(hex) || { direct: 0, variable: 0 };
          
          if (fill.boundVariables && fill.boundVariables.color) {
            const variable = figma.variables.getVariableById(fill.boundVariables.color.id);
            if (variable) {
              usage.variable++;
              usage.info = {
                hex,
                isVariable: true,
                variableName: variable.name,
                variableId: variable.id,
                variableKey: variable.key,
                directUses: usage.direct,
                variableUses: usage.variable
              };
            }
          } else {
            usage.direct++;
            if (!usage.info) {
              usage.info = {
                hex,
                isVariable: false,
                directUses: usage.direct,
                variableUses: usage.variable
              };
            } else {
              usage.info.directUses = usage.direct;
              usage.info.variableUses = usage.variable;
            }
          }
          
          colorUsage.set(hex, usage);
        }
      }
    }
  }

  if ('children' in node) {
    for (const child of node.children) {
      await processNodeColors(child, colorUsage);
    }
  }
}

async function processNodeComponents(node: SceneNode, components: ComponentInfo[], processedNodes: Set<string>) {
  if ((node.type === 'COMPONENT' || node.type === 'INSTANCE') && !processedNodes.has(node.id)) {
    processedNodes.add(node.id);
    components.push({
      name: node.name,
      type: node.type
    });
  }

  if ('children' in node) {
    for (const child of node.children) {
      await processNodeComponents(child, components, processedNodes);
    }
  }
}

async function handleCreateVariable(hex: string) {
  try {
    const variable = await createColorVariable(hex);
    figma.notify('Color variable created successfully');
    return variable;
  } catch (error) {
    console.error('Error creating variable:', error);
    figma.notify('Failed to create color variable');
  }
}

async function handleReplaceColor(hex: string, variableKey: string) {
  try {
    if (figma.currentPage.selection.length === 0) {
      figma.notify('Please select nodes to update');
      return;
    }

    for (const node of figma.currentPage.selection) {
      await replaceDirectFillsWithVariable(node, hex, variableKey);
    }
    
    figma.notify('Colors replaced successfully');
  } catch (error) {
    console.error('Error replacing colors:', error);
    figma.notify('Failed to replace colors');
  }
} 