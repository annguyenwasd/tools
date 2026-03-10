import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MemberList from '../MemberList';

const members = {
  u1: { name: 'Alice', online: true, joinedAt: 100 },
  u2: { name: 'Bob', online: true, joinedAt: 200 },
  u3: { name: 'Carol', online: false, joinedAt: 150 },
};

describe('MemberList', () => {
  it('sorts by joinedAt', () => {
    const { container } = render(
      <MemberList members={members} hostId="u1" currentUserId="u1" />
    );
    const items = container.querySelectorAll('.MuiListItem-root');
    expect(items[0].textContent).toContain('Alice');
    expect(items[1].textContent).toContain('Carol');
    expect(items[2].textContent).toContain('Bob');
  });

  it('shows "(you)" for current user', () => {
    render(<MemberList members={members} hostId="u1" currentUserId="u1" />);
    expect(screen.getByText(/\(you\)/)).toBeInTheDocument();
  });

  it('shows "host" chip for host', () => {
    render(<MemberList members={members} hostId="u1" currentUserId="u2" />);
    expect(screen.getByText('host')).toBeInTheDocument();
  });

  it('shows online count', () => {
    render(<MemberList members={members} hostId="u1" currentUserId="u1" />);
    expect(screen.getByText('Members (2 online)')).toBeInTheDocument();
  });

  it('EDGE #12: offline members shown with reduced opacity', () => {
    const { container } = render(
      <MemberList members={members} hostId="u1" currentUserId="u1" />
    );
    const items = container.querySelectorAll('.MuiListItem-root');
    // Carol (offline, index 1 by joinedAt) should have opacity 0.4
    const carolItem = items[1];
    expect(carolItem).toHaveStyle({ opacity: '0.4' });
  });
});
