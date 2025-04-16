export interface Component {
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'FRAME';
}

export interface ColorInfo {
  hex: string;
  variableName?: string;
  variableId?: string;
  variableKey?: string;
  directUses: number;
  variableUses: number;
}

export interface VariableInfo {
  id: string;
  key: string;
  name: string;
  value: any;
  collection: string;
  isFromLibrary: boolean;
  libraryName?: string;
  remote: boolean;
  valuesByMode: { [modeId: string]: any };
  resolvedType: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  description: string;
}

export interface Styles {
  colors: ColorInfo[];
  textStyles: string[];
  effects: string[];
  components: ComponentInfo[];
}

export interface AnalysisData {
  components: Component[];
  styles: Styles;
  inconsistencies: string[];
}

export interface FindVariablesMessage {
  type: 'find-variables';
  data: {
    hex: string;
  };
}

export interface VariableOptionsMessage {
  type: 'variable-options';
  data: {
    hex: string;
    variables: VariableInfo[];
  };
}

export interface UseVariableMessage {
  type: 'use-variable';
  data: {
    hex: string;
    variableKey: string;
  };
}

export interface AnalysisMessage {
  type: 'analyze-design-system';
}

export interface AnalysisResultsMessage {
  type: 'analysis-results';
  data: AnalysisData;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type PluginMessage = 
  | FindVariablesMessage
  | VariableOptionsMessage
  | UseVariableMessage 
  | AnalysisMessage 
  | AnalysisResultsMessage 
  | ErrorMessage; 