import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import FlagsListPage from "./pages/FlagsListPage";
import FlagDetailPage from "./pages/FlagDetailPage";
import RolloutsPage from "./pages/RolloutsPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import EvaluationPage from "./pages/EvaluationPage";
import EnvironmentsPage from "./pages/EnvironmentsPage";
import AuditLogsPage from "./pages/AuditLogsPage";

const theme = createTheme({
  palette: {
    primary: { main: "#3949ab" },
    secondary: { main: "#ff7043" },
    background: { default: "#f5f6fa" },
  },
  shape: { borderRadius: 8 },
});

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Protected><DashboardPage /></Protected>} />
            <Route path="/flags" element={<Protected><FlagsListPage /></Protected>} />
            <Route path="/flags/:flagId" element={<Protected><FlagDetailPage /></Protected>} />
            <Route path="/rollouts" element={<Protected><RolloutsPage /></Protected>} />
            <Route path="/assignments" element={<Protected><AssignmentsPage /></Protected>} />
            <Route path="/evaluation" element={<Protected><EvaluationPage /></Protected>} />
            <Route path="/environments" element={<Protected><EnvironmentsPage /></Protected>} />
            <Route path="/audit-logs" element={<Protected><AuditLogsPage /></Protected>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
