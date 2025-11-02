import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Tools, CLI } from './pages';

function App() {
  return (
    <Router basename={process.env.NODE_ENV === 'production' ? '/strapd' : undefined}>
      <Routes>
        <Route path="/" element={<Tools />} />
        <Route path="/cli" element={<CLI />} />
      </Routes>
    </Router>
  );
}

export default App;
