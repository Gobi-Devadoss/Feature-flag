export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  role: Role;
  created_at: string;
  last_login_at?: string;
}

export type FeatureFlagStatus = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "ARCHIVED";

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  status: FeatureFlagStatus;
  is_enabled: boolean;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Rollout {
  id: number;
  feature_flag_id: number;
  environment_id: number;
  is_enabled: boolean;
  rollout_percentage: number;
  previous_percentage?: number | null;
  updated_at: string;
}

export interface UserAssignment {
  id: number;
  feature_flag_id: number;
  environment_id: number;
  target_user_identifier: number;
  is_enabled: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  feature_flag_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_value?: string;
  new_value?: string;
  description?: string;
  created_at: string;
}

export interface DashboardStats {
  flags: {
    total: number;
    active: number;
    scheduled: number;
    archived: number;
    inactive: number;
  };
  environments: {
    total: number;
  };
  rollouts_by_environment: {
    environment: string;
    flag_count: number;
    avg_rollout_percentage: number;
  }[];
}
