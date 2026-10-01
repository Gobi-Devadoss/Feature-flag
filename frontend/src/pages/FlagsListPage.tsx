import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  Switch,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { FlagsAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { FeatureFlag, FeatureFlagStatus } from "../types";

const STATUS_COLOR: Record<FeatureFlagStatus, "success" | "default" | "warning" | "error"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  SCHEDULED: "warning",
  ARCHIVED: "error",
};

export default function FlagsListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const { data } = await FlagsAPI.list({
      search: search || undefined,
      status: statusFilter || undefined,
    });
    setFlags(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function handleToggle(flag: FeatureFlag) {
    await FlagsAPI.toggle(flag.id, !flag.is_enabled);
    load();
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await FlagsAPI.create({ key: newKey, name: newName, description: newDescription || undefined });
      setDialogOpen(false);
      setNewKey("");
      setNewName("");
      setNewDescription("");
      load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Feature Flags
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New Flag
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Search"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <TextField
          label="Status"
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
          <MenuItem value="SCHEDULED">Scheduled</MenuItem>
          <MenuItem value="ARCHIVED">Archived</MenuItem>
        </TextField>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell>Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map((flag) => (
              <TableRow
                key={flag.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/flags/${flag.id}`)}
              >
                <TableCell>
                  <code>{flag.key}</code>
                </TableCell>
                <TableCell>{flag.name}</TableCell>
                <TableCell>
                  <Chip label={flag.status} size="small" color={STATUS_COLOR[flag.status]} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={flag.is_enabled}
                    disabled={!isAdmin}
                    onChange={() => handleToggle(flag)}
                  />
                </TableCell>
                <TableCell>{new Date(flag.updated_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {flags.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No feature flags found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Feature Flag</DialogTitle>
        <DialogContent>
          <TextField
            label="Key (machine-readable)"
            fullWidth
            margin="normal"
            placeholder="new_checkout_flow"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <TextField label="Name" fullWidth margin="normal" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating || !newKey || !newName}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
