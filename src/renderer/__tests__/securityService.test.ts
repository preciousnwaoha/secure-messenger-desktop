import { SecurityService } from '../services/securityService';

describe('SecurityService (renderer)', () => {
  it('encrypt/decrypt roundtrip preserves plaintext', () => {
    const text = 'Hello, secure world!';
    expect(SecurityService.decrypt(SecurityService.encrypt(text))).toBe(text);
  });

  it('roundtrips unicode text', () => {
    const text = 'Emoji: 🔐 and 日本語';
    expect(SecurityService.decrypt(SecurityService.encrypt(text))).toBe(text);
  });

  it('roundtrips empty string', () => {
    expect(SecurityService.decrypt(SecurityService.encrypt(''))).toBe('');
  });

  it('redactBody returns placeholder', () => {
    expect(SecurityService.redactBody('secret')).toBe('[MESSAGE_CONTENT]');
  });
});
