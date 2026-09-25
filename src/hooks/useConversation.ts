import { useCallback, useReducer, useRef } from 'react';
import { SYSTEM_INSTRUCTION } from '../api/config';
import { geminiClient } from '../api/geminiClient';
import type { AssistantClient, AssistantRequest, AssistantResult, ConversationTurn } from '../api/types';
import type { ChatMessage, Conversation, MessageErrorKind } from '../types/chat';

const initialConversation: Conversation = {
  messages: [],
  isAwaitingReply: false,
};

let fallbackId = 0;

function createMessageId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  fallbackId += 1;
  return `message-${Date.now()}-${fallbackId}`;
}

function createMessage(role: ChatMessage['role'], content: string, status: ChatMessage['status']): ChatMessage {
  return {
    id: createMessageId(),
    role,
    content,
    status,
    errorKind: undefined,
    createdAt: Date.now(),
  };
}

function completedTurns(messages: ChatMessage[]): ConversationTurn[] {
  return messages
    .filter((message) => message.status === 'complete')
    .map(({ role, content }) => ({ role, content }));
}

function findLatestRetryableAssistantIndex(messages: ChatMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'assistant' && message.status === 'error' && message.errorKind) {
      return index;
    }
  }
  return -1;
}

function findPreviousUserMessage(messages: ChatMessage[], assistantIndex: number): ChatMessage | undefined {
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user') {
      return message;
    }
  }
  return undefined;
}

type ConversationAction =
  | { type: 'submit'; userMessage: ChatMessage; assistantMessage: ChatMessage }
  | { type: 'retry'; assistantMessageId: string }
  | { type: 'resolve'; assistantMessageId: string; result: AssistantResult }
  | { type: 'new-chat' };

function conversationReducer(state: Conversation, action: ConversationAction): Conversation {
  switch (action.type) {
    case 'submit': {
      const messages = [...state.messages, action.userMessage, action.assistantMessage];
      return { messages, isAwaitingReply: true };
    }
    case 'retry': {
      const messages = state.messages.map((message) =>
        message.id === action.assistantMessageId
          ? { ...message, content: '', status: 'pending' as const, errorKind: undefined }
          : message,
      );
      return { messages, isAwaitingReply: true };
    }
    case 'resolve': {
      const messages = state.messages.map((message) => {
        if (message.id !== action.assistantMessageId) {
          return message;
        }

        if (action.result.kind === 'success') {
          return {
            ...message,
            content: action.result.text,
            status: 'complete' as const,
            errorKind: undefined,
          };
        }

        const errorKind: MessageErrorKind | undefined =
          action.result.kind === 'not_enabled' ? undefined : action.result.kind;
        return {
          ...message,
          content: '',
          status: 'error' as const,
          errorKind,
        };
      });
      return {
        messages,
        isAwaitingReply: messages.some((message) => message.status === 'pending'),
      };
    }
    case 'new-chat':
      return initialConversation;
  }
}

interface ActiveRequest {
  id: number;
  conversationEpoch: number;
}

export interface UseConversationResult {
  messages: ChatMessage[];
  isAwaitingReply: boolean;
  submit: (question: string) => void;
  retry: () => void;
  newChat: () => void;
}

export function useConversation(client: AssistantClient = geminiClient): UseConversationResult {
  const [conversation, dispatch] = useReducer(conversationReducer, initialConversation);
  const nextRequestId = useRef(0);
  const conversationEpoch = useRef(0);
  const activeRequest = useRef<ActiveRequest | null>(null);

  const startRequest = useCallback(
    async (request: AssistantRequest, assistantMessageId: string, active: ActiveRequest): Promise<void> => {
      try {
        const result = await client.sendMessage(request);
        if (
          activeRequest.current?.id !== active.id ||
          conversationEpoch.current !== active.conversationEpoch
        ) {
          return;
        }

        activeRequest.current = null;
        dispatch({ type: 'resolve', assistantMessageId, result });
      } catch {
        if (
          activeRequest.current?.id !== active.id ||
          conversationEpoch.current !== active.conversationEpoch
        ) {
          return;
        }

        activeRequest.current = null;
        dispatch({
          type: 'resolve',
          assistantMessageId,
          result: {
            kind: 'request_error',
            safeMessage: 'We could not get a response. Please try again.',
          },
        });
      }
    },
    [client],
  );

  const submit = useCallback(
    (rawQuestion: string): void => {
      const question = rawQuestion.trim();
      if (!question || activeRequest.current !== null) {
        return;
      }

      const userMessage = createMessage('user', question, 'complete');
      const assistantMessage = createMessage('assistant', '', 'pending');
      const requestId = ++nextRequestId.current;
      const active: ActiveRequest = {
        id: requestId,
        conversationEpoch: conversationEpoch.current,
      };
      activeRequest.current = active;

      const request: AssistantRequest = {
        history: [...completedTurns(conversation.messages), { role: 'user', content: question }],
        systemInstruction: SYSTEM_INSTRUCTION,
      };

      dispatch({ type: 'submit', userMessage, assistantMessage });
      void startRequest(request, assistantMessage.id, active);
    },
    [conversation.messages, startRequest],
  );

  const retry = useCallback((): void => {
    if (activeRequest.current !== null) {
      return;
    }

    const assistantIndex = findLatestRetryableAssistantIndex(conversation.messages);
    if (assistantIndex < 0) {
      return;
    }

    const userMessage = findPreviousUserMessage(conversation.messages, assistantIndex);
    const assistantMessage = conversation.messages[assistantIndex];
    if (!userMessage || !assistantMessage) {
      return;
    }

    const requestId = ++nextRequestId.current;
    const active: ActiveRequest = {
      id: requestId,
      conversationEpoch: conversationEpoch.current,
    };
    activeRequest.current = active;

    const request: AssistantRequest = {
      history: completedTurns(conversation.messages),
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    dispatch({ type: 'retry', assistantMessageId: assistantMessage.id });
    void startRequest(request, assistantMessage.id, active);
  }, [conversation.messages, startRequest]);

  const newChat = useCallback((): void => {
    conversationEpoch.current += 1;
    activeRequest.current = null;
    dispatch({ type: 'new-chat' });
  }, []);

  return {
    messages: conversation.messages,
    isAwaitingReply: conversation.isAwaitingReply,
    submit,
    retry,
    newChat,
  };
}
