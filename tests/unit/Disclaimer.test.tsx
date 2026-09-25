import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Disclaimer } from '../../src/components/Disclaimer';

describe('Disclaimer', () => {
  it('renders the required exact persistent wording', () => {
    const markup = renderToStaticMarkup(createElement(Disclaimer));
    expect(markup).toContain('For general information only. Consult a qualified CA for advice.');
  });
});
