export interface Component {
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'FRAME';
}

export interface ColorInfo {
  hex: string;
  directUses: number;
  variableUses: number;
  variableName?: string;
  variableId?: string;
  variableKey?: string;
}

export interface EffectInfo {
  name: string;
  type: string;
  visible: boolean;
}

export interface RemoteInfo {
  name: string;
}

export interface VariableInfo {
  id: string;
  key: string;
  name: string;
  value: RGB;
  collection: string;
  isFromLibrary: boolean;
  libraryName?: string;
  remote?: RemoteInfo;
  valuesByMode: Record<string, any>;
  resolvedType: string;
}

export interface ComponentInfo {
  name: string;
  id: string;
}

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
  name: string;
}

export interface AnalysisResult {
  components: ComponentInfo[];
  colors: ColorInfo[];
  textStyles: string[];
  effects: string[];
  inconsistencies: string[];
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
  | { type: 'analyze' }
  | { type: 'createVariable'; color: string }
  | { type: 'useVariable'; color: string; variableId: string }
  | { type: 'analysisResult'; result: AnalysisResult }
  | { type: 'error'; message: string }; 