import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhaseNav from '../PhaseNav';

describe('PhaseNav', () => {
  it('host: clickable steps and nav buttons shown', () => {
    render(
      <PhaseNav phase="write" isHost={true} onAdvance={vi.fn()} onGoToPhase={vi.fn()} />
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText(/Next/)).toBeInTheDocument();
    // Steps should be clickable (StepButton not disabled)
    expect(screen.getByText('Vote').closest('button')).not.toBeDisabled();
  });

  it('non-host: disabled steps, no nav buttons', () => {
    render(
      <PhaseNav phase="write" isHost={false} onAdvance={vi.fn()} onGoToPhase={vi.fn()} />
    );
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
    expect(screen.queryByText(/Next/)).not.toBeInTheDocument();
    // Steps should be disabled
    expect(screen.getByText('Vote').closest('button')).toBeDisabled();
  });

  it('back disabled on first phase', () => {
    render(
      <PhaseNav phase="write" isHost={true} onAdvance={vi.fn()} onGoToPhase={vi.fn()} />
    );
    expect(screen.getByText('Back').closest('button')).toBeDisabled();
  });

  it('next disabled on last phase', () => {
    render(
      <PhaseNav phase="export" isHost={true} onAdvance={vi.fn()} onGoToPhase={vi.fn()} />
    );
    expect(screen.getByText(/Next/).closest('button')).toBeDisabled();
  });

  it('clicking next calls onAdvance', () => {
    const onAdvance = vi.fn();
    render(
      <PhaseNav phase="write" isHost={true} onAdvance={onAdvance} onGoToPhase={vi.fn()} />
    );
    fireEvent.click(screen.getByText(/Next/));
    expect(onAdvance).toHaveBeenCalled();
  });
});
