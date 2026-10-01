import { useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, CircularProgress } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { DashboardAPI } from "../api/services";
import type { DashboardStats } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STAT_COLORS: Record<string, string> = {
  total: "#3949ab",
  active: "#2e7d32",
  scheduled: "#f9a825",
  inactive: "#757575",
  archived: "#c62828",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ p: 2.5, borderLeft: `4px solid ${color}` }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardAPI.stats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return <Typography>Could not load dashboard stats.</Typography>;

  const chartData = {
    labels: stats.rollouts_by_environment.map((r) => r.environment),
    datasets: [
      {
        label: "Avg Rollout %",
        data: stats.rollouts_by_environment.map((r) => r.avg_rollout_percentage),
        backgroundColor: "#3949ab",
        borderRadius: 4,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Total Flags" value={stats.flags.total} color={STAT_COLORS.total} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Active" value={stats.flags.active} color={STAT_COLORS.active} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Scheduled" value={stats.flags.scheduled} color={STAT_COLORS.scheduled} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Inactive" value={stats.flags.inactive} color={STAT_COLORS.inactive} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Archived" value={stats.flags.archived} color={STAT_COLORS.archived} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Average Rollout % by Environment
        </Typography>
        {stats.rollouts_by_environment.length === 0 ? (
          <Typography color="text.secondary">No rollout data yet.</Typography>
        ) : (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { min: 0, max: 100 } },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}
