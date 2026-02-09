import reducer, {
  connected,
  reconnecting,
  disconnected,
  pongReceived,
} from '../store/connectionSlice';

describe('connectionSlice', () => {
  it('has correct initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      status: 'offline',
      lastSeen: null,
      retryCount: 0,
    });
  });

  it('connected sets status and resets retryCount', () => {
    const prev = { status: 'reconnecting' as const, lastSeen: null as number | null, retryCount: 3 };
    const state = reducer(prev, connected());
    expect(state.status).toBe('connected');
    expect(state.retryCount).toBe(0);
    expect(typeof state.lastSeen).toBe('number');
  });

  it('reconnecting increments retryCount', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = reducer(state, reconnecting());
    expect(state.status).toBe('reconnecting');
    expect(state.retryCount).toBe(1);

    state = reducer(state, reconnecting());
    expect(state.retryCount).toBe(2);

    state = reducer(state, reconnecting());
    expect(state.retryCount).toBe(3);
  });

  it('disconnected sets status to offline', () => {
    const prev = { status: 'connected' as const, lastSeen: Date.now() as number | null, retryCount: 0 };
    const state = reducer(prev, disconnected());
    expect(state.status).toBe('offline');
  });

  it('pongReceived updates lastSeen without changing status or retryCount', () => {
    const prev = { status: 'connected' as const, lastSeen: null as number | null, retryCount: 0 };
    const state = reducer(prev, pongReceived());
    expect(state.status).toBe('connected');
    expect(state.retryCount).toBe(0);
    expect(typeof state.lastSeen).toBe('number');
  });

  it('handles a full connection lifecycle', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    expect(state.status).toBe('offline');
    expect(state.retryCount).toBe(0);

    state = reducer(state, reconnecting());
    expect(state.status).toBe('reconnecting');
    expect(state.retryCount).toBe(1);

    state = reducer(state, reconnecting());
    expect(state.retryCount).toBe(2);

    state = reducer(state, connected());
    expect(state.status).toBe('connected');
    expect(state.retryCount).toBe(0);

    state = reducer(state, disconnected());
    expect(state.status).toBe('offline');

    state = reducer(state, reconnecting());
    expect(state.status).toBe('reconnecting');
    expect(state.retryCount).toBe(1);
  });
});
