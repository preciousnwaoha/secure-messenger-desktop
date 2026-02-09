// src/renderer/app.tsx

import { createRoot } from "react-dom/client";

function App() {
  return <div>Hello World</div>;
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  // Wrap the entire application with QueryClientProvider
  <App />,
);
