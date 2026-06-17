import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ContactInquiry } from '../../../models/contact.model';
import { AuthService } from '../../../services/auth.service';
import { ContactService } from '../../../services/contact.service';
import { SupabaseService } from '../../../services/supabase.service';

const INTEREST_LABELS: Record<string, string> = {
  kaufen: 'Kaufen',
  verkaufen: 'Verkaufen',
  mieten: 'Mieten',
  vermieten: 'Vermieten',
  beratung: 'Allgemeine Beratung',
};

@Component({
  selector: 'app-admin-inquiry-list',
  standalone: true,
  templateUrl: './admin-inquiry-list.component.html',
  styleUrl: './admin-inquiry-list.component.scss',
})
export class AdminInquiryListComponent implements OnInit, OnDestroy {
  private readonly contactService = inject(ContactService);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private inquiryChannel: RealtimeChannel | null = null;

  readonly inquiries = signal<ContactInquiry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  updatingId = '';
  deletingId = '';

  async ngOnInit(): Promise<void> {
    await this.auth.loadProfile();
    await this.load();
    this.startRealtimeSubscription();
  }

  ngOnDestroy(): void {
    this.stopRealtimeSubscription();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const data = await this.contactService.getInquiries();
      this.inquiries.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Anfragen konnten nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  formatInterest(interest: string): string {
    return INTEREST_LABELS[interest] ?? interest;
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  async toggleHandled(inquiry: ContactInquiry): Promise<void> {
    const nextHandled = !inquiry.handled;
    const profile = this.auth.profile();
    this.updatingId = inquiry.id;
    this.error.set('');

    if (nextHandled && !profile?.id) {
      this.error.set('Ihr Profil konnte nicht geladen werden. Bitte neu einloggen.');
      this.updatingId = '';
      return;
    }

    try {
      await this.contactService.setInquiryHandled(inquiry.id, nextHandled, profile?.id ?? null);
      this.inquiries.update((items) =>
        items.map((item) =>
          item.id === inquiry.id
            ? {
                ...item,
                handled: nextHandled,
                handledAt: nextHandled ? new Date().toISOString() : null,
                handledBy: nextHandled ? profile?.id ?? null : null,
                handledByName: nextHandled ? profile?.fullName || profile?.email || null : null,
              }
            : item,
        ),
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Status konnte nicht gespeichert werden.');
    } finally {
      this.updatingId = '';
    }
  }

  async deleteInquiry(inquiry: ContactInquiry): Promise<void> {
    if (!confirm(`Anfrage von „${inquiry.name}" wirklich löschen?`)) {
      return;
    }

    this.deletingId = inquiry.id;
    this.error.set('');

    try {
      await this.contactService.deleteInquiry(inquiry.id);
      this.inquiries.update((items) => items.filter((item) => item.id !== inquiry.id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Anfrage konnte nicht gelöscht werden.');
    } finally {
      this.deletingId = '';
    }
  }

  private startRealtimeSubscription(): void {
    this.stopRealtimeSubscription();

    this.inquiryChannel = this.supabase
      .getClient()
      .channel('admin-contact-inquiries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_inquiries',
        },
        () => {
          void this.load();
        },
      )
      .subscribe();
  }

  private stopRealtimeSubscription(): void {
    if (!this.inquiryChannel) return;
    void this.supabase.getClient().removeChannel(this.inquiryChannel);
    this.inquiryChannel = null;
  }
}
