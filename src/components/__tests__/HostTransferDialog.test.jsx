import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HostTransferDialog from '../HostTransferDialog';

const members = {
  u1: { name: 'Alice', online: true },
  u2: { name: 'Bob', online: true },
  u3: { name: 'Carol', online: false },
  u4: { name: 'Dave', online: true },
};

describe('HostTransferDialog', () => {
  it('filters: online only, excludes current user', () => {
    render(
      <HostTransferDialog
        open={true}
        onClose={vi.fn()}
        onTransfer={vi.fn()}
        members={members}
        currentUserId="u1"
      />
    );
    // u1 excluded (current user), u3 excluded (offline)
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Carol')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Dave')).toBeInTheDocument();
  });

  it('shows empty state warning when no candidates', () => {
    render(
      <HostTransferDialog
        open={true}
        onClose={vi.fn()}
        onTransfer={vi.fn()}
        members={{ u1: { name: 'Alice', online: true } }}
        currentUserId="u1"
      />
    );
    expect(screen.getByText('No other online members available.')).toBeInTheDocument();
  });

  it('confirm disabled until selection', () => {
    render(
      <HostTransferDialog
        open={true}
        onClose={vi.fn()}
        onTransfer={vi.fn()}
        members={members}
        currentUserId="u1"
      />
    );
    expect(screen.getByText('Confirm').closest('button')).toBeDisabled();
  });

  it('calls onTransfer with selected uid', () => {
    const onTransfer = vi.fn();
    render(
      <HostTransferDialog
        open={true}
        onClose={vi.fn()}
        onTransfer={onTransfer}
        members={members}
        currentUserId="u1"
      />
    );
    fireEvent.click(screen.getByText('Bob'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(onTransfer).toHaveBeenCalledWith('u2');
  });

  it('resets selection on close', () => {
    const { rerender } = render(
      <HostTransferDialog
        open={true}
        onClose={vi.fn()}
        onTransfer={vi.fn()}
        members={members}
        currentUserId="u1"
      />
    );
    fireEvent.click(screen.getByText('Bob'));
    // Close and reopen
    rerender(
      <HostTransferDialog
        open={false}
        onClose={vi.fn()}
        onTransfer={vi.fn()}
        members={members}
        currentUserId="u1"
      />
    );
    rerender(
      <HostTransferDialog
        open={true}
        onClose={vi.fn()}
        onTransfer={vi.fn()}
        members={members}
        currentUserId="u1"
      />
    );
    // Selection should be reset
    expect(screen.getByText('Confirm').closest('button')).toBeDisabled();
  });
});
