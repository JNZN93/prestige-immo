import { Injectable } from '@angular/core';
import { ContactInquiry, ContactInquiryInput, mapRowToContactInquiry } from '../models/contact.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private readonly supabase: SupabaseService) {}

  async getInquiries(): Promise<ContactInquiry[]> {
    const selectWithHandler = `
      *,
      handler:profiles!handled_by (
        full_name,
        email
      )
    `;

    const { data, error } = await this.supabase
      .getClient()
      .from('contact_inquiries')
      .select(selectWithHandler)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRowToContactInquiry(row));
  }

  async getOpenInquiriesCount(): Promise<number> {
    const { count, error } = await this.supabase
      .getClient()
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('handled', false);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  async setInquiryHandled(id: string, handled: boolean, handledBy: string | null): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from('contact_inquiries')
      .update({
        handled,
        handled_at: handled ? new Date().toISOString() : null,
        handled_by: handled ? handledBy : null,
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteInquiry(id: string): Promise<void> {
    const { error } = await this.supabase.getClient().from('contact_inquiries').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async submitInquiry(input: ContactInquiryInput): Promise<string | null> {
    if (!this.supabase.isConfigured) {
      return 'Das Kontaktformular ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.';
    }

    const { data, error } = await this.supabase.getClient().functions.invoke('send-contact-inquiry', {
      body: {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        interest: input.interest,
        message: input.message.trim(),
      },
    });

    if (error) {
      return error.message || 'Anfrage konnte nicht gesendet werden.';
    }

    const response = data as { error?: string; success?: boolean } | null;

    if (response?.error) {
      return response.error;
    }

    if (!response?.success) {
      return 'Anfrage konnte nicht gesendet werden.';
    }

    return null;
  }
}
