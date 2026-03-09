import { useState } from 'react';
import {
  Box, Button, Card, CardContent, CardHeader, Chip, Grid,
  IconButton, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';

export default function WritePhase({ categories, cards, userId, userName, onAddCard, onDeleteCard }) {
  const [drafts, setDrafts] = useState(() => Object.fromEntries(categories.map((c) => [c, ''])));

  const handleAdd = (category) => {
    const content = drafts[category];
    if (!content.trim()) return;
    onAddCard(category, content, userName);
    setDrafts((prev) => ({ ...prev, [category]: '' }));
  };

  const CATEGORY_COLORS = ['primary', 'secondary', 'success', 'warning', 'info'];

  return (
    <Grid container spacing={2}>
      {categories.map((category, ci) => {
        const catCards = Object.entries(cards).filter(([, c]) => c.category === category);
        const myCards = catCards.filter(([, c]) => c.authorId === userId);
        const othersCount = catCards.length - myCards.length;
        const color = CATEGORY_COLORS[ci % CATEGORY_COLORS.length];

        return (
          <Grid item xs={12} sm={6} md={4} key={category}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardHeader
                title={category}
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <Chip
                    label={`${catCards.length} card${catCards.length !== 1 ? 's' : ''}`}
                    size="small"
                    color={color}
                  />
                }
              />
              <CardContent>
                <Stack spacing={1} mb={2}>
                  {myCards.map(([cardId, card]) => (
                    <Box
                      key={cardId}
                      sx={{
                        p: 1.5,
                        bgcolor: `${color}.50`,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: `${color}.200`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {card.content}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteCard(cardId)}
                        sx={{ mt: -0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {othersCount > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: 'grey.400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <LockIcon fontSize="small" color="disabled" />
                      <Typography variant="body2" color="text.secondary">
                        {othersCount} hidden card{othersCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add a card…"
                    value={drafts[category]}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [category]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(category)}
                    fullWidth
                    multiline
                    maxRows={3}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleAdd(category)}
                    disabled={!drafts[category]?.trim()}
                  >
                    <AddIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
