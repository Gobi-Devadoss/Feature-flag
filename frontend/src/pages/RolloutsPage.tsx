import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Slider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { EnvironmentsAPI, FlagsAPI, RolloutsAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { Environment, FeatureFlag, Rollout } from "../types";

export default function RolloutsPage() {
  const { isAdmin } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [rolloutsByFlag, setRolloutsByFlag] = useState<Record<number, Rollout[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [flagRes, envRes] = await Promise.all([FlagsAPI.list(), EnvironmentsAPI.list()]);
    const flagList = flagRes.data;
    setFlags(flagList);
    setEnvironments(envRes.data);

    const rolloutResults = await Promise.all(
      flagList.map(async (flag) => {
        const rolloutRes = await RolloutsAPI.list(flag.id);
        return { flagId: flag.id, rollouts: rolloutRes.data };
      }),
    );

    const next: Record<number, Rollout[]> = {};
    rolloutResults.forEach(({ flagId, rollouts }) => {
      next[flagId] = rollouts;
    });
    setRolloutsByFlag(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function rolloutFor(flagId: number, envId: number) {
    return (rolloutsByFlag[flagId] ?? []).find((r) => r.environment_id === envId);
  }

  async function handleRolloutChange(flagId: number, envId: number, percentage: number, enabled: boolean) {
    await RolloutsAPI.upsert(flagId, { environment_id: envId, rollout_percentage: percentage, is_enabled: enabled });
    await load();
  }

  async function handleRollback(flagId: number, envId: number) {
    await RolloutsAPI.rollback(flagId, envId);
    await load();
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Rollout Management
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {flags.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">No flags available yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {flags.map((flag) => (
            <Paper key={flag.id} sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6">{flag.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {flag.key}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {flag.status}
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                {environments.map((env) => {
                  const rollout = rolloutFor(flag.id, env.id);
                  const pct = rollout?.rollout_percentage ?? 0;
                  const enabled = rollout?.is_enabled ?? false;

                  return (
                    <Grid item xs={12} md={4} key={`${flag.id}-${env.id}`}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography fontWeight={600}>{env.name}</Typography>
                          <Switch
                            checked={enabled}
                            disabled={!isAdmin}
                            onChange={(e) => handleRolloutChange(flag.id, env.id, pct, e.target.checked)}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Rollout: {pct}%
                        </Typography>
                        <Slider
                          value={pct}
                          disabled={!isAdmin}
                          onChangeCommitted={(_, value) => handleRolloutChange(flag.id, env.id, value as number, enabled)}
                          valueLabelDisplay="auto"
                        />
                        {rollout?.previous_percentage != null && isAdmin && (
                          <Button
                            size="small"
                            startIcon={<RestoreIcon />}
                            onClick={() => handleRollback(flag.id, env.id)}
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
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
