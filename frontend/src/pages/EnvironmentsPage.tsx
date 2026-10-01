import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { EnvironmentsAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { Environment } from "../types";

export default function EnvironmentsPage() {
  const { isAdmin } = useAuth();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const { data } = await EnvironmentsAPI.list();
    setEnvironments(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleActive(env: Environment) {
    await EnvironmentsAPI.update(env.id, { is_active: !env.is_active });
    load();
  }

  async function handleCreate() {
    await EnvironmentsAPI.create({ name, description: description || undefined });
    setDialogOpen(false);
    setName("");
    setDescription("");
    load();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Environments
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New Environment
          </Button>
        )}
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {environments.map((env) => (
              <TableRow key={env.id}>
                <TableCell>{env.name}</TableCell>
                <TableCell>{env.description}</TableCell>
                <TableCell>
                  <Switch checked={env.is_active} disabled={!isAdmin} onChange={() => handleToggleActive(env)} />
                </TableCell>
                <TableCell>{new Date(env.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Environment</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
