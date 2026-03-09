import { useState, useEffect } from 'react';
import {
  Avatar, Box, Button, Chip, Divider, Grid, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


function computeStats(votes, members) {
  const entries = Object.entries(votes).map(([userId, value]) => ({
    userId,
    name: members[userId]?.name || 'Unknown',
    value,
  }));

  const numeric = entries.map((e) => parseFloat(e.value)).filter((v) => !isNaN(v));
  const average = numeric.length > 0 ? (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(1) : null;

  const frequency = {};
  entries.forEach(({ value }) => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  const mostCommon = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  const consensus = entries.length > 0 && Object.keys(frequency).length === 1;

  return { entries, average, mostCommon, consensus };
}

export default function ResultPanel({ votes, members, isHost, onConfirmEstimate, onReVote }) {
  const { entries, average, mostCommon, consensus } = computeStats(votes, members);
  const [estimate, setEstimate] = useState(mostCommon);

  useEffect(() => {
    setEstimate(mostCommon);
  }, [mostCommon]);

  return (
    <Box>
      {consensus && (
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          <CheckCircleIcon color="success" />
          <Typography color="success.main" fontWeight={600}>Consensus!</Typography>
        </Stack>
      )}

      <Grid container spacing={2} mb={3}>
        {entries.map(({ userId, name, value }) => (
          <Grid item key={userId}>
            <Stack alignItems="center" spacing={0.5}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light', fontSize: '0.65rem' }}>
                {name}
              </Avatar>
              <Typography variant="caption" noWrap sx={{ maxWidth: 72 }}>{name}</Typography>
              <Chip label={value} size="small" variant="outlined" />
            </Stack>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={3} mb={3}>
        {average !== null && (
          <Box>
            <Typography variant="caption" color="text.secondary">Average</Typography>
            <Typography fontWeight={700}>{average}</Typography>
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">Most Common</Typography>
          <Typography fontWeight={700}>{mostCommon || '—'}</Typography>
        </Box>
      </Stack>

      {isHost && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <TextField
              label="Final estimate"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              size="small"
              sx={{ maxWidth: 200 }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={() => onConfirmEstimate(estimate)}
                disabled={!estimate.trim()}
              >
                Confirm Estimate
              </Button>
              <Button variant="outlined" onClick={onReVote}>
                Re-vote
              </Button>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
}
