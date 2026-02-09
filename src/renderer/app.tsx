// src/renderer/app.tsx
import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useState, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { wsClient } from './services/wsClient';
import { ConnectionStatusBar } from './components/ConnectionStatusBar';
import { ChatList } from './components/ChatList';
import { MessageView } from './components/MessageView';
import { Database, Unplug } from 'lucide-react';

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
    <div className="flex flex-col h-screen bg-white">
      <ConnectionStatusBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-gray-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
            <h1 className="font-bold text-sm">Chats</h1>
            <div className="flex gap-1">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                title="Seed Database"
              >
                <Database size={16} />
              </button>
              <button
                onClick={handleSimulateDrop}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Simulate Connection Drop"
              >
                <Unplug size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <ChatList />
          </div>
        </div>
        {/* Main content */}
        <MessageView />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
