import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment, isSupabaseConfigured } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient | null = null;

  get isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  getClient(): SupabaseClient {
    if (!this.isConfigured) {
      throw new Error('Supabase ist nicht konfiguriert. Bitte environment.ts ausfüllen.');
    }

    if (!this.client) {
      this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }

    return this.client;
  }
}
