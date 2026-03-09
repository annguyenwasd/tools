import { useRef, useState } from 'react';
import {
  Box, Button, Chip, Divider, IconButton, List, ListItemButton,
  ListItemText, Stack, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CSVImportDialog from './CSVImportDialog';

export const STORY_LIST_WIDTH = 240;

export default function StoryList({ stories, currentStoryId, isHost, onSelectStory, onAddStory, onImportStories, onDeleteStory }) {
  const [importOpen, setImportOpen] = useState(false);

  const sortedStories = Object.entries(stories)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

  const handleAddStory = () => {
    const name = prompt('Story name:');
    if (!name?.trim()) return;
    onAddStory({ name: name.trim() });
  };

  return (
    <Box sx={{ width: STORY_LIST_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>Stories</Typography>
      </Box>
      <Divider />

      <List dense sx={{ flex: 1, overflowY: 'auto' }}>
        {sortedStories.length === 0 && (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="caption" color="text.secondary">
              No stories yet. Add or import stories to begin.
            </Typography>
          </Box>
        )}
        {sortedStories.map(([storyId, story]) => {
          const isActive = storyId === currentStoryId;
          return (
            <ListItemButton
              key={storyId}
              selected={isActive}
              onClick={() => isHost && onSelectStory(storyId)}
              sx={{ cursor: isHost ? 'pointer' : 'default', pr: 1 }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
                    {story.formattedId && (
                      <Chip label={story.formattedId} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                    )}
                    <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                      {story.name}
                    </Typography>
                  </Stack>
                }
                secondary={
                  story.finalEstimate ? (
                    <Chip
                      label={story.finalEstimate}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 18, mt: 0.5 }}
                    />
                  ) : null
                }
              />
              {isHost && (
                <Tooltip title="Delete story">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onDeleteStory(storyId); }}
                    sx={{ ml: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </ListItemButton>
          );
        })}
      </List>

      {isHost && (
        <>
          <Divider />
          <Stack spacing={1} sx={{ p: 1 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddStory} fullWidth>
              Add Story
            </Button>
            <Button size="small" startIcon={<FileUploadIcon />} onClick={() => setImportOpen(true)} fullWidth>
              Import CSV
            </Button>
          </Stack>
        </>
      )}

      <CSVImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(storyList) => { onImportStories(storyList); setImportOpen(false); }}
      />
    </Box>
  );
}
