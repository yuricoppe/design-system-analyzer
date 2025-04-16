export interface Component {
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
}

export interface Styles {
  colors: string[];
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