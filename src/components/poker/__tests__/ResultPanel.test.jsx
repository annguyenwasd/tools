import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultPanel from '../ResultPanel';

const members = {
  u1: { name: 'Alice' },
  u2: { name: 'Bob' },
  u3: { name: 'Carol' },
};

describe('ResultPanel', () => {
  it('shows average for numeric votes', () => {
    render(
      <ResultPanel
        votes={{ u1: '5', u2: '8', u3: '3' }}
        members={members}
        isHost={false}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.getByText('5.3')).toBeInTheDocument();
  });

  it('shows most common vote', () => {
    render(
      <ResultPanel
        votes={{ u1: '5', u2: '5', u3: '8' }}
        members={members}
        isHost={false}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.getByText('Most Common')).toBeInTheDocument();
    // The most common value "5" appears in multiple places; verify it exists at least once
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
  });

  it('shows consensus badge when all identical', () => {
    render(
      <ResultPanel
        votes={{ u1: '5', u2: '5', u3: '5' }}
        members={members}
        isHost={false}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.getByText('Consensus!')).toBeInTheDocument();
  });

  it('host sees estimate input and confirm/re-vote buttons', () => {
    render(
      <ResultPanel
        votes={{ u1: '5', u2: '5' }}
        members={members}
        isHost={true}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Final estimate')).toBeInTheDocument();
    expect(screen.getByText('Confirm Estimate')).toBeInTheDocument();
    expect(screen.getByText('Re-vote')).toBeInTheDocument();
  });

  it('non-host sees no controls', () => {
    render(
      <ResultPanel
        votes={{ u1: '5' }}
        members={members}
        isHost={false}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.queryByText('Confirm Estimate')).not.toBeInTheDocument();
    expect(screen.queryByText('Re-vote')).not.toBeInTheDocument();
  });

  it('confirm disabled when estimate is empty', () => {
    render(
      <ResultPanel
        votes={{}}
        members={members}
        isHost={true}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.getByText('Confirm Estimate').closest('button')).toBeDisabled();
  });

  it('calls onConfirmEstimate with estimate value', () => {
    const onConfirm = vi.fn();
    render(
      <ResultPanel
        votes={{ u1: '5', u2: '5' }}
        members={members}
        isHost={true}
        onConfirmEstimate={onConfirm}
        onReVote={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Confirm Estimate'));
    expect(onConfirm).toHaveBeenCalledWith('5');
  });

  it('calls onReVote when re-vote clicked', () => {
    const onReVote = vi.fn();
    render(
      <ResultPanel
        votes={{ u1: '5' }}
        members={members}
        isHost={true}
        onConfirmEstimate={vi.fn()}
        onReVote={onReVote}
      />
    );
    fireEvent.click(screen.getByText('Re-vote'));
    expect(onReVote).toHaveBeenCalled();
  });

  it('shows voter names and vote chips', () => {
    render(
      <ResultPanel
        votes={{ u1: '13' }}
        members={members}
        isHost={false}
        onConfirmEstimate={vi.fn()}
        onReVote={vi.fn()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // Vote value appears as chip + stats, so use getAllByText
    expect(screen.getAllByText('13').length).toBeGreaterThanOrEqual(1);
  });

  it('EDGE #14: estimate accepts any string (no card-set validation)', () => {
    const onConfirm = vi.fn();
    render(
      <ResultPanel
        votes={{ u1: '5' }}
        members={members}
        isHost={true}
        onConfirmEstimate={onConfirm}
        onReVote={vi.fn()}
      />
    );
    const input = screen.getByLabelText('Final estimate');
    fireEvent.change(input, { target: { value: 'banana' } });
    fireEvent.click(screen.getByText('Confirm Estimate'));
    expect(onConfirm).toHaveBeenCalledWith('banana');
  });
});
