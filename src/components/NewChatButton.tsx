interface NewChatButtonProps {
  onNewChat: () => void;
}

export function NewChatButton({ onNewChat }: NewChatButtonProps) {
  return (
    <button className="new-chat-button" type="button" onClick={onNewChat} aria-label="New chat">
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M10 4v12M4 10h12" />
      </svg>
      <span>New chat</span>
    </button>
  );
}
