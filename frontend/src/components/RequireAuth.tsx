import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
