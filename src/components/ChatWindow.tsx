import { useEffect, useRef } from 'react';
import { Disclaimer } from './Disclaimer';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { NewChatButton } from './NewChatButton';
import { useConversation } from '../hooks/useConversation';
import { isLiveResponsesEnabled } from '../api/liveResponseAvailability';
import type { AssistantClient } from '../api/types';
import type { ChatMessage } from '../types/chat';

const suggestedQuestions = [
  'What is the ITR filing due date for salaried individuals?',
  'Which ITR form should I use for freelance income?',
  'When do I need to register for GST?',
  'How is TDS on rent calculated?',
  'What deductions are available under Section 80C?',
];

function latestAssistantMessage(messages: ChatMessage[]): ChatMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'assistant') {
      return message;
    }
  }
  return undefined;
}

function messageAnnouncement(message: ChatMessage | undefined): string {
  if (!message || message.status === 'pending') {
    return '';
  }
  if (message.status === 'complete') {
    return `New CA Assist reply: ${message.content}`;
  }
  if (message.errorKind === 'timeout') {
    return 'The response timed out. You can retry your question.';
  }
  if (message.errorKind === 'rate_limit') {
    return 'The service is receiving too many requests. Please retry later.';
  }
  if (message.errorKind === 'request_error') {
    return 'A response could not be retrieved. You can retry your question.';
  }
  return 'Live responses are not configured. Your question was not sent.';
}

interface ChatWindowProps {
  client?: AssistantClient;
}

export function ChatWindow({ client }: ChatWindowProps) {
  const { messages, isAwaitingReply, submit, retry, newChat } = useConversation(client);
  const liveResponsesEnabled = isLiveResponsesEnabled();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldReturnFocus = useRef(false);
  const lastAssistant = latestAssistantMessage(messages);
  const announcement = messageAnnouncement(lastAssistant);

  useEffect(() => {
    if (!shouldReturnFocus.current || isAwaitingReply) {
      return;
    }
    inputRef.current?.focus();
    shouldReturnFocus.current = false;
  }, [isAwaitingReply, messages]);

  const handleSubmit = (question: string): void => {
    shouldReturnFocus.current = true;
    submit(question);
  };

  const handleRetry = (): void => {
    shouldReturnFocus.current = true;
    retry();
  };

  const handleNewChat = (): void => {
    shouldReturnFocus.current = true;
    newChat();
    inputRef.current?.focus();
  };

  return (
    <main className="app-shell">
      <section className="chat-card" aria-label="CA Assist chat">
        <header className="topbar">
          <a className="brand" href="#main-content">
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 36 36" focusable="false">
                <path d="M18 3.5 31 10v8.2c0 7.2-4.9 12-13 14.3C9.9 30.2 5 25.4 5 18.2V10l13-6.5Z" />
                <path d="m11.5 18.1 4.2 4.2 9-9.2" />
              </svg>
            </span>
            <span className="brand__copy">
              <strong>CA Assist</strong>
              <span>Clear answers for your finances</span>
            </span>
          </a>
          <div className="topbar__actions">
            <span className={`preview-pill${liveResponsesEnabled ? ' preview-pill--active' : ''}`}>
              <span aria-hidden="true" />
              {liveResponsesEnabled ? 'Live responses' : 'Preview mode'}
            </span>
            <NewChatButton onNewChat={handleNewChat} />
          </div>
        </header>

        <div className="chat-main" id="main-content">
          {messages.length === 0 ? (
            <section className="welcome" aria-labelledby="welcome-title">
              <div className="welcome__eyebrow">
                <span className="welcome__sparkle" aria-hidden="true">✳</span>
                <span>INDIAN TAX &amp; ACCOUNTING, MADE CLEAR</span>
              </div>
              <h1 id="welcome-title">
                Good questions deserve <em>clear answers.</em>
              </h1>
              <p className="welcome__intro">
                Your friendly guide to Indian income tax, GST, TDS, ITR filing and accounting.
              </p>

              {liveResponsesEnabled ? (
                <aside className="preview-note live-note" aria-label="Live response availability">
                  <span className="preview-note__icon" aria-hidden="true">i</span>
                  <p>
                    <strong>Live responses are on.</strong> Questions are sent to Google Gemini.
                    This browser key is public to anyone who can access the site; restrict it to Gemini
                    and monitor its quota.
                  </p>
                </aside>
              ) : (
                <aside className="preview-note" aria-label="Live response availability">
                  <span className="preview-note__icon" aria-hidden="true">i</span>
                  <p>
                    <strong>Preview mode</strong> — live responses are currently off. Questions stay in
                    this browser and won’t be sent to an AI service.
                  </p>
                </aside>
              )}

              <div className="suggestions" aria-label="Suggested questions">
                <p className="suggestions__title">A few things you can ask</p>
                <div className="suggestions__list">
                  {suggestedQuestions.map((question) => (
                    <button
                      className="suggestion-chip"
                      key={question}
                      type="button"
                      onClick={() => handleSubmit(question)}
                    >
                      <span>{question}</span>
                      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <path d="M3 8h10M8 3l5 5-5 5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <div className="conversation-area">
              <MessageList messages={messages} onRetry={handleRetry} />
              <div className="conversation-area__end" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="composer-area">
          <MessageInput
            disabled={isAwaitingReply}
            inputRef={inputRef}
            onSubmit={handleSubmit}
          />
        </div>

        <Disclaimer />
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>
    </main>
  );
}
