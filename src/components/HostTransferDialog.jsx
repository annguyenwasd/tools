import {
  Avatar, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, List, ListItem, ListItemAvatar, ListItemButton,
  ListItemText, Typography,
} from '@mui/material';

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
}

export default function HostTransferDialog({ open, onClose, onTransfer, members, currentUserId }) {
  const candidates = Object.entries(members).filter(
    ([uid, m]) => uid !== currentUserId && m.online
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Transfer Host Role</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Select a member to become the new host before you leave.
        </Typography>
        {candidates.length === 0 ? (
          <Typography variant="body2" color="warning.main">
            No other online members available.
          </Typography>
        ) : (
          <List disablePadding>
            {candidates.map(([uid, member]) => (
              <ListItem key={uid} disablePadding>
                <ListItemButton onClick={() => onTransfer(uid)}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: stringToColor(member.name), width: 32, height: 32, fontSize: 14 }}>
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={member.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
