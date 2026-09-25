# Contract: UI Component Props (internal interface)

This documents the internal contract between the conversation hook and the presentational
components, so implementation tasks have an agreed interface up front. These are type declarations
only — no component logic is included here (implementation belongs to the tasks/implementation
phase).

```ts
import type { ChatMessage } from "../../src/types/chat";
import type { RefObject } from "react";

export interface MessageListProps {
  messages: ReadonlyArray<ChatMessage>;
  onRetry: () => void;
}

export interface MessageInputProps {
  disabled: boolean; // true while isAwaitingReply, per FR-006
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (question: string) => void; // no-op for empty/whitespace-only input (FR-001)
}

export interface ThinkingIndicatorProps {
  visible: boolean;
}

export interface ErrorBannerProps {
  errorKind: "timeout" | "rate_limit" | "request_error";
  onRetry: () => void; // resubmits the same pending user question (FR-007)
}

export interface DisclaimerProps {
  // No props: renders the fixed, non-configurable disclaimer text (FR-005).
}

export interface NewChatButtonProps {
  onNewChat: () => void; // clears Conversation.messages, per FR-010
}
```

**Accessibility contract** (applies across the above components, per FR-011 and research.md §9):
- An `aria-live="polite"` region MUST announce when a message transitions to `complete` or `error`.
- `MessageInputProps.onSubmit` MUST be reachable via Enter key and via a visible Send `<button>`.
- Focus MUST return to the message input after submit, retry, or New chat.
