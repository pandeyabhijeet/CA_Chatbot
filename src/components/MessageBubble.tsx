import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ErrorBanner } from './ErrorBanner';
import { ThinkingIndicator } from './ThinkingIndicator';
import type { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const isDisabledNotice = isAssistant && message.status === 'error' && message.errorKind === undefined;

  return (
    <li className={`message message--${message.role}`} data-message-id={message.id}>
      <div className={`message__avatar ${isAssistant ? 'message__avatar--assistant' : ''}`} aria-hidden="true">
        {isAssistant ? 'C' : 'Y'}
      </div>
      <article className="message__body" aria-label={isAssistant ? 'CA Assist reply' : 'Your message'}>
        <div className="message__meta">
          <span>{isAssistant ? 'CA Assist' : 'You'}</span>
          {isAssistant && <span className="message__label">General information</span>}
        </div>
        {message.status === 'pending' && <ThinkingIndicator visible />}
        {message.status === 'complete' && (
          isAssistant ? (
            <div className="message__markdown">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="table-scroll">
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {message.content}
              </Markdown>
            </div>
          ) : (
            <p className="message__text">{message.content}</p>
          )
        )}
        {message.status === 'error' && message.errorKind && (
          <ErrorBanner errorKind={message.errorKind} onRetry={onRetry} />
        )}
        {isDisabledNotice && (
          <div className="disabled-notice">
            <strong>Live responses aren’t configured.</strong>
            <p>Your question hasn’t been sent. Configure a valid Gemini API key to enable replies.</p>
          </div>
        )}
      </article>
    </li>
  );
}
