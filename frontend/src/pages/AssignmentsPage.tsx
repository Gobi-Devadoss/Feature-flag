import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { AssignmentsAPI, EnvironmentsAPI, FlagsAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { Environment, FeatureFlag, UserAssignment } from "../types";

export default function AssignmentsPage() {
  const { isAdmin } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [assignments, setAssignments] = useState<Record<number, UserAssignment[]>>({});
  const [selectedFlagId, setSelectedFlagId] = useState<number | "">("");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<number | "">("");
  const [targetUserId, setTargetUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [flagRes, envRes] = await Promise.all([FlagsAPI.list(), EnvironmentsAPI.list()]);
    const flagList = flagRes.data;
    setFlags(flagList);
    setEnvironments(envRes.data);

    const assignmentResults = await Promise.all(
      flagList.map(async (flag) => {
        const res = await AssignmentsAPI.list(flag.id);
        return { flagId: flag.id, items: res.data };
      }),
    );

    const next: Record<number, UserAssignment[]> = {};
    assignmentResults.forEach(({ flagId, items }) => {
      next[flagId] = items;
    });
    setAssignments(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateAssignment() {
    if (!selectedFlagId || !selectedEnvironmentId || !targetUserId) return;
    await AssignmentsAPI.create(Number(selectedFlagId), {
      environment_id: Number(selectedEnvironmentId),
      target_user_identifier: Number(targetUserId),
      is_enabled: true,
    });
    setTargetUserId("");
    await load();
  }

  async function handleRemove(flagId: number, assignmentId: number) {
    await AssignmentsAPI.remove(flagId, assignmentId);
    await load();
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Admin access is required for user assignments.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        User Assignments
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <TextField
            select
            label="Flag"
            value={selectedFlagId}
            onChange={(e) => setSelectedFlagId(Number(e.target.value) || "")}
            sx={{ minWidth: 220 }}
            SelectProps={{ native: true }}
          >
            <option value="">Select flag</option>
            {flags.map((flag) => (
              <option key={flag.id} value={flag.id}>
                {flag.name}
              </option>
            ))}
          </TextField>

          <TextField
            select
            label="Environment"
            value={selectedEnvironmentId}
            onChange={(e) => setSelectedEnvironmentId(Number(e.target.value) || "")}
            sx={{ minWidth: 220 }}
            SelectProps={{ native: true }}
          >
            <option value="">Select environment</option>
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </TextField>

          <TextField
            label="User ID"
            type="number"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            sx={{ width: 170 }}
          />

          <Button variant="contained" onClick={handleCreateAssignment} disabled={!selectedFlagId || !selectedEnvironmentId || !targetUserId}>
            Grant Access
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {flags.map((flag) => (
          <Grid item xs={12} key={flag.id}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" mb={2}>
                {flag.name}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Enabled</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(assignments[flag.id] ?? []).map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.target_user_identifier}</TableCell>
                      <TableCell>{environments.find((env) => env.id === assignment.environment_id)?.name ?? assignment.environment_id}</TableCell>
                      <TableCell>{assignment.is_enabled ? "Enabled" : "Disabled"}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemove(flag.id, assignment.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(assignments[flag.id] ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                        No user assignments for this flag.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
