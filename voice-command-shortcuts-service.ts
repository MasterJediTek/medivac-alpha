 * Voice Command Shortcuts Service
 * MediVac WACHS v8.8
 * 
 * Provides macro chains for voice commands - chain multiple commands together
 * like "Morning routine" that executes schedule check, medication reminders, weather, etc.
 */

export type MacroTriggerType = 'voice' | 'time' | 'location' | 'event' | 'gesture' | 'manual';
export type MacroStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type CommandActionType = 
  | 'check-schedule' | 'medication-reminder' | 'weather-check' | 'news-briefing'
  | 'send-message' | 'make-call' | 'set-alarm' | 'play-music' | 'control-lights'
  | 'check-vitals' | 'log-mood' | 'start-workout' | 'end-workout'
  | 'enable-dnd' | 'disable-dnd' | 'lock-device' | 'unlock-device'
  | 'open-app' | 'close-app' | 'navigate-screen' | 'trigger-sos'
  | 'sync-data' | 'backup-data' | 'custom';

export interface MacroCommand {
  id: string;
  action: CommandActionType;
  label: string;
  parameters: Record<string, unknown>;
  delay: number; // ms delay before executing
  timeout: number; // max execution time
  retryCount: number;
  continueOnFail: boolean;
  condition?: MacroCondition;
  feedback: {
    voice?: string;
    sound?: string;
    haptic?: number[];
    visual?: string;
  };
}

export interface MacroCondition {
  type: 'time' | 'day' | 'battery' | 'connection' | 'location' | 'variable' | 'previous-result';
  operator: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains' | 'between';
  value: unknown;
  secondValue?: unknown; // for 'between' operator
}

export interface MacroVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  value: unknown;
  persistent: boolean;
}

export interface Macro {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: MacroCategory;
  commands: MacroCommand[];
  triggers: MacroTrigger[];
  variables: MacroVariable[];
  status: MacroStatus;
  isBuiltIn: boolean;
  isEnabled: boolean;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  runCount: number;
  avgExecutionTime: number;
  successRate: number;
  tags: string[];
}

export type MacroCategory = 'morning' | 'evening' | 'health' | 'work' | 'emergency' | 'entertainment' | 'productivity' | 'custom';

export interface MacroTrigger {
  id: string;
  type: MacroTriggerType;
  config: Record<string, unknown>;
  isEnabled: boolean;
  lastTriggeredAt?: number;
}

export interface MacroExecution {
  id: string;
  macroId: string;
  startedAt: number;
  completedAt?: number;
  status: MacroStatus;
  currentCommandIndex: number;
  commandResults: MacroCommandResult[];
  triggeredBy: MacroTriggerType;
  variables: Record<string, unknown>;
}

export interface MacroCommandResult {
  commandId: string;
  success: boolean;
  startedAt: number;
  completedAt: number;