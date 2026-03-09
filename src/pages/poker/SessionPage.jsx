import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Alert, AppBar, Avatar, Box, Button, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Divider, Drawer, IconButton, Snackbar,
  Stack, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PeopleIcon from '@mui/icons-material/People';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { usePokerSession } from '../../hooks/poker/usePokerSession';
import { useFirebaseConnection } from '../../hooks/useFirebaseConnection';
import { useNewVersionAvailable } from '../../hooks/useNewVersionAvailable';
import { usePokerVoting } from '../../hooks/poker/usePokerVoting';
import { usePresence } from '../../hooks/usePresence';
import StoryList, { STORY_LIST_WIDTH } from '../../components/poker/StoryList';
import VotingCards from '../../components/poker/VotingCards';
import ResultPanel from '../../components/poker/ResultPanel';
import ExportDialog from '../../components/poker/ExportDialog';
import HostTransferDialog from '../../components/HostTransferDialog';


function getUserInfo(sessionId) {
  try {
    const stored = localStorage.getItem(`poker_user_${sessionId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export default function PokerSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [userInfo, setUserInfo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [copySnack, setCopySnack] = useState(false);

  useEffect(() => {
    let info = getUserInfo(sessionId);
    if (!info) {
      const name = prompt('Enter your name to join this session:');
      if (!name?.trim()) {
        navigate('/poker');
        return;
      }
      info = { userId: uuidv4(), name: name.trim() };
      localStorage.setItem(`poker_user_${sessionId}`, JSON.stringify(info));
    }
    setUserInfo(info);
  }, [sessionId, navigate]);

  const { meta, members, loading, isHost, onlineMembers, ended, selectStory, revealVotes, restartVote, transferHost, endSession } = usePokerSession(
    sessionId,
    userInfo?.userId
  );

  usePresence(sessionId, userInfo?.userId, userInfo?.name, 'poker');
  const connected = useFirebaseConnection();
  const newVersion = useNewVersionAvailable();

  const { stories, votes, addStory, importStories, setFinalEstimate, castVote, clearVotes, deleteStory } = usePokerVoting(
    sessionId,
    meta?.currentStoryId
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionId);
    setCopySnack(true);
  };

  const handleLeave = () => navigate('/poker');

  const handleEndSession = () => {
    endSession();
    navigate('/poker');
  };

  const handleCastVote = (value) => {
    if (!userInfo) return;
    castVote(userInfo.userId, value);
  };

  const handleConfirmEstimate = async (estimate) => {
    if (!meta?.currentStoryId) return;
    await setFinalEstimate(meta.currentStoryId, estimate);
  };

  const handleReVote = async () => {
    await clearVotes();
    restartVote();
  };

  const handleReveal = () => revealVotes();

  if (!userInfo) return null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (ended) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Session ended</Typography>
        <Typography color="text.secondary" mb={3}>
          The host has ended this session.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/poker')}>Go Home</Button>
      </Container>
    );
  }

  if (!meta) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Session not found</Typography>
        <Typography color="text.secondary" mb={3}>
          This session does not exist or has expired.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/poker')}>Go Home</Button>
      </Container>
    );
  }

  const getInitials = (name) =>
    name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join('');

  const shortCode = sessionId.slice(0, 6).toUpperCase();
  const currentStory = meta.currentStoryId ? stories[meta.currentStoryId] : null;
  const myVote = meta.currentStoryId ? votes[userInfo.userId] : null;
  const revealed = meta.revealed;

  const voteStatusRow = meta.currentStoryId && (
    <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
      {onlineMembers.map(([uid, member]) => {
        const hasVoted = !!votes[uid];
        return (
          <Tooltip key={uid} title={`${member.name}: ${hasVoted ? (revealed ? votes[uid] : 'voted') : 'pending'}`}>
            <Stack alignItems="center" spacing={0.5}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: hasVoted ? 'primary.main' : 'grey.300' }}>
                {getInitials(member.name)}
              </Avatar>
              <Typography variant="caption" noWrap sx={{ maxWidth: 64, fontSize: '0.65rem' }}>
                {member.name}
              </Typography>
              {hasVoted
                ? <CheckCircleIcon sx={{ fontSize: 14 }} color="primary" />
                : <HourglassEmptyIcon sx={{ fontSize: 14 }} color="disabled" />}
            </Stack>
          </Tooltip>
        );
      })}
    </Stack>
  );

  const storyListContent = (
    <StoryList
      stories={stories}
      currentStoryId={meta.currentStoryId}
      isHost={isHost}
      onSelectStory={selectStory}
      onAddStory={addStory}
      onImportStories={importStories}
      onDeleteStory={deleteStory}
    />
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1} color="default">
        <Toolbar variant="dense">
          <Typography variant="h6" fontWeight={700} sx={{ mr: 1 }}>
            Poker
          </Typography>
          <Chip label={shortCode} size="small" sx={{ mr: 'auto' }} />
          <Chip
            icon={<PeopleIcon sx={{ fontSize: '1rem !important' }} />}
            label={onlineMembers.length}
            size="small"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Tooltip title="Export estimates">
            <IconButton size="small" onClick={() => setExportOpen(true)} sx={{ mr: 0.5 }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isHost && (
            <>
              <Button
                size="small"
                startIcon={<ManageAccountsIcon />}
                onClick={() => setAssignOpen(true)}
                sx={{ mr: 0.5 }}
              >
                Assign Host
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<StopCircleIcon />}
                onClick={() => setEndConfirmOpen(true)}
                sx={{ mr: 0.5 }}
              >
                End Session
              </Button>
            </>
          )}
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <PeopleIcon />
            </IconButton>
          )}
          <Tooltip title="Copy session ID">
            <IconButton size="small" onClick={handleCopyCode} sx={{ mr: 1 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button size="small" startIcon={<LogoutIcon />} onClick={handleLeave}>
            Leave
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar — desktop */}
        {!isMobile && (
          <Box
            sx={{
              width: STORY_LIST_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {storyListContent}
          </Box>
        )}

        {/* Mobile drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: STORY_LIST_WIDTH } }}
        >
          {storyListContent}
        </Drawer>

        {/* Main content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          {newVersion && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button size="small" color="inherit" onClick={() => window.location.reload()}>
                  Reload
                </Button>
              }
            >
              A new version is available. Reload when your session is finished to update.
            </Alert>
          )}
          {!connected && (
            <Alert severity="warning" sx={{ mb: 2 }}>Reconnecting to server…</Alert>
          )}
          {isMobile && (
            <Button
              size="small"
              startIcon={<PeopleIcon />}
              onClick={() => setDrawerOpen(true)}
              sx={{ mb: 2 }}
            >
              Stories
            </Button>
          )}

          {!currentStory && (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {isHost
                  ? 'Select a story from the sidebar to begin'
                  : 'Waiting for the host to select a story…'}
              </Typography>
            </Box>
          )}

          {currentStory && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {currentStory.formattedId && (
                  <Chip label={currentStory.formattedId} size="small" sx={{ mr: 1 }} />
                )}
                {currentStory.name}
              </Typography>
              {currentStory.description && (
                <Box
                  color="text.secondary"
                  mb={2}
                  sx={{ fontSize: '0.875rem', lineHeight: 1.6, '& p': { margin: 0 }, '& ul,& ol': { pl: 2 } }}
                  dangerouslySetInnerHTML={{ __html: currentStory.description }}
                />
              )}
              <Divider sx={{ mb: 2 }} />

              {voteStatusRow}

              {!revealed && (
                <>
                  <VotingCards
                    cardSet={meta.cardSet}
                    selectedValue={myVote}
                    onSelect={handleCastVote}
                    disabled={false}
                  />

                  {isHost && (
                    <Box mt={3}>
                      <Button
                        variant="contained"
                        onClick={handleReveal}
                        disabled={Object.keys(votes).length === 0}
                      >
                        Reveal Votes
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {revealed && (
                <ResultPanel
                  votes={votes}
                  members={members}
                  isHost={isHost}
                  onConfirmEstimate={handleConfirmEstimate}
                  onReVote={handleReVote}
                />
              )}
            </Box>
          )}
        </Box>
      </Box>

      <HostTransferDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onTransfer={(uid) => { transferHost(uid); setAssignOpen(false); }}
        members={members}
        currentUserId={userInfo.userId}
        description="Select a member to assign as the new host."
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        stories={stories}
      />

      <Dialog open={endConfirmOpen} onClose={() => setEndConfirmOpen(false)}>
        <DialogTitle>End session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This tool holds session data only in memory for the duration of the meeting — no data is stored on our servers beyond what is needed to run the live session. Ending the session immediately clears everything from the room.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleEndSession}>End Session</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copySnack}
        autoHideDuration={2000}
        onClose={() => setCopySnack(false)}
        message="Session ID copied to clipboard"
      />
    </Box>
  );
}
