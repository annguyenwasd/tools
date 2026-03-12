import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Container, Grid, Paper, Typography,
} from '@mui/material';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import CasinoIcon from '@mui/icons-material/Casino';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const APPS = [
  {
    title: 'Retro',
    icon: <StickyNote2Icon sx={{ fontSize: 48 }} color="primary" />,
    description: 'Real-time Sprint Retrospective for your team. Write, vote, and discuss action items together.',
    path: '/retro',
  },
  {
    title: 'Poker',
    icon: <CasinoIcon sx={{ fontSize: 48 }} color="secondary" />,
    description: 'Planning Poker for agile estimation. Import stories from Rally CSV and vote as a team.',
    path: '/poker',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
        Team Tools
      </Typography>
      <Typography variant="subtitle1" textAlign="center" color="text.secondary" mb={2}>
        Collaborative tools for agile teams
      </Typography>

      <Paper
        variant="outlined"
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, mb: 4, borderRadius: 2 }}
      >
        <InfoOutlinedIcon fontSize="small" color="info" sx={{ mt: 0.25, flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary">
          We don't store any personal data. Sessions are temporary and deleted automatically when everyone leaves or after 24 hours.
        </Typography>
      </Paper>

      <Box textAlign="center" mb={4}>
        <Button variant="text" onClick={() => navigate('/how-to-use')}>
          How to use these tools →
        </Button>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {APPS.map((app) => (
          <Grid item xs={12} sm={6} key={app.title}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4 }}>
                <Box mb={2}>{app.icon}</Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {app.title}
                </Typography>
                <Typography color="text.secondary" mb={3} sx={{ flex: 1 }}>
                  {app.description}
                </Typography>
                <Button variant="contained" size="large" onClick={() => navigate(app.path)}>
                  Launch
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
