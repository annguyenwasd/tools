import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Divider, Paper, Stack, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';

function Section({ title, children }) {
  return (
    <Box component="section" mb={6}>
      <Typography variant="h5" fontWeight={700} gutterBottom>{title}</Typography>
      <Divider sx={{ mb: 3 }} />
      {children}
    </Box>
  );
}

function Step({ number, title, description, image }) {
  return (
    <Stack spacing={1.5} mb={4}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 32, height: 32, borderRadius: '50%',
            bgcolor: 'primary.main', color: 'primary.contrastText',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
          }}
        >
          {number}
        </Box>
        <Typography variant="h6" fontWeight={600}>{title}</Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ pl: 6 }}>{description}</Typography>
      {image && (
        <Box sx={{ pl: 6, pt: 1 }}>
          <Box
            component="img"
            src={image}
            alt={title}
            sx={{
              width: '100%',
              maxWidth: 860,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
            }}
          />
        </Box>
      )}
    </Stack>
  );
}

const S = (name) => `/screenshots/${name}`;

export default function HowToUsePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to home
      </Button>

      <Typography variant="h3" fontWeight={700} gutterBottom>
        How to Use
      </Typography>
      <Typography color="text.secondary" mb={6}>
        Step-by-step guide to running a Sprint Retrospective or Planning Poker session with your team.
      </Typography>

      {/* ── Why this exists ── */}
      <Section title="Why this tool exists">
        <Typography color="text.secondary" mb={3}>
          Built for our internal team — no fluff, no distractions, just the tools we actually need during sprints.
        </Typography>
        <Stack spacing={1.5}>
          {[
            { icon: '🔒', text: 'No ads, no tracking, no third-party analytics.' },
            { icon: '🗑️', text: 'Nothing is persisted beyond your session. Data is automatically deleted when everyone leaves or after 24 hours.' },
            { icon: '⚡', text: 'Lightweight and fast — designed for real team usage, not demos.' },
          ].map(({ icon, text }) => (
            <Stack key={text} direction="row" spacing={1.5} alignItems="flex-start">
              <Typography sx={{ flexShrink: 0 }}>{icon}</Typography>
              <Typography variant="body2" color="text.secondary">{text}</Typography>
            </Stack>
          ))}
        </Stack>
      </Section>

      {/* ── Basic features ── */}
      <Section title="Basic features">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <DarkModeIcon fontSize="small" sx={{ mt: 0.25, flexShrink: 0, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>Dark / Light mode</Typography>
              <Typography variant="body2" color="text.secondary">
                Toggle between dark and light themes using the icon in the top-right corner. Your preference is saved across sessions.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Section>

      <Paper
        variant="outlined"
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, mb: 6, borderRadius: 2 }}
      >
        <InfoOutlinedIcon fontSize="small" color="info" sx={{ mt: 0.25, flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary">
          We don't store any personal data. Sessions are temporary and deleted automatically when everyone leaves or after 24 hours.
        </Typography>
      </Paper>

      {/* ── Retro ── */}
      <Section title="Sprint Retrospective">
        <Step
          number={1}
          title="Create a session"
          description="Go to Retro, enter your name, choose a format (Start/Stop/Continue, 4Ls, etc.), and click Create Session. You become the host."
          image={S('03-retro-create-form.png')}
        />
        <Step
          number={2}
          title="Share the session code"
          description="Copy the 6-character code from the top bar and send it to your team. They join via the Join Session tab."
          image={S('04-retro-write.png')}
        />
        <Step
          number={3}
          title="Write phase — add cards"
          description="Everyone writes cards for each category. Cards are private until the host advances to the next phase."
          image={S('05-retro-write-card.png')}
        />
        <Step
          number={4}
          title="Vote phase — dot vote"
          description="All cards are revealed. Each member gets votes equal to the number of categories. Click a card to vote; click again to un-vote."
          image={S('06-retro-vote.png')}
        />
        <Step
          number={5}
          title="Discuss phase — top items first"
          description="Cards are sorted by votes. The team discusses the most important items. The host can jump to any phase using the stepper."
          image={S('07-retro-discuss.png')}
        />
        <Step
          number={6}
          title="Export"
          description="Download the results as JSON, Markdown, or Confluence wiki markup to save or share the retrospective."
          image={S('08-retro-export.png')}
        />
      </Section>

      {/* ── Poker ── */}
      <Section title="Planning Poker">
        <Step
          number={1}
          title="Create a session"
          description="Go to Poker, enter your name, pick a card set (Modified Fibonacci, Fibonacci, or T-Shirt sizing), and optionally import a Rally CSV before creating the session."
          image={S('10-poker-create-form.png')}
        />
        <Step
          number={2}
          title="Import stories from Rally CSV"
          description="Export your backlog from Rally as CSV (columns: FormattedID, Name, Description, PlanEstimate). Drag the file into the import dialog — existing estimates are pre-filled."
          image={S('11-poker-session-empty.png')}
        />
        <Step
          number={3}
          title="Add stories manually"
          description="Use the Add Story button in the sidebar to add individual stories during the session. The host can also delete stories."
          image={S('12-poker-story-added.png')}
        />
        <Step
          number={4}
          title="Vote on a story"
          description="The host selects a story from the sidebar. All members pick a card. Avatars with a checkmark show who has voted — without revealing their value."
          image={S('13-poker-voting.png')}
        />
        <Step
          number={5}
          title="Reveal votes"
          description="The host clicks Reveal Votes. All cards flip at once. The panel shows each member's vote, the average, the most common value, and a consensus indicator."
          image={S('15-poker-revealed.png')}
        />
        <Step
          number={6}
          title="Confirm the estimate"
          description="The host sets the final estimate (pre-filled with the most common vote) and clicks Confirm Estimate. The story is marked done and the next story can begin."
          image={S('15-poker-revealed.png')}
        />
        <Step
          number={7}
          title="Export estimates"
          description="Click the download icon in the top bar at any time to export all stories with final estimates as Rally-compatible CSV, Markdown, or JSON."
          image={S('16-poker-export.png')}
        />
      </Section>
    </Container>
  );
}
