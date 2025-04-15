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

figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'analyze-design-system') {
    try {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'error',
          error: 'Please select at least one element to analyze.'
        });
        return;
      }

      const results: AnalysisResults = {
        components: [],
        styles: [],
        inconsistencies: []
      };

      // Analyze components
      const componentMap = new Map<string, number>();
      const styleMap = new Map<string, number>();
      const inconsistencies: string[] = [];

      const processNode = (node: SceneNode) => {
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
          const name = node.name;
          componentMap.set(name, (componentMap.get(name) || 0) + 1);
        }

        if ('fills' in node) {
          const fills = node.fills as readonly Paint[];
          fills.forEach((fill: Paint) => {
            if (fill.type === 'SOLID' && fill.color) {
              const styleName = `Color: ${Math.round(fill.color.r * 255)},${Math.round(fill.color.g * 255)},${Math.round(fill.color.b * 255)}`;
              styleMap.set(styleName, (styleMap.get(styleName) || 0) + 1);
            }
          });
        }

        if ('children' in node) {
          node.children.forEach(child => processNode(child));
        }
      };

      selection.forEach(node => processNode(node));

      // Convert maps to arrays
      results.components = Array.from(componentMap.entries()).map(([name, count]) => ({
        name,
        count
      }));

      results.styles = Array.from(styleMap.entries()).map(([name, count]) => ({
        name,
        count
      }));

      // Check for inconsistencies
      if (results.components.length > 0) {
        const componentCounts = results.components.map(c => c.count);
        const avgCount = componentCounts.reduce((a, b) => a + b, 0) / componentCounts.length;
        
        results.components.forEach(component => {
          if (component.count < avgCount * 0.5) {
            inconsistencies.push(`Component "${component.name}" is used significantly less than others`);
          }
        });
      }

      results.inconsistencies = inconsistencies.map(message => ({ message }));

      figma.ui.postMessage({
        type: 'analysis-results',
        data: results
      });

    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  }
}; 