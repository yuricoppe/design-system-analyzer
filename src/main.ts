// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 600 });

// Interface for Design System Metrics
interface DesignSystemMetrics {
  componentUsage: Map<string, number>;
  tokenUsage: Map<string, number>;
  inconsistencies: DesignSystemIssue[];
  adoption: {
    total: number;
    byTeam: Map<string, number>;
  };
}

interface DesignSystemIssue {
  type: 'component' | 'style' | 'token';
  message: string;
  nodeId: string;
  severity: 'high' | 'medium' | 'low';
}

interface AnalysisComponent {
  name: string;
  type: 'COMPONENT' | 'INSTANCE';
}

interface AnalysisStyle {
  type: string;
  value: string;
}

interface AnalysisInconsistency {
  message: string;
}

interface AnalysisData {
  components: AnalysisComponent[];
  styles: {
    colors: string[];
    textStyles: string[];
    effects: string[];
  };
  inconsistencies: AnalysisInconsistency[];
}

// Function to collect metrics
function collectMetrics(): DesignSystemMetrics {
  const metrics: DesignSystemMetrics = {
    componentUsage: new Map(),
    tokenUsage: new Map(),
    inconsistencies: [],
    adoption: {
      total: 0,
      byTeam: new Map()
    }
  };

  // Traverse all pages
  figma.root.children.forEach((page) => {
    // Traverse all nodes in the page
    page.children.forEach(node => {
      traverseNodes(node, metrics);
    });
  });

  return metrics;
}

// Function to traverse nodes and collect data
function traverseNodes(node: SceneNode, metrics: DesignSystemMetrics) {
  // Check if node is a component instance
  if (node.type === 'INSTANCE' && node.mainComponent) {
    const componentName = node.mainComponent.name;
    metrics.componentUsage.set(
      componentName,
      (metrics.componentUsage.get(componentName) || 0) + 1
    );
  }

  // Check for style usage
  if ('fills' in node && Array.isArray(node.fills)) {
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID') {
        const color = `${fill.color.r},${fill.color.g},${fill.color.b}`;
        metrics.tokenUsage.set(
          color,
          (metrics.tokenUsage.get(color) || 0) + 1
        );
      }
    });
  }

  // Check for text styles
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    const styleId = textNode.textStyleId;
    
    // Check if styleId is a string (not mixed)
    if (typeof styleId === 'string') {
      const style = figma.getStyleById(styleId);
      if (style) {
        metrics.tokenUsage.set(
          style.name,
          (metrics.tokenUsage.get(style.name) || 0) + 1
        );
      }
    }
  }

  // Check for inconsistencies
  checkInconsistencies(node, metrics);

  // Recursively check children
  if ('children' in node) {
    node.children.forEach(child => traverseNodes(child, metrics));
  }
}

// Function to check for design system inconsistencies
function checkInconsistencies(node: SceneNode, metrics: DesignSystemMetrics) {
  // Example checks - can be expanded based on your design system rules
  if (node.type === 'TEXT') {
    if (!node.textStyleId || node.textStyleId === figma.mixed) {
      metrics.inconsistencies.push({
        type: 'style',
        message: 'Text without consistent style',
        nodeId: node.id,
        severity: 'medium'
      });
    }
  }

  if (node.type === 'FRAME') {
    if (!node.layoutMode) {
      metrics.inconsistencies.push({
        type: 'component',
        message: 'Frame without layout mode',
        nodeId: node.id,
        severity: 'low'
      });
    }
  }
}

// Helper function to convert Map to Object
function mapToObject<T>(map: Map<string, T>): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'collect-metrics') {
    const metrics = collectMetrics();
    figma.ui.postMessage({
      type: 'metrics-data',
      data: {
        componentUsage: mapToObject(metrics.componentUsage),
        tokenUsage: mapToObject(metrics.tokenUsage),
        inconsistencies: metrics.inconsistencies,
        adoption: {
          total: metrics.adoption.total,
          byTeam: mapToObject(metrics.adoption.byTeam)
        }
      }
    });
  }

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

      const analysis: AnalysisData = {
        components: [],
        styles: {
          colors: [],
          textStyles: [],
          effects: []
        },
        inconsistencies: []
      };

      // Analyze each selected node
      const processNode = (node: SceneNode) => {
        // Analyze components
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
          analysis.components.push({
            name: node.name,
            type: node.type
          });
        }

        // Analyze styles
        if ('fills' in node && node.fills) {
          const fills = node.fills as Paint[];
          fills.forEach(fill => {
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
          const textNode = node as TextNode;
          const styleId = textNode.textStyleId;
          
          // Only process if styleId is a string (not mixed)
          if (typeof styleId === 'string') {
            const style = figma.getStyleById(styleId);
            if (style && !analysis.styles.textStyles.includes(style.name)) {
              analysis.styles.textStyles.push(style.name);
            }
          }
        }

        // Check for effects
        if ('effects' in node && node.effects) {
          const effects = node.effects as Effect[];
          effects.forEach(effect => {
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
            const overrides = 'overrides' in node ? (node as any).overrides : [];
            if (overrides && overrides.length > 0) {
              analysis.inconsistencies.push({
                message: `Instance "${node.name}" has ${overrides.length} overrides from main component "${mainComponent.name}"`
              });
            }
          }
        }

        // Process children
        if ('children' in node) {
          (node as ChildrenMixin).children.forEach(child => processNode(child));
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
        message: 'An error occurred during analysis: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  }
};
