/**
 * Thin wrapper around chrome.i18n.getMessage for convenience.
 */
export function t(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions) || key;
}
