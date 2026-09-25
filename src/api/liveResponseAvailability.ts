export function isLiveResponsesEnabled(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim());
}
