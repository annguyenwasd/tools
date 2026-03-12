import { Routes, Route } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HomePage from './pages/HomePage.jsx';
import HowToUsePage from './pages/HowToUsePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SessionPage from './pages/SessionPage.jsx';
import PokerLandingPage from './pages/poker/LandingPage.jsx';
import PokerSessionPage from './pages/poker/SessionPage.jsx';
import { useColorMode } from './main.jsx';

export default function App() {
  const { mode, toggle } = useColorMode();

  return (
    <>
      <Box sx={{ position: 'fixed', top: 12, right: 12, zIndex: 1300 }}>
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          <IconButton onClick={toggle} size="small">
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-to-use" element={<HowToUsePage />} />
        <Route path="/retro" element={<LandingPage />} />
        <Route path="/retro/session/:sessionId" element={<SessionPage />} />
        <Route path="/poker" element={<PokerLandingPage />} />
        <Route path="/poker/session/:sessionId" element={<PokerSessionPage />} />
      </Routes>
    </>
  );
}
