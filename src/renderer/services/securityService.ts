/**
 * SecurityService — encryption boundary for sensitive data.
 *
 * In production, encrypt() would use AES-256-GCM with per-chat keys
 * before writing to SQLite, and decrypt() would reverse the process
 * after reading. This placeholder passes data through unchanged but
 * establishes the architectural boundary.
 */
export const SecurityService = {
  encrypt(plaintext: string): string {
    return plaintext;
  },

  decrypt(ciphertext: string): string {
    return ciphertext;
  },

  /** Redact message body for safe logging. */
  redactBody(_body: string): string {
    return '[MESSAGE_CONTENT]';
  },
} as const;
