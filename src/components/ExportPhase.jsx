import {
  Box, Button, Card, CardContent, Stack, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportJSON, exportMarkdown, exportConfluence } from '../utils/export';

export default function ExportPhase({ cards, meta, getVoteCount }) {
  const enrichedCards = Object.fromEntries(
    Object.entries(cards).map(([id, card]) => [
      id,
      { ...card, votes: getVoteCount(id) },
    ])
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Export Retrospective</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Download your retrospective results in your preferred format.
      </Typography>

      <Stack spacing={2} maxWidth={400}>
        <Card elevation={1}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>JSON</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Full data export including all metadata
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportJSON(enrichedCards, meta)}
            >
              Download JSON
            </Button>
          </CardContent>
        </Card>

        <Card elevation={1}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>Markdown</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Table format, great for GitHub/GitLab wikis
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportMarkdown(enrichedCards, meta.categories)}
            >
              Download Markdown
            </Button>
          </CardContent>
        </Card>

        <Card elevation={1}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>Confluence</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Confluence wiki markup table syntax
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportConfluence(enrichedCards, meta.categories)}
            >
              Download Confluence
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
