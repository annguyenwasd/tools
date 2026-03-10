import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoryList from '../StoryList';

vi.mock('../CSVImportDialog', () => ({
  default: ({ open }) => open ? <div data-testid="csv-dialog">CSV Dialog</div> : null,
}));

const stories = {
  s1: { name: 'Login', formattedId: 'US1', order: 1, finalEstimate: '5' },
  s2: { name: 'Signup', formattedId: 'US2', order: 0 },
  s3: { name: 'Dashboard', order: 2 },
};

describe('StoryList', () => {
  const defaultProps = {
    stories,
    currentStoryId: 's1',
    isHost: true,
    onSelectStory: vi.fn(),
    onAddStory: vi.fn(),
    onImportStories: vi.fn(),
    onDeleteStory: vi.fn(),
  };

  it('sorts stories by order', () => {
    const { container } = render(<StoryList {...defaultProps} />);
    const items = container.querySelectorAll('.MuiListItemButton-root');
    // order 0 (Signup), order 1 (Login), order 2 (Dashboard)
    expect(items[0].textContent).toContain('Signup');
    expect(items[1].textContent).toContain('Login');
    expect(items[2].textContent).toContain('Dashboard');
  });

  it('highlights selected story', () => {
    const { container } = render(<StoryList {...defaultProps} />);
    const items = container.querySelectorAll('.MuiListItemButton-root');
    // s1 (Login, order 1) is at index 1
    expect(items[1]).toHaveClass('Mui-selected');
  });

  it('host can select story', () => {
    const onSelect = vi.fn();
    render(<StoryList {...defaultProps} onSelectStory={onSelect} />);
    fireEvent.click(screen.getByText('Signup'));
    expect(onSelect).toHaveBeenCalledWith('s2');
  });

  it('non-host cannot select story', () => {
    const onSelect = vi.fn();
    render(<StoryList {...defaultProps} isHost={false} onSelectStory={onSelect} />);
    fireEvent.click(screen.getByText('Signup'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('host can delete story', () => {
    const onDelete = vi.fn();
    render(<StoryList {...defaultProps} onDeleteStory={onDelete} />);
    const deleteButtons = screen.getAllByLabelText('Delete story');
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalled();
  });

  it('non-host cannot see delete buttons', () => {
    render(<StoryList {...defaultProps} isHost={false} />);
    expect(screen.queryAllByLabelText('Delete story')).toHaveLength(0);
  });

  it('EDGE #10: delete has no confirmation dialog', () => {
    const onDelete = vi.fn();
    render(<StoryList {...defaultProps} onDeleteStory={onDelete} />);
    const deleteButtons = screen.getAllByLabelText('Delete story');
    // Clicking immediately deletes - no confirmation
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows estimate chip on completed stories', () => {
    render(<StoryList {...defaultProps} />);
    // s1 has finalEstimate: '5'
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(<StoryList {...defaultProps} stories={{}} />);
    expect(screen.getByText(/No stories yet/)).toBeInTheDocument();
  });
});
