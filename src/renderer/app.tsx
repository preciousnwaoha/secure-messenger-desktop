// src/renderer/app.tsx

import { createRoot } from "react-dom/client";
import { useCallback, useState } from "react";

function App() {
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState("");

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setSeedStatus("");
    try {
      await window.electron.db.seedDatabase();
      setSeedStatus("Seed complete");
    } catch (err: unknown) {
      setSeedStatus(`Seed failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(false);
    }
  }, []);

  return (
    <div>
      <h1>💖 Hello World!</h1>
      <p>Welcome to your Electron application.</p>
      <button onClick={handleSeed} disabled={seeding}>
        {seeding ? "Seeding..." : "Seed Database"}
      </button>
      {seedStatus && <p>{seedStatus}</p>}
    </div>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  // Wrap the entire application with QueryClientProvider
  <App />,
);
