import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Chip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FlagIcon from "@mui/icons-material/Flag";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PublicIcon from "@mui/icons-material/Public";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";

const DRAWER_WIDTH = 230;

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Feature Flags", path: "/flags", icon: <FlagIcon /> },
  { label: "Rollouts", path: "/rollouts", icon: <TrendingUpIcon /> },
  { label: "Assignments", path: "/assignments", icon: <AssignmentIndIcon /> },
  { label: "Evaluation", path: "/evaluation", icon: <PlayArrowIcon /> },
  { label: "Environments", path: "/environments", icon: <PublicIcon /> },
  { label: "Audit Logs", path: "/audit-logs", icon: <HistoryIcon /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "#1a1f36" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap>
            Feature Flag Console
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {user && (
              <>
                <Typography variant="body2">{user.full_name}</Typography>
                <Chip label={user.role.name} size="small" color="secondary" />
                <IconButton color="inherit" onClick={() => { logout(); navigate("/login"); }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "#f5f6fa", minHeight: "100vh" }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
