figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'analyze-design-system') {
    try {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Please select at least one frame or component to analyze.'
        });
        return;
      }

      const analysis = {
        components: [],
        styles: {
          colors: [],
          textStyles: [],
          effects: []
        },
        inconsistencies: []
      };

      // Analyze each selected node
      const processNode = (node) => {
        // Analyze components
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
          analysis.components.push({
            name: node.name,
            type: node.type
          });
        }

        // Analyze styles
        if ('fills' in node && node.fills) {
          node.fills.forEach(fill => {
            if (fill.type === 'SOLID') {
              const color = fill.color;
              const colorStr = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
              if (!analysis.styles.colors.includes(colorStr)) {
                analysis.styles.colors.push(colorStr);
              }
            }
          });
        }

        // Check for text styles
        if (node.type === 'TEXT') {
          if (node.textStyleId) {
            const style = figma.getStyleById(node.textStyleId);
            if (style) {
              const textStyle = style.name;
              if (!analysis.styles.textStyles.includes(textStyle)) {
                analysis.styles.textStyles.push(textStyle);
              }
            }
          }
        }

        // Check for effects
        if ('effects' in node && node.effects) {
          node.effects.forEach(effect => {
            if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
              const effectStr = `${effect.type}: ${Math.round(effect.radius)}px`;
              if (!analysis.styles.effects.includes(effectStr)) {
                analysis.styles.effects.push(effectStr);
              }
            }
          });
        }

        // Check for inconsistencies
        if (node.type === 'INSTANCE') {
          const mainComponent = node.mainComponent;
          if (mainComponent) {
            const overrides = node.overrides;
            if (overrides && overrides.length > 0) {
              analysis.inconsistencies.push({
                message: `Instance "${node.name}" has ${overrides.length} overrides from main component "${mainComponent.name}"`
              });
            }
          }
        }

        // Process children
        if ('children' in node) {
          node.children.forEach(child => processNode(child));
        }
      };

      // Process all selected nodes
      selection.forEach(node => processNode(node));

      // Send analysis results to UI
      figma.ui.postMessage({
        type: 'analysis-results',
        data: analysis
      });

    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: 'An error occurred during analysis: ' + error.message
      });
    }
  }
}; 