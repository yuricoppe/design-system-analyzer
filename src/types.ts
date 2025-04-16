export interface Component {
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'FRAME';
}

export interface ColorInfo {
  hex: string;
  name?: string;
  isVariable: boolean;
  variableId?: string;
}

export interface EffectInfo {
  name: string;
  type: string;
}

export interface RemoteInfo {
  name: string;
}

export interface VariableInfo {
  id: string;
  name: string;
  value: string;
  collection: string;
}

export interface ComponentInfo {
  name: string;
  type: 'INSTANCE' | 'FRAME' | 'COMPONENT';
}

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
  name: string;
}

export interface StylesData {
  colors: ColorInfo[];
  textStyles: string[];
  effects: EffectInfo[];
}

export interface AnalysisData {
  components: ComponentInfo[];
  styles: StylesData;
  inconsistencies: string[];
}

export type MessageType = 
  | 'analyze-selection'
  | 'create-variable'
  | 'replace-color'
  | 'analysis-results'
  | 'error';

export interface BaseMessage {
  type: MessageType;
}

export interface AnalyzeSelectionMessage extends BaseMessage {
  type: 'analyze-selection';
}

export interface CreateVariableMessage extends BaseMessage {
  type: 'create-variable';
  data: {
    hex: string;
  };
}

export interface ReplaceColorMessage extends BaseMessage {
  type: 'replace-color';
  data: {
    hex: string;
    variableKey: string;
  };
}

export interface AnalysisResultsMessage extends BaseMessage {
  type: 'analysis-results';
  data: AnalysisData;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
}

export type PluginMessage =
  | AnalyzeSelectionMessage
  | CreateVariableMessage
  | ReplaceColorMessage
  | AnalysisResultsMessage
  | ErrorMessage; 