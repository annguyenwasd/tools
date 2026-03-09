import {
  Box, Card, CardContent, CardHeader, Chip, Grid,
  IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

export default function VotePhase({
  categories, cards, userId, maxVotes,
  onToggleVote, getVoteCount, hasVoted, userVoteCount,
}) {
  const remaining = maxVotes - userVoteCount;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Your votes:
        </Typography>
        {Array.from({ length: maxVotes }).map((_, i) => (
          <HowToVoteIcon
            key={i}
            fontSize="small"
            sx={{ color: i < userVoteCount ? 'primary.main' : 'text.disabled' }}
          />
        ))}
        <Typography variant="body2" color={remaining === 0 ? 'warning.main' : 'text.secondary'}>
          ({remaining} remaining)
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {categories.map((category) => {
          const catCards = Object.entries(cards)
            .filter(([, c]) => c.category === category)
            .sort((a, b) => getVoteCount(b[0]) - getVoteCount(a[0]));

          return (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <Card elevation={2}>
                <CardHeader
                  title={category}
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Chip label={`${catCards.length}`} size="small" />
                  }
                />
                <CardContent>
                  <Stack spacing={1}>
                    {catCards.map(([cardId, card]) => {
                      const voteCount = getVoteCount(cardId);
                      const voted = hasVoted(cardId);
                      const canVote = !voted && remaining > 0;

                      return (
                        <Box
                          key={cardId}
                          sx={{
                            p: 1.5,
                            bgcolor: voted ? 'primary.50' : 'grey.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: voted ? 'primary.300' : 'grey.200',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {card.content}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Tooltip title={voted ? 'Remove vote' : canVote ? 'Vote' : 'No votes left'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={voted ? 'primary' : 'default'}
                                  onClick={() => onToggleVote(cardId)}
                                  disabled={!voted && !canVote}
                                >
                                  <HowToVoteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Chip label={voteCount} size="small" color={voteCount > 0 ? 'primary' : 'default'} />
                          </Stack>
                        </Box>
                      );
                    })}
                    {catCards.length === 0 && (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No cards in this category
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
