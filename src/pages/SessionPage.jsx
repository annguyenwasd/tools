import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Alert, AppBar, Box, Button, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Divider, Drawer, IconButton, Snackbar,
  Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PeopleIcon from '@mui/icons-material/People';
import StopCircleIcon from '@mui/icons-material/StopCircle';

import { useSession } from '../hooks/useSession';
import { usePresence } from '../hooks/usePresence';
import { useFirebaseConnection } from '../hooks/useFirebaseConnection';
import { useNewVersionAvailable } from '../hooks/useNewVersionAvailable';
import { useCards } from '../hooks/useCards';

import PhaseNav from '../components/PhaseNav';
import MemberList from '../components/MemberList';
import WritePhase from '../components/WritePhase';
import VotePhase from '../components/VotePhase';
import DiscussPhase from '../components/DiscussPhase';
import ExportPhase from '../components/ExportPhase';
import HostTransferDialog from '../components/HostTransferDialog';

const DRAWER_WIDTH = 220;

function getUserInfo(sessionId) {
  try {
    const stored = localStorage.getItem(`retro_user_${sessionId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [userInfo, setUserInfo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [copySnack, setCopySnack] = useState(false);

  // Load or create user info
  useEffect(() => {
    let info = getUserInfo(sessionId);
    if (!info) {
      const name = prompt('Enter your name to join this session:');
      if (!name?.trim()) {
        navigate('/retro');
        return;
      }
      info = { userId: uuidv4(), name: name.trim() };
      localStorage.setItem(`retro_user_${sessionId}`, JSON.stringify(info));
    }
    setUserInfo(info);
  }, [sessionId, navigate]);

  const { meta, members, loading, isHost, onlineMembers, ended, advancePhase, goToPhase, transferHost, endSession } = useSession(
    sessionId,
    userInfo?.userId
  );

  usePresence(sessionId, userInfo?.userId, userInfo?.name);
  const connected = useFirebaseConnection();
  const newVersion = useNewVersionAvailable();

  const { cards, addCard, deleteCard, toggleVote, getVoteCount, hasVoted, getUserVoteCount } = useCards(
    sessionId,
    userInfo?.userId
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionId);
    setCopySnack(true);
  };

  const handleLeave = () => {
    if (isHost && onlineMembers.length > 1) {
      setTransferOpen(true);
    } else {
      navigate('/retro');
    }
  };

  const handleEndSession = () => {
    endSession();
    navigate('/retro');
  };

  const handleTransfer = (newHostId) => {
    transferHost(newHostId);
    setTransferOpen(false);
    navigate('/retro');
  };

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
        <Button variant="contained" onClick={() => navigate('/retro')}>Go Home</Button>
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
        <Button variant="contained" onClick={() => navigate('/retro')}>Go Home</Button>
      </Container>
    );
  }

  const maxVotes = meta.categories?.length || 3;
  const userVoteCount = getUserVoteCount();
  const shortCode = sessionId.slice(0, 6).toUpperCase();

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, py: 1 }}>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">Session code</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Chip label={shortCode} size="small" />
          <Tooltip title="Copy full ID">
            <IconButton size="small" onClick={handleCopyCode}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider sx={{ my: 1 }} />
      <MemberList members={members} hostId={meta.hostId} currentUserId={userInfo.userId} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1} color="default">
        <Toolbar variant="dense">
          <Typography variant="h6" fontWeight={700} sx={{ mr: 1 }}>
            Retro
          </Typography>
          <Chip label={shortCode} size="small" sx={{ mr: 'auto' }} />
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <PeopleIcon />
            </IconButton>
          )}
          {isHost && (
            <>
              <Button
                size="small"
                startIcon={<ManageAccountsIcon />}
                onClick={() => setAssignOpen(true)}
                sx={{ ml: 1 }}
              >
                Assign Host
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<StopCircleIcon />}
                onClick={() => setEndConfirmOpen(true)}
                sx={{ ml: 1 }}
              >
                End Session
              </Button>
            </>
          )}
          <Button
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLeave}
            sx={{ ml: 1 }}
          >
            Leave
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar — desktop */}
        {!isMobile && (
          <Box
            sx={{
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {drawerContent}
          </Box>
        )}

        {/* Mobile drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
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
          <PhaseNav phase={meta.phase} isHost={isHost} onAdvance={advancePhase} onGoToPhase={goToPhase} />
          <Divider sx={{ mb: 3 }} />

          {meta.phase === 'write' && (
            <WritePhase
              categories={meta.categories}
              cards={cards}
              userId={userInfo.userId}
              userName={userInfo.name}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
            />
          )}

          {meta.phase === 'vote' && (
            <VotePhase
              categories={meta.categories}
              cards={cards}
              userId={userInfo.userId}
              maxVotes={maxVotes}
              onToggleVote={toggleVote}
              getVoteCount={getVoteCount}
              hasVoted={hasVoted}
              userVoteCount={userVoteCount}
            />
          )}

          {meta.phase === 'discuss' && (
            <DiscussPhase
              categories={meta.categories}
              cards={cards}
              isHost={isHost}
              getVoteCount={getVoteCount}
            />
          )}

          {meta.phase === 'export' && (
            <ExportPhase
              cards={cards}
              meta={meta}
              getVoteCount={getVoteCount}
            />
          )}
        </Box>
      </Box>

      <HostTransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransfer={handleTransfer}
        members={members}
        currentUserId={userInfo.userId}
      />

      <HostTransferDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onTransfer={(uid) => { transferHost(uid); setAssignOpen(false); }}
        members={members}
        currentUserId={userInfo.userId}
        description="Select a member to assign as the new host."
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
