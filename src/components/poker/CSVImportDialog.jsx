import { useState, useRef } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseCSV } from '../../utils/csvParser';

export default function CSVImportDialog({ open, onClose, onImport }) {
  const [stories, setStories] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const reset = () => { setStories([]); setError(''); };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        setStories(parsed);
        setError('');
      } catch (err) {
        setError(err.message);
        setStories([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Stories from CSV</DialogTitle>
      <DialogContent>
        <Paper
          variant="outlined"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragging ? 'action.hover' : 'background.default',
            border: dragging ? '2px dashed' : '2px dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            mb: 2,
          }}
        >
          <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography>Drag & drop a CSV file here, or click to select</Typography>
          <Typography variant="caption" color="text.secondary">
            Expects columns: FormattedID, Name, Description, PlanEstimate
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {stories.length > 0 && (
          <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Estimate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stories.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.formattedId}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description}
                    </TableCell>
                    <TableCell>{s.planEstimate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={stories.length === 0}
          onClick={() => onImport(stories)}
        >
          Import {stories.length > 0 ? `${stories.length} stories` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
