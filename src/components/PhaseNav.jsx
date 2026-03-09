import { Box, Button, Step, StepButton, Stepper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const PHASES = ['Write', 'Vote', 'Discuss', 'Export'];
const PHASE_KEYS = ['write', 'vote', 'discuss', 'export'];

export default function PhaseNav({ phase, isHost, onAdvance, onGoToPhase }) {
  const currentIndex = PHASE_KEYS.indexOf(phase);

  return (
    <Box sx={{ py: 2 }}>
      <Stepper activeStep={currentIndex} alternativeLabel nonLinear={isHost}>
        {PHASES.map((label, i) => (
          <Step key={label} completed={i < currentIndex}>
            {isHost ? (
              <StepButton onClick={() => onGoToPhase(PHASE_KEYS[i])}>
                {label}
              </StepButton>
            ) : (
              <StepButton disabled>{label}</StepButton>
            )}
          </Step>
        ))}
      </Stepper>

      {isHost && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => onGoToPhase(PHASE_KEYS[currentIndex - 1])}
            disabled={currentIndex === 0}
          >
            Back
          </Button>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={onAdvance}
            disabled={currentIndex === PHASES.length - 1}
          >
            Next: {PHASES[currentIndex + 1] ?? '—'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
