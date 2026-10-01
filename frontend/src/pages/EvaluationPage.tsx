import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../api/client";
import { EnvironmentsAPI, FlagsAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import type { Environment, FeatureFlag } from "../types";

export default function EvaluationPage() {
  const { isAdmin } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedFlagKey, setSelectedFlagKey] = useState("");
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [userIdentifier, setUserIdentifier] = useState("");
  const [result, setResult] = useState<{ enabled: boolean; reason: string } | null>(null);
  const [usage, setUsage] = useState<{ enabled_evaluations: number; disabled_evaluations: number; total_evaluations: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [flagRes, envRes] = await Promise.all([FlagsAPI.list(), EnvironmentsAPI.list()]);
    setFlags(flagRes.data);
    setEnvironments(envRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEvaluate() {
    if (!selectedFlagKey || !selectedEnvironment || !userIdentifier) return;

    const { data } = await api.post("/evaluate", {
      flag_key: selectedFlagKey,
      environment_name: selectedEnvironment,
      user_identifier: Number(userIdentifier),
    });
    setResult({ enabled: data.enabled, reason: data.reason });

    const usageRes = await api.get(`/evaluate/${selectedFlagKey}/usage`, {
      params: { environment_name: selectedEnvironment },
    });
    setUsage(usageRes.data);
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
        <Typography color="text.secondary">Admin access is required for evaluation checks.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Feature Evaluation
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper sx={{ p: 3, maxWidth: 700 }}>
        <Stack spacing={2}>
          <TextField
            select
            label="Flag"
            value={selectedFlagKey}
            onChange={(e) => setSelectedFlagKey(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">Select a flag</option>
            {flags.map((flag) => (
              <option key={flag.id} value={flag.key}>
                {flag.name} ({flag.key})
              </option>
            ))}
          </TextField>

          <TextField
            select
            label="Environment"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">Select an environment</option>
            {environments.map((env) => (
              <option key={env.id} value={env.name}>
                {env.name}
              </option>
            ))}
          </TextField>

          <TextField
            label="User ID"
            type="number"
            value={userIdentifier}
            onChange={(e) => setUserIdentifier(e.target.value)}
          />

          <Button variant="contained" onClick={handleEvaluate} disabled={!selectedFlagKey || !selectedEnvironment || !userIdentifier}>
            Evaluate
          </Button>
        </Stack>
      </Paper>

      {result && (
        <Paper sx={{ p: 3, mt: 3, maxWidth: 700 }}>
          <Typography variant="h6" mb={1}>
            Result
          </Typography>
          <Typography>
            Enabled: <strong>{String(result.enabled)}</strong>
          </Typography>
          <Typography>Reason: {result.reason}</Typography>
        </Paper>
      )}

      {usage && (
        <Paper sx={{ p: 3, mt: 3, maxWidth: 700 }}>
          <Typography variant="h6" mb={1}>
            Usage Summary
          </Typography>
          <Typography>Enabled evaluations: {usage.enabled_evaluations}</Typography>
          <Typography>Disabled evaluations: {usage.disabled_evaluations}</Typography>
          <Typography>Total evaluations: {usage.total_evaluations}</Typography>
        </Paper>
      )}
    </Box>
  );
}
