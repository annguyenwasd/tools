import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoryList from '../../components/poker/StoryList';

vi.mock('../../components/poker/CSVImportDialog', () => ({
  default: ({ open }) => open ? <div data-testid="csv-dialog">CSV Dialog</div> : null,
}));

describe('EDGE #11: Silent behavior on prompt cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('add story does nothing when prompt returns null (cancel)', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const onAddStory = vi.fn();

    render(
      <StoryList
        stories={{}}
        currentStoryId={null}
        isHost={true}
        onSelectStory={vi.fn()}
        onAddStory={onAddStory}
        onImportStories={vi.fn()}
        onDeleteStory={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Add Story'));
    expect(onAddStory).not.toHaveBeenCalled();

    window.prompt.mockRestore();
  });

  it('add story does nothing when prompt returns empty string', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('   ');
    const onAddStory = vi.fn();

    render(
      <StoryList
        stories={{}}
        currentStoryId={null}
        isHost={true}
        onSelectStory={vi.fn()}
        onAddStory={onAddStory}
        onImportStories={vi.fn()}
        onDeleteStory={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Add Story'));
    expect(onAddStory).not.toHaveBeenCalled();

    window.prompt.mockRestore();
  });
});
