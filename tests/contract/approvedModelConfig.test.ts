import { describe, expect, it } from 'vitest';
import { GENERATE_CONTENT_ENDPOINT, MODEL_ID, SYSTEM_INSTRUCTION } from '../../src/api/config';

describe('approved model configuration', () => {
  it('uses only the fixed model, endpoint, and CA-focused system prompt', () => {
    expect(MODEL_ID).toBe('gemma-4-26b-a4b-it');
    expect(GENERATE_CONTENT_ENDPOINT).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
    );
    expect(SYSTEM_INSTRUCTION).toContain('Indian income tax, GST, TDS, ITR filing, and accounting');
  });
});
