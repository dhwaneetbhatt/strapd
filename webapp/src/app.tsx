import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { KeyboardProvider } from './contexts/keyboard-context';
import { Tools, CLI } from './pages';

function App() {
  return (
    <KeyboardProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Tools />} />
          <Route path="/tool/:toolId" element={<Tools />} />
          <Route path="/cli" element={<CLI />} />
        </Routes>
      </Router>
    </KeyboardProvider>
  );
}

export default App;
