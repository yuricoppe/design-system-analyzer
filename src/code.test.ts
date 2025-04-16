import { createFigma } from 'figma-api-stub';
import { Styles, Component } from './types';
import { processFills, processEffects, processNode, collectComponents } from './code';

describe('Design System Analyzer', () => {
  let figma: PluginAPI;
  let styles: Styles;

  beforeEach(() => {
    figma = createFigma({
      simulateErrors: true,
      isWithoutTimeout: false
    });
    styles = {
      colors: [],
      textStyles: [],
      effects: [],
      components: []
    };
  });

  describe('Color Analysis', () => {
    test('should detect direct color usage', () => {
      // Create a rectangle with a solid fill
      const rect = figma.createRectangle();
      rect.fills = [{
        type: 'SOLID',
        color: { r: 1, g: 0, b: 0 },
        opacity: 1
      } as SolidPaint];

      // Process the fills
      const colors = processFills(rect.fills);

      // Verify the color was detected
      expect(colors).toHaveLength(1);
      expect(colors[0].hex).toBe('#ff0000');
      expect(colors[0].directUses).toBe(1);
      expect(colors[0].variableUses).toBe(0);
    });

    test('should detect color variable usage', async () => {
      // Create a color variable
      const collection = figma.variables.createVariableCollection('Colors');
      const variable = figma.variables.createVariable('red', collection, 'COLOR');
      variable.setValueForMode(collection.modes[0].modeId, { r: 1, g: 0, b: 0 });

      // Create a rectangle with the variable
      const rect = figma.createRectangle();
      const fill: SolidPaint = {
        type: 'SOLID',
        color: { r: 1, g: 0, b: 0 },
        opacity: 1,
        boundVariables: {
          color: {
            id: variable.id,
            type: 'VARIABLE_ALIAS'
          }
        }
      };
      rect.fills = [fill];

      // Process the fills
      const colors = processFills(rect.fills);

      // Verify the variable was detected
      expect(colors).toHaveLength(1);
      expect(colors[0].hex).toBe('#ff0000');
      expect(colors[0].directUses).toBe(0);
      expect(colors[0].variableUses).toBe(1);
      expect(colors[0].variableId).toBe(variable.id);
    });
  });

  describe('Component Analysis', () => {
    test('should detect components and instances', () => {
      // Create a component
      const component = figma.createComponent();
      component.name = 'Button';

      // Create an instance
      const instance = component.createInstance();

      // Process both nodes
      const components: Component[] = [];
      const processedIds = new Set<string>();
      collectComponents(component, components, processedIds);
      collectComponents(instance, components, processedIds);

      // Verify components were detected
      expect(processedIds.size).toBe(1); // Only the component should be counted, not the instance
    });
  });

  describe('Text Style Analysis', () => {
    test('should detect text styles', async () => {
      // Create a text style
      const style = figma.createTextStyle();
      style.name = 'Heading 1';

      // Create a text node with the style
      const text = figma.createText();
      text.textStyleId = style.id;

      // Process the node
      await processNode(text, styles);

      // Verify the text style was detected
      expect(styles.textStyles).toContain('Heading 1');
    });
  });

  describe('Effect Analysis', () => {
    test('should detect shadow effects', () => {
      // Create a node with a shadow
      const rect = figma.createRectangle();
      const shadowEffect: DropShadowEffect = {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offset: { x: 0, y: 4 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL'
      };
      rect.effects = [shadowEffect];

      // Process the effects
      processEffects(rect.effects, styles);

      // Verify the effect was detected
      expect(styles.effects).toHaveLength(1);
      expect(styles.effects[0]).toContain('DROP_SHADOW');
    });
  });
}); 