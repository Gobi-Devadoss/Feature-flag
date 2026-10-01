import { useEffect, useState, FormEvent } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Alert, MenuItem, Link } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { AuthAPI, UsersAPI } from "../api/services";
import type { Role } from "../types";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Roles listing requires no auth-specific role, but does require a valid
    // session on some backends; if it 401s, fall back to letting the admin
    // assign a role later — the field just stays empty and required.
    UsersAPI.roles()
      .then((res) => setRoles(res.data))
      .catch(() => setRoles([]));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (roleId === "") {
      setError("Please select a role.");
      return;
    }

    setSubmitting(true);
    try {
      await AuthAPI.register({ full_name: fullName, email, password, role_id: Number(roleId) });
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Could not create the account. Please try again.");
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
      <Paper sx={{ p: 4, width: 380 }} elevation={4}>
        <Typography variant="h5" fontWeight={600} mb={1}>
          Create an Account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Register to access the Feature Flag Console.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Full name"
            fullWidth
            margin="normal"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
            helperText="At least 8 characters"
            required
          />
          <TextField
            label="Role"
            select
            fullWidth
            margin="normal"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
            required
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
