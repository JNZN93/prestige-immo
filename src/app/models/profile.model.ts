export type UserRole = 'owner' | 'staff';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at?: string;
}

export interface EmployeeInput {
  email: string;
  password: string;
  fullName: string;
}

export function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}
