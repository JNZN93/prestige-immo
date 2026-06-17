import { isPlatformBrowser } from '@angular/common';
import { computed, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../models/profile.model';
import { EmployeeService } from './employee.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSignal = signal<Session | null>(null);
  private readonly profileSignal = signal<Profile | null>(null);
  private initialized = false;

  readonly session = this.sessionSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly user = computed<User | null>(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionSignal());
  readonly isOwner = computed(() => this.profileSignal()?.role === 'owner' && this.profileSignal()?.active === true);

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly supabase: SupabaseService,
    private readonly employees: EmployeeService,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      void this.init();
    }
  }

  async init(): Promise<void> {
    if (this.initialized || !this.supabase.isConfigured) {
      return;
    }

    this.initialized = true;
    const client = this.supabase.getClient();

    const { data } = await client.auth.getSession();
    this.sessionSignal.set(data.session);
    await this.syncProfile(data.session?.user ?? null);

    client.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
      void this.syncProfile(session?.user ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<string | null> {
    if (!this.supabase.isConfigured) {
      return 'Supabase ist nicht konfiguriert.';
    }

    const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return error.message;
    }

    await this.syncProfile(data.user);
    const profile = this.profileSignal();

    if (!profile) {
      return 'Profil konnte nicht geladen werden. Bitte supabase/employees-fix.sql im SQL Editor ausführen.';
    }

    if (!profile.active) {
      await this.signOut();
      return 'Ihr Zugang wurde deaktiviert.';
    }

    return null;
  }

  async signOut(): Promise<void> {
    this.profileSignal.set(null);

    if (!this.supabase.isConfigured) {
      this.sessionSignal.set(null);
      return;
    }

    await this.supabase.getClient().auth.signOut();
    this.sessionSignal.set(null);
  }

  async hasSession(): Promise<boolean> {
    if (!this.supabase.isConfigured) {
      return false;
    }

    await this.init();
    const { data } = await this.supabase.getClient().auth.getSession();
    this.sessionSignal.set(data.session);
    await this.syncProfile(data.session?.user ?? null);
    return !!data.session;
  }

  async loadProfile(): Promise<Profile | null> {
    await this.init();

    const user = this.user();
    if (!user) {
      this.profileSignal.set(null);
      return null;
    }

    await this.syncProfile(user);
    return this.profileSignal();
  }

  private async syncProfile(user: User | null): Promise<void> {
    if (!user) {
      this.profileSignal.set(null);
      return;
    }

    try {
      const profile = await this.employees.getCurrentProfile(user.id);
      this.profileSignal.set(profile);
    } catch (err) {
      this.profileSignal.set(null);
      console.error('Profil konnte nicht geladen werden:', err);
    }
  }
}
