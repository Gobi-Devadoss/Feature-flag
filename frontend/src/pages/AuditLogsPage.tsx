import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import { AuditLogsAPI } from "../api/services";
import type { AuditLog } from "../types";

const ACTION_COLOR: Record<string, "success" | "error" | "warning" | "default" | "info"> = {
  FLAG_CREATED: "success",
  FLAG_ENABLED: "success",
  FLAG_DISABLED: "error",
  FLAG_ARCHIVED: "error",
  ROLLOUT_CHANGED: "info",
  ROLLBACK: "warning",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    AuditLogsAPI.list({ limit: 200 }).then((res) => setLogs(res.data));
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Audit Logs
      </Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip size="small" label={log.action} color={ACTION_COLOR[log.action] ?? "default"} />
                </TableCell>
                <TableCell>
                  {log.entity_type}
                  {log.entity_id ? ` #${log.entity_id}` : ""}
                </TableCell>
                <TableCell>{log.description ?? "—"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No audit log entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
