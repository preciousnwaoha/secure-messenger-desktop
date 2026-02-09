export function logInfo(tag: string, payload: Record<string, unknown>): void {
  const safe = { ...payload };
  if ('body' in safe) {
    safe.body = '[MESSAGE_CONTENT]';
  }
  console.log(`[${tag}]`, safe);
}
