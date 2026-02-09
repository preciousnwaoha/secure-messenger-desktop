// src/main/security.ts
/**
 * SecurityService — main-process encryption boundary.
 *
 * In production this would use AES-256-GCM with per-chat keys stored in
 * the OS secure keychain (Electron safeStorage). The base64 encoding here
 * is a visible placeholder that proves the roundtrip works without
 * introducing real key-management complexity.
 *
 * Integration points (not wired yet — see README for rationale):
 *   • db.insertMessage → SecurityService.encrypt(body) before INSERT
 *   • db.getMessages   → SecurityService.decrypt(row.body) after SELECT
 */
export class SecurityService {
  encrypt(plaintext: string): string {
    return Buffer.from(plaintext, 'utf-8').toString('base64');
  }

  decrypt(ciphertext: string): string {
    return Buffer.from(ciphertext, 'base64').toString('utf-8');
  }

  /** Redact message body for safe logging — no plaintext in logs. */
  redactBody(_body: string): string {
    return '[MESSAGE_CONTENT]';
  }
}

export const securityService = new SecurityService();
