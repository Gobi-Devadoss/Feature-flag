import { api } from "./client";
import type {
  AuditLog,
  DashboardStats,
  Environment,
  FeatureFlag,
  Role,
  Rollout,
  User,
  UserAssignment,
} from "../types";

export const AuthAPI = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string }>("/auth/login", { email, password }),
  register: (payload: { full_name: string; email: string; password: string; role_id: number }) =>
    api.post<User>("/auth/register", payload),
};

export const UsersAPI = {
  me: () => api.get<User>("/users/me"),
  list: () => api.get<User[]>("/users"),
  roles: () => api.get<Role[]>("/users/roles/all"),
  update: (id: number, payload: Partial<Pick<User, "full_name" | "is_active">> & { role_id?: number }) =>
    api.patch<User>(`/users/${id}`, payload),
};

export const EnvironmentsAPI = {
  list: () => api.get<Environment[]>("/environments"),
  create: (payload: { name: string; description?: string }) => api.post<Environment>("/environments", payload),
  update: (id: number, payload: Partial<Pick<Environment, "description" | "is_active">>) =>
    api.patch<Environment>(`/environments/${id}`, payload),
};

export const FlagsAPI = {
  list: (params?: { status?: string; search?: string }) => api.get<FeatureFlag[]>("/feature-flags", { params }),
  get: (id: number) => api.get<FeatureFlag>(`/feature-flags/${id}`),
  create: (payload: {
    key: string;
    name: string;
    description?: string;
    scheduled_start_at?: string;
    scheduled_end_at?: string;
  }) => api.post<FeatureFlag>("/feature-flags", payload),
  update: (id: number, payload: Partial<FeatureFlag>) => api.patch<FeatureFlag>(`/feature-flags/${id}`, payload),
  toggle: (id: number, is_enabled: boolean) =>
    api.post<FeatureFlag>(`/feature-flags/${id}/toggle`, { is_enabled }),
  archive: (id: number) => api.delete(`/feature-flags/${id}`),
};

export const RolloutsAPI = {
  list: (flagId: number) => api.get<Rollout[]>(`/feature-flags/${flagId}/rollouts`),
  upsert: (flagId: number, payload: { environment_id: number; is_enabled: boolean; rollout_percentage: number }) =>
    api.put<Rollout>(`/feature-flags/${flagId}/rollouts`, payload),
  rollback: (flagId: number, environment_id: number) =>
    api.post<Rollout>(`/feature-flags/${flagId}/rollouts/rollback`, { environment_id }),
};

export const AssignmentsAPI = {
  list: (flagId: number) => api.get<UserAssignment[]>(`/feature-flags/${flagId}/assignments`),
  create: (flagId: number, payload: { environment_id: number; target_user_identifier: number; is_enabled: boolean }) =>
    api.post<UserAssignment>(`/feature-flags/${flagId}/assignments`, payload),
  remove: (flagId: number, assignmentId: number) =>
    api.delete(`/feature-flags/${flagId}/assignments/${assignmentId}`),
};

export const EvaluationAPI = {
  usage: (flagKey: string, environmentName: string) =>
    api.get(`/evaluate/${flagKey}/usage`, { params: { environment_name: environmentName } }),
};

export const AuditLogsAPI = {
  list: (params?: { feature_flag_id?: number; entity_type?: string; limit?: number }) =>
    api.get<AuditLog[]>("/audit-logs", { params }),
};

export const DashboardAPI = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
};
