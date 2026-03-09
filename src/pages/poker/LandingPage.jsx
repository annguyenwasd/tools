import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, Container,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { ref, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../firebase';
import { createPokerSession } from '../../hooks/poker/usePokerSession';
import { CARD_SET_LABELS } from '../../components/poker/VotingCards';
import CSVImportDialog from '../../components/poker/CSVImportDialog';

const CARD_SETS = Object.entries(CARD_SET_LABELS);

export default function PokerLandingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // Create form
  const [hostName, setHostName] = useState('');
  const [cardSet, setCardSet] = useState('modified_fibonacci');
  const [importOpen, setImportOpen] = useState(false);
  const [importedStories, setImportedStories] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreate = async () => {
    if (!hostName.trim()) return;
    setCreating(true);
    const sessionId = uuidv4();
    const userId = uuidv4();
    localStorage.setItem(`poker_user_${sessionId}`, JSON.stringify({ userId, name: hostName.trim() }));
    localStorage.setItem(`poker_host_${sessionId}`, userId);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
    try {
      await Promise.race([
        (async () => {
          await createPokerSession(sessionId, userId, hostName.trim(), cardSet);
          if (importedStories.length > 0) {
            const updates = {};
            importedStories.forEach((story, i) => {
              const key = `imported_${Date.now()}_${i}`;
              updates[key] = {
                formattedId: story.formattedId || '',
                name: story.name,
                description: story.description || '',
                finalEstimate: story.planEstimate || '',
                order: i,
              };
            });
            await update(ref(db, `poker/${sessionId}/stories`), updates);
          }
        })(),
        timeout,
      ]);
      navigate(`/poker/session/${sessionId}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
      setCreateError(e.message === 'timeout' ? 'Connection timed out. Check your network and try again.' : 'Failed to create session. Please try again.');
    }
  };

  const handleJoin = () => {
    if (!joinName.trim() || !joinCode.trim()) {
      setJoinError('Please enter both your name and a session code.');
      return;
    }
    const sessionId = joinCode.trim().toLowerCase();
    const userId = uuidv4();
    localStorage.setItem(`poker_user_${sessionId}`, JSON.stringify({ userId, name: joinName.trim() }));
    navigate(`/poker/session/${sessionId}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
        Poker
      </Typography>
      <Typography variant="subtitle1" textAlign="center" color="text.secondary" mb={4}>
        Planning Poker for agile estimation
      </Typography>

      <Card elevation={3}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Create Session" />
          <Tab label="Join Session" />
        </Tabs>
        <CardContent sx={{ p: 3 }}>
          {tab === 0 ? (
            <Stack spacing={3}>
              <TextField
                label="Your name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                fullWidth
                autoFocus
              />

              <Box>
                <Typography variant="subtitle2" mb={1}>Card Set</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {CARD_SETS.map(([key, label]) => (
                    <Chip
                      key={key}
                      label={label}
                      onClick={() => setCardSet(key)}
                      color={cardSet === key ? 'primary' : 'default'}
                      variant={cardSet === key ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" mb={1}>Stories (optional)</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setImportOpen(true)}
                >
                  {importedStories.length > 0
                    ? `${importedStories.length} stories ready`
                    : 'Import from CSV'}
                </Button>
                {importedStories.length > 0 && (
                  <Button size="small" sx={{ ml: 1 }} onClick={() => setImportedStories([])}>
                    Clear
                  </Button>
                )}
              </Box>

              {createError && (
                <Alert severity="error" onClose={() => setCreateError('')}>{createError}</Alert>
              )}
              <Button
                variant="contained"
                size="large"
                onClick={handleCreate}
                disabled={!hostName.trim() || creating}
              >
                {creating ? 'Creating…' : 'Create Session'}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <TextField
                label="Your name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                label="Session code"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
                fullWidth
                error={!!joinError}
                helperText={joinError}
                placeholder="Paste the full session ID"
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleJoin}
                disabled={!joinName.trim() || !joinCode.trim()}
              >
                Join Session
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <CSVImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(stories) => { setImportedStories(stories); setImportOpen(false); }}
      />
    </Container>
  );
}
