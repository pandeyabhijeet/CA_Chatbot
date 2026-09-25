import type { MessageErrorKind } from '../types/chat';

interface ErrorBannerProps {
  errorKind: MessageErrorKind;
  onRetry: () => void;
}

const errorCopy: Record<MessageErrorKind, { title: string; detail: string }> = {
  timeout: {
    title: 'That took longer than expected.',
    detail: 'Please try your question again.',
  },
  rate_limit: {
    title: 'We’re receiving too many requests right now.',
    detail: 'Please wait a moment, then try again.',
  },
  request_error: {
    title: 'We couldn’t get a response.',
    detail: 'Your question is still here. Please try again.',
  },
};

export function ErrorBanner({ errorKind, onRetry }: ErrorBannerProps) {
  const copy = errorCopy[errorKind];

  return (
    <div className="error-banner">
      <span className="error-banner__icon" aria-hidden="true">!</span>
      <div className="error-banner__copy">
        <strong>{copy.title}</strong>
        <span>{copy.detail}</span>
      </div>
      <button className="error-banner__retry" type="button" onClick={() => onRetry()}>
        Retry
      </button>
    </div>
  );
}
