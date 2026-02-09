import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useState, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { store } from './store';
import { wsClient } from './services/wsClient';
import { ConnectionStatusBar } from './components/ConnectionStatusBar';
import { ChatList } from './components/ChatList';
import { MessageView } from './components/MessageView';
import { Database, Unplug } from 'lucide-react';

const theme = createTheme();

function App(): ReactElement {
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    void wsClient.connect();
    return () => wsClient.stop();
  }, []);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      await window.electron.db.seedDatabase();
      window.location.reload();
    } catch (err: unknown) {
      console.error(
        'Seed failed:',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSeeding(false);
    }
  }, []);

  const handleSimulateDrop = useCallback(() => {
    void window.electron.ws.simulateDrop();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ConnectionStatusBar />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={{ width: 320, display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="bold">Chats</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleSeed}
                disabled={seeding}
                title="Seed Database"
              >
                <Database size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleSimulateDrop}
                title="Simulate Connection Drop"
              >
                <Unplug size={16} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <ChatList />
          </Box>
        </Box>
        {/* Main content */}
        <MessageView />
      </Box>
    </Box>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </Provider>,
);
