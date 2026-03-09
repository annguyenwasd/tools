import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SessionPage from './pages/SessionPage.jsx';
import PokerLandingPage from './pages/poker/LandingPage.jsx';
import PokerSessionPage from './pages/poker/SessionPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/retro" element={<LandingPage />} />
      <Route path="/retro/session/:sessionId" element={<SessionPage />} />
      <Route path="/poker" element={<PokerLandingPage />} />
      <Route path="/poker/session/:sessionId" element={<PokerSessionPage />} />
    </Routes>
  );
}
