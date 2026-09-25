import type { MessageRole } from '../types/chat';

export interface ConversationTurn {
  role: MessageRole;
  content: string;
}

export interface AssistantRequest {
  history: ReadonlyArray<ConversationTurn>;
  systemInstruction: string;
}

export type AssistantResult =
  | { kind: 'success'; text: string }
  | { kind: 'timeout' }
  | { kind: 'rate_limit' }
  | { kind: 'request_error'; safeMessage: string }
  | { kind: 'not_enabled' };

export interface AssistantClient {
  sendMessage: (request: AssistantRequest) => Promise<AssistantResult>;
}
