function sanitize(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (typeof a === 'object' && a !== null && 'body' in (a as Record<string, unknown>)) {
      return { ...(a as Record<string, unknown>), body: '[MESSAGE_CONTENT]' };
    }
    return a;
  });
}

export const logger = {
  log: (...args: unknown[]): void => { console.log(...sanitize(args)); },
  warn: (...args: unknown[]): void => { console.warn(...sanitize(args)); },
  error: (...args: unknown[]): void => { console.error(...sanitize(args)); },
};
