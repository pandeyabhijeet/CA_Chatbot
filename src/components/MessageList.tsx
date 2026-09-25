import type { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ReadonlyArray<ChatMessage>;
  onRetry: () => void;
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  return (
    <ol className="message-list" aria-label="Conversation messages">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onRetry={onRetry} />
      ))}
    </ol>
  );
}
