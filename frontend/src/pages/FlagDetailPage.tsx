import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Slider,
  Switch,
  Button,
  Stack,
  Divider,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";
import { FlagsAPI, RolloutsAPI, EnvironmentsAPI, AssignmentsAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { FeatureFlag, Environment, Rollout, UserAssignment } from "../types";

export default function FlagDetailPage() {
  const { flagId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const id = Number(flagId);

  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [rollouts, setRollouts] = useState<Rollout[]>([]);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [newUserId, setNewUserId] = useState("");
  const [newUserEnv, setNewUserEnv] = useState<number | "">("");

  const load = useCallback(async () => {
    const [flagRes, envRes, rolloutRes, assignRes] = await Promise.all([
      FlagsAPI.get(id),
      EnvironmentsAPI.list(),
      RolloutsAPI.list(id),
      AssignmentsAPI.list(id),
    ]);
    setFlag(flagRes.data);
    setEnvironments(envRes.data);
    setRollouts(rolloutRes.data);
    setAssignments(assignRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function rolloutFor(envId: number) {
    return rollouts.find((r) => r.environment_id === envId);
  }

  async function handleRolloutChange(envId: number, percentage: number, enabled: boolean) {
    await RolloutsAPI.upsert(id, { environment_id: envId, rollout_percentage: percentage, is_enabled: enabled });
    load();
  }

  async function handleRollback(envId: number) {
    await RolloutsAPI.rollback(id, envId);
    load();
  }

  async function handleAddAssignment() {
    if (!newUserId || newUserEnv === "") return;
    await AssignmentsAPI.create(id, {
      environment_id: Number(newUserEnv),
      target_user_identifier: Number(newUserId),
      is_enabled: true,
    });
    setNewUserId("");
    load();
  }

  async function handleRemoveAssignment(assignmentId: number) {
    await AssignmentsAPI.remove(id, assignmentId);
    load();
  }

  if (loading || !flag) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/flags")} sx={{ mb: 2 }}>
        Back to Flags
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {flag.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <code>{flag.key}</code>
            </Typography>
            {flag.description && (
              <Typography variant="body2" mt={1}>
                {flag.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={flag.status} color={flag.status === "ACTIVE" ? "success" : "default"} />
            <Stack alignItems="center">
              <Switch
                checked={flag.is_enabled}
                disabled={!isAdmin}
                onChange={async () => {
                  await FlagsAPI.toggle(flag.id, !flag.is_enabled);
                  load();
                }}
              />
              <Typography variant="caption">Global</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Typography variant="h6" mb={2}>
        Environment Rollouts
      </Typography>
      <Grid container spacing={2} mb={4}>
        {environments.map((env) => {
          const rollout = rolloutFor(env.id);
          const pct = rollout?.rollout_percentage ?? 0;
          const enabled = rollout?.is_enabled ?? false;
          return (
            <Grid item xs={12} md={4} key={env.id}>
              <Paper sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontWeight={600}>{env.name}</Typography>
                  <Switch
                    checked={enabled}
                    disabled={!isAdmin}
                    onChange={(e) => handleRolloutChange(env.id, pct, e.target.checked)}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Rollout: {pct}%
                </Typography>
                <Slider
                  value={pct}
                  disabled={!isAdmin}
                  onChangeCommitted={(_, value) => handleRolloutChange(env.id, value as number, enabled)}
                  valueLabelDisplay="auto"
                />
                {rollout?.previous_percentage != null && isAdmin && (
                  <Button
                    size="small"
                    startIcon={<RestoreIcon />}
                    onClick={() => handleRollback(env.id)}
                    sx={{ mt: 1 }}
                  >
                    Rollback to {rollout.previous_percentage}%
                  </Button>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" mb={2}>
        User-Specific Access
      </Typography>
      <Paper sx={{ p: 2.5, mb: 2 }}>
        {isAdmin && (
          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <TextField
              label="User ID"
              size="small"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              sx={{ width: 150 }}
            />
            <TextField
              label="Environment"
              select
              size="small"
              value={newUserEnv}
              onChange={(e) => setNewUserEnv(Number(e.target.value))}
              sx={{ width: 200 }}
              SelectProps={{ native: true }}
            >
              <option value="" />
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleAddAssignment}>
              Grant Access
            </Button>
          </Stack>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Environment</TableCell>
              <TableCell>Enabled</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.target_user_identifier}</TableCell>
                <TableCell>{environments.find((e) => e.id === a.environment_id)?.name ?? a.environment_id}</TableCell>
                <TableCell>
                  <Chip size="small" label={a.is_enabled ? "Enabled" : "Disabled"} color={a.is_enabled ? "success" : "default"} />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleRemoveAssignment(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                  No user-specific overrides.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
