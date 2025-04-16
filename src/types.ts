export interface Component {
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
}

export interface ColorInfo {
  hex: string;
  variableName?: string;
  directUses: number;
  variableUses: number;
}

export interface Styles {
  colors: ColorInfo[];
  textStyles: string[];
  effects: string[];
}

export interface AnalysisData {
  components: Component[];
  styles: Styles;
  inconsistencies: string[];
}

export interface PluginMessage {
  type: 'analyze-design-system' | 'analysis-results' | 'error';
  data?: AnalysisData;
  message?: string;
} 