import {
  Box, Button, Dialog, DialogContent, DialogTitle,
  Divider, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportPokerCSV, exportPokerMarkdown, exportPokerJSON } from '../../utils/pokerExport';

const FORMATS = [
  {
    key: 'csv',
    label: 'CSV',
    description: 'Rally-compatible. Re-import to update PlanEstimate in bulk.',
    fn: exportPokerCSV,
    filename: 'poker-estimates.csv',
  },
  {
    key: 'markdown',
    label: 'Markdown',
    description: 'Table format for GitHub / GitLab wikis.',
    fn: exportPokerMarkdown,
    filename: 'poker-estimates.md',
  },
  {
    key: 'json',
    label: 'JSON',
    description: 'Full data export for custom tooling.',
    fn: exportPokerJSON,
    filename: 'poker-estimates.json',
  },
];

function sortedStories(stories) {
  return Object.entries(stories)
    .map(([, s]) => s)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export default function ExportDialog({ open, onClose, stories }) {
  const rows = sortedStories(stories);
  const estimated = rows.filter((s) => s.finalEstimate).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Estimates</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {estimated} of {rows.length} stories have a final estimate.
        </Typography>

        {/* Preview table */}
        {rows.length > 0 && (
          <Box sx={{ maxHeight: 240, overflowY: 'auto', mb: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Estimate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((s, i) => (
                  <TableRow key={i} sx={!s.finalEstimate ? { opacity: 0.5 } : {}}>
                    <TableCell>{s.formattedId || '—'}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.finalEstimate || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          {FORMATS.map(({ key, label, description, fn }) => (
            <Stack key={key} direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2">{label}</Typography>
                <Typography variant="caption" color="text.secondary">{description}</Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => fn(stories)}
                disabled={rows.length === 0}
              >
                Download
              </Button>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
