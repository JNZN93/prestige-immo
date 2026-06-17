import { Injectable } from '@angular/core';
import { EmployeeInput, mapRowToProfile, Profile, ProfileRow } from '../models/profile.model';
import { SupabaseService } from './supabase.service';

const TABLE = 'profiles';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  constructor(private readonly supabase: SupabaseService) {}

  async getCurrentProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRowToProfile(data as ProfileRow) : null;
  }

  async getStaff(): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProfileRow[]).map(mapRowToProfile);
  }

  async getActiveStaff(): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE)
      .select('*')
      .eq('role', 'staff')
      .eq('active', true)
      .order('full_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProfileRow[]).map(mapRowToProfile);
  }

  async createEmployee(input: EmployeeInput): Promise<string | null> {
    const client = this.supabase.getClient();
    const { data: sessionData } = await client.auth.getSession();
    const ownerSession = sessionData.session;

    if (!ownerSession) {
      return 'Nur angemeldete Betreiber können Mitarbeiter anlegen.';
    }

    const { data, error } = await client.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
          role: 'staff',
        },
      },
    });

    const { error: restoreError } = await client.auth.setSession({
      access_token: ownerSession.access_token,
      refresh_token: ownerSession.refresh_token,
    });

    if (error) {
      return error.message;
    }

    if (!data.user) {
      return 'Mitarbeiter konnte nicht angelegt werden.';
    }

    if (restoreError) {
      return 'Mitarbeiter angelegt, aber Ihre Sitzung konnte nicht wiederhergestellt werden. Bitte erneut anmelden.';
    }

    return null;
  }

  async setEmployeeActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from(TABLE)
      .update({ active })
      .eq('id', id)
      .eq('role', 'staff');

    if (error) {
      throw new Error(error.message);
    }
  }
}
