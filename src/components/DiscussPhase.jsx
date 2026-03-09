import { useState } from 'react';
import {
  Box, Card, CardContent, CardHeader, Chip, Grid,
  IconButton, Stack, Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

export default function DiscussPhase({ categories, cards, isHost, getVoteCount }) {
  const [discussed, setDiscussed] = useState({});

  const toggleDiscussed = (cardId) => {
    setDiscussed((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <Grid container spacing={2}>
      {categories.map((category) => {
        const catCards = Object.entries(cards)
          .filter(([, c]) => c.category === category)
          .sort((a, b) => getVoteCount(b[0]) - getVoteCount(a[0]));

        const discussedCount = catCards.filter(([id]) => discussed[id]).length;

        return (
          <Grid item xs={12} sm={6} md={4} key={category}>
            <Card elevation={2}>
              <CardHeader
                title={category}
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <Chip
                    label={`${discussedCount}/${catCards.length}`}
                    size="small"
                    color={discussedCount === catCards.length && catCards.length > 0 ? 'success' : 'default'}
                  />
                }
              />
              <CardContent>
                <Stack spacing={1}>
                  {catCards.map(([cardId, card]) => {
                    const voteCount = getVoteCount(cardId);
                    const isDone = discussed[cardId];

                    return (
                      <Box
                        key={cardId}
                        sx={{
                          p: 1.5,
                          bgcolor: isDone ? 'success.50' : 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: isDone ? 'success.300' : 'grey.200',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          opacity: isDone ? 0.6 : 1,
                        }}
                      >
                        {isHost && (
                          <IconButton
                            size="small"
                            color={isDone ? 'success' : 'default'}
                            onClick={() => toggleDiscussed(cardId)}
                            sx={{ mt: -0.25 }}
                          >
                            {isDone
                              ? <CheckCircleIcon fontSize="small" />
                              : <RadioButtonUncheckedIcon fontSize="small" />
                            }
                          </IconButton>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {card.content}
                        </Typography>
                        {voteCount > 0 && (
                          <Stack direction="row" alignItems="center" spacing={0.25}>
                            <HowToVoteIcon fontSize="small" color="primary" />
                            <Typography variant="caption" color="primary.main">
                              {voteCount}
                            </Typography>
                          </Stack>
                        )}
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
  );
}
