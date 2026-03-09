import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Container, Divider,
  IconButton, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import { createSession } from '../hooks/useSession';

const PRESET_FORMATS = [
  { label: 'Start / Stop / Continue', categories: ['Start', 'Stop', 'Continue'] },
  { label: 'Went Well / Improve / Action', categories: ['Went Well', 'Improve', 'Action Items'] },
  { label: '4Ls', categories: ['Liked', 'Learned', 'Lacked', 'Longed For'] },
  { label: 'Mad / Sad / Glad', categories: ['Mad', 'Sad', 'Glad'] },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // Create form
  const [hostName, setHostName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customCategories, setCustomCategories] = useState(['']);
  const [useCustom, setUseCustom] = useState(false);
  const [creating, setCreating] = useState(false);

  // Join form
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreate = async () => {
    if (!hostName.trim()) return;
    const categories = useCustom
      ? customCategories.filter((c) => c.trim())
      : PRESET_FORMATS[selectedPreset].categories;
    if (categories.length === 0) return;

    setCreating(true);
    const sessionId = uuidv4();
    const userId = uuidv4();
    localStorage.setItem(`retro_user_${sessionId}`, JSON.stringify({ userId, name: hostName.trim() }));
    try {
      await createSession(sessionId, userId, hostName.trim(), categories);
      navigate(`/retro/session/${sessionId}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  };

  const handleJoin = () => {
    if (!joinName.trim() || !joinCode.trim()) {
      setJoinError('Please enter both your name and a session code.');
      return;
    }
    const sessionId = joinCode.trim().toLowerCase();
    const userId = uuidv4();
    localStorage.setItem(`retro_user_${sessionId}`, JSON.stringify({ userId, name: joinName.trim() }));
    navigate(`/retro/session/${sessionId}`);
  };

  const addCategory = () => {
    if (customCategories.length < 5) setCustomCategories([...customCategories, '']);
  };

  const updateCategory = (i, val) => {
    const next = [...customCategories];
    next[i] = val;
    setCustomCategories(next);
  };

  const removeCategory = (i) => {
    setCustomCategories(customCategories.filter((_, idx) => idx !== i));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
        Retro
      </Typography>
      <Typography variant="subtitle1" textAlign="center" color="text.secondary" mb={4}>
        Real-time Sprint Retrospective for your team
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
                <Typography variant="subtitle2" mb={1}>Format</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                  {PRESET_FORMATS.map((p, i) => (
                    <Chip
                      key={i}
                      label={p.label}
                      onClick={() => { setSelectedPreset(i); setUseCustom(false); }}
                      color={!useCustom && selectedPreset === i ? 'primary' : 'default'}
                      variant={!useCustom && selectedPreset === i ? 'filled' : 'outlined'}
                    />
                  ))}
                  <Chip
                    label="Custom"
                    onClick={() => setUseCustom(true)}
                    color={useCustom ? 'secondary' : 'default'}
                    variant={useCustom ? 'filled' : 'outlined'}
                  />
                </Stack>

                {!useCustom && (
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {PRESET_FORMATS[selectedPreset].categories.map((c) => (
                      <Chip key={c} label={c} size="small" />
                    ))}
                  </Stack>
                )}

                {useCustom && (
                  <Stack spacing={1}>
                    {customCategories.map((cat, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <TextField
                          size="small"
                          label={`Category ${i + 1}`}
                          value={cat}
                          onChange={(e) => updateCategory(i, e.target.value)}
                          fullWidth
                        />
                        {customCategories.length > 1 && (
                          <IconButton size="small" onClick={() => removeCategory(i)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                    {customCategories.length < 5 && (
                      <Button startIcon={<AddIcon />} onClick={addCategory} size="small">
                        Add category
                      </Button>
                    )}
                  </Stack>
                )}
              </Box>

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
    </Container>
  );
}
