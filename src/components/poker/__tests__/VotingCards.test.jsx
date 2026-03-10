import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VotingCards, { CARD_SETS } from '../VotingCards';

describe('VotingCards', () => {
  it('renders correct cards for modified_fibonacci set', () => {
    render(<VotingCards cardSet="modified_fibonacci" onSelect={vi.fn()} />);
    for (const value of CARD_SETS.modified_fibonacci) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('renders correct cards for fibonacci set', () => {
    render(<VotingCards cardSet="fibonacci" onSelect={vi.fn()} />);
    for (const value of CARD_SETS.fibonacci) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('renders correct cards for tshirt set', () => {
    render(<VotingCards cardSet="tshirt" onSelect={vi.fn()} />);
    for (const value of CARD_SETS.tshirt) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('falls back to modified_fibonacci for unknown set', () => {
    render(<VotingCards cardSet="unknown_set" onSelect={vi.fn()} />);
    for (const value of CARD_SETS.modified_fibonacci) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('calls onSelect on click', () => {
    const onSelect = vi.fn();
    render(<VotingCards cardSet="tshirt" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('M'));
    expect(onSelect).toHaveBeenCalledWith('M');
  });

  it('does not call onSelect when disabled', () => {
    const onSelect = vi.fn();
    render(<VotingCards cardSet="tshirt" onSelect={onSelect} disabled />);
    fireEvent.click(screen.getByText('M'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('highlights selected card', () => {
    const { container } = render(
      <VotingCards cardSet="tshirt" selectedValue="M" onSelect={vi.fn()} />
    );
    // The selected card should have elevation 6 (applied as MuiPaper-elevation6)
    const mCard = screen.getByText('M').closest('.MuiPaper-root');
    expect(mCard).toHaveClass('MuiPaper-elevation6');
  });
});
