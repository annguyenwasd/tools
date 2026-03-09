import {
  Avatar, Box, Chip, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Typography,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 45%)`;
}

export default function MemberList({ members, hostId, currentUserId }) {
  const sorted = Object.entries(members).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 1 }}>
        Members ({sorted.filter(([, m]) => m.online).length} online)
      </Typography>
      <List dense>
        {sorted.map(([uid, member]) => (
          <ListItem key={uid} sx={{ opacity: member.online ? 1 : 0.4 }}>
            <ListItemAvatar sx={{ minWidth: 36 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: stringToColor(member.name), fontSize: 12 }}>
                {member.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" noWrap>
                    {member.name}
                    {uid === currentUserId && ' (you)'}
                  </Typography>
                  {uid === hostId && (
                    <Chip label="host" size="small" color="primary" sx={{ height: 16, fontSize: 10 }} />
                  )}
                </Box>
              }
            />
            <FiberManualRecordIcon
              sx={{ fontSize: 10, color: member.online ? 'success.main' : 'text.disabled' }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
