import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from './index';

type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

interface ConnectionState {
  status: ConnectionStatus;
  lastSeen: number | null;
  retryCount: number;
}

const initialState: ConnectionState = {
  status: 'offline',
  lastSeen: null,
  retryCount: 0,
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    connected(state) {
      state.status = 'connected';
      state.retryCount = 0;
      state.lastSeen = Date.now();
    },
    reconnecting(state) {
      state.status = 'reconnecting';
      state.retryCount += 1;
    },
    disconnected(state) {
      state.status = 'offline';
    },
    pongReceived(state) {
      state.lastSeen = Date.now();
    },
  },
});

export const { connected, reconnecting, disconnected, pongReceived } =
  connectionSlice.actions;

export const selectConnectionStatus = (state: RootState): ConnectionStatus =>
  state.connection.status;
export const selectLastSeen = (state: RootState): number | null =>
  state.connection.lastSeen;
export const selectRetryCount = (state: RootState): number =>
  state.connection.retryCount;

export default connectionSlice.reducer;
