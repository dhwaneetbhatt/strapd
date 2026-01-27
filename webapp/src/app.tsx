import { useEffect } from "react";
import {
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { KeyboardProvider } from "./contexts/keyboard-context";
import { SettingsProvider, useSettings } from "./contexts/settings-context";
import { CLI, Home, Tools } from "./pages";

function AppContent() {
  const { pinnedToolId } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we are at the root path and have a pinned tool
    // and we haven't already redirected (checked by history/state if needed, but simple check here is fine)
    if (location.pathname === "/" && pinnedToolId) {
      navigate(`/tool/${pinnedToolId}`);
    }
  }, [location.pathname, pinnedToolId, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tool/:toolId" element={<Tools />} />
      <Route path="/cli" element={<CLI />} />
    </Routes>
  );
}

function App() {
  return (
    <SettingsProvider>
      <KeyboardProvider>
        <Router>
          <AppContent />
        </Router>
      </KeyboardProvider>
    </SettingsProvider>
  );
}

export default App;
