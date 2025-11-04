import { Route, HashRouter as Router, Routes } from "react-router-dom";
import { KeyboardProvider } from "./contexts/keyboard-context";
import { CLI, Home, Tools } from "./pages";

function App() {
  return (
    <KeyboardProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tool/:toolId" element={<Tools />} />
          <Route path="/cli" element={<CLI />} />
        </Routes>
      </Router>
    </KeyboardProvider>
  );
}

export default App;
