import { SecurityService } from '../security';

describe('SecurityService', () => {
  const svc = new SecurityService();

  it('encrypt/decrypt roundtrip preserves plaintext', () => {
    const text = 'Hello, secure world!';
    expect(svc.decrypt(svc.encrypt(text))).toBe(text);
  });

  it('encrypt produces base64 output', () => {
    const encrypted = svc.encrypt('test');
    expect(encrypted).toBe(Buffer.from('test').toString('base64'));
  });

  it('roundtrips unicode text', () => {
    const text = 'Emoji: 🔐 and 日本語';
    expect(svc.decrypt(svc.encrypt(text))).toBe(text);
  });

  it('roundtrips empty string', () => {
    expect(svc.decrypt(svc.encrypt(''))).toBe('');
  });

  it('redactBody returns placeholder', () => {
    expect(svc.redactBody('secret message')).toBe('[MESSAGE_CONTENT]');
  });
});
