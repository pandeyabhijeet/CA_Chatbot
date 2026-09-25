import { useState, type FormEvent, type KeyboardEvent, type RefObject } from 'react';

interface MessageInputProps {
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (question: string) => void;
}

export function MessageInput({ disabled, inputRef, onSubmit }: MessageInputProps) {
  const [draft, setDraft] = useState('');

  const submitDraft = (): void => {
    const question = draft.trim();
    if (!question || disabled) {
      return;
    }

    onSubmit(question);
    setDraft('');
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitDraft();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitDraft();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="question-input">
        Ask a question about Indian tax or accounting
      </label>
      <textarea
        ref={inputRef}
        id="question-input"
        className="composer__input"
        rows={1}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about tax, GST, TDS or accounting…"
        aria-describedby="composer-help"
      />
      <button
        className="composer__send"
        type="submit"
        disabled={disabled || draft.trim().length === 0}
        aria-label="Send message"
      >
        <span>Send</span>
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M3.5 10h12M10 4.5 15.5 10 10 15.5" />
        </svg>
      </button>
      <p className="composer__help" id="composer-help">
        Enter to send <span aria-hidden="true">·</span> Shift + Enter for a new line
      </p>
    </form>
  );
}
