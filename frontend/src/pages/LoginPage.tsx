import { useState, FormEvent } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Alert, Link } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ bgcolor: "#1a1f36" }}
    >
      <Paper sx={{ p: 4, width: 360 }} elevation={4}>
        <Typography variant="h5" fontWeight={600} mb={1}>
          Feature Flag Console
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to manage flags, rollouts, and environments.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Don't have an account?{" "}
          <Link component={RouterLink} to="/register">
            Create one
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
