import { Box, Grid, Paper, Typography } from '@mui/material';

export const CARD_SETS = {
  modified_fibonacci: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'],
  fibonacci: ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
};

export const CARD_SET_LABELS = {
  modified_fibonacci: 'Modified Fibonacci',
  fibonacci: 'Fibonacci',
  tshirt: 'T-Shirt',
};

export default function VotingCards({ cardSet = 'modified_fibonacci', selectedValue, onSelect, disabled }) {
  const cards = CARD_SETS[cardSet] || CARD_SETS.modified_fibonacci;

  return (
    <Box>
      <Grid container spacing={1.5} justifyContent="center">
        {cards.map((value) => {
          const isSelected = selectedValue === value;
          return (
            <Grid item key={value}>
              <Paper
                elevation={isSelected ? 6 : 1}
                onClick={() => !disabled && onSelect(value)}
                sx={{
                  width: 64,
                  height: 96,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.main' : 'background.paper',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  transition: 'all 0.15s ease',
                  opacity: disabled ? 0.6 : 1,
                  userSelect: 'none',
                  '&:hover': !disabled ? {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  } : {},
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  {value}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
