import { DISCLAIMER_TEXT } from '../api/config';

export function Disclaimer() {
  return (
    <footer className="disclaimer">
      <span className="disclaimer__mark" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="M8 1.5 13.5 4v4.2c0 3.1-2.1 5.4-5.5 6.3-3.4-.9-5.5-3.2-5.5-6.3V4L8 1.5Z" />
          <path d="m5.6 7.9 1.5 1.5 3.4-3.5" />
        </svg>
      </span>
      <p>{DISCLAIMER_TEXT}</p>
    </footer>
  );
}
