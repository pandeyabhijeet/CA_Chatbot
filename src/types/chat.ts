export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'complete' | 'pending' | 'error';

export type MessageErrorKind = 'timeout' | 'rate_limit' | 'request_error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  errorKind: MessageErrorKind | undefined;
  createdAt: number;
}

export interface Conversation {
  messages: ChatMessage[];
  isAwaitingReply: boolean;
}
