import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../services/auth.service';
import { ContactService } from '../../../services/contact.service';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly contactService = inject(ContactService);
  private readonly supabase = inject(SupabaseService);
  private inquiryChannel: RealtimeChannel | null = null;
  private lastOpenInquiryCount: number | null = null;
  private audioContext: AudioContext | null = null;

  readonly openInquiryCount = signal(0);

  async ngOnInit(): Promise<void> {
    await this.auth.loadProfile();
    await this.loadOpenInquiryCount();
    this.startInquirySubscription();
  }

  ngOnDestroy(): void {
    this.stopInquirySubscription();
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/admin/login']);
  }

  private async loadOpenInquiryCount(): Promise<void> {
    try {
      const count = await this.contactService.getOpenInquiriesCount();
      if (this.lastOpenInquiryCount !== null && count > this.lastOpenInquiryCount) {
        this.playNewInquirySound();
      }
      this.lastOpenInquiryCount = count;
      this.openInquiryCount.set(count);
    } catch {
      this.openInquiryCount.set(0);
    }
  }

  private playNewInquirySound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      if (this.audioContext.state === 'suspended') {
        void this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);

      const chime = [
        { freq: 587.33, at: 0 },
        { freq: 739.99, at: 0.07 },
        { freq: 880, at: 0.14 },
      ];

      for (const { freq, at } of chime) {
        const start = now + at;
        const duration = 0.48;

        const tone = ctx.createOscillator();
        const shimmer = ctx.createOscillator();
        const toneGain = ctx.createGain();
        const shimmerGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        tone.type = 'triangle';
        tone.frequency.value = freq;

        shimmer.type = 'sine';
        shimmer.frequency.value = freq * 2.01;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, start);
        filter.frequency.exponentialRampToValueAtTime(700, start + duration);

        toneGain.gain.setValueAtTime(0.0001, start);
        toneGain.gain.exponentialRampToValueAtTime(0.75, start + 0.016);
        toneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        shimmerGain.gain.setValueAtTime(0.0001, start);
        shimmerGain.gain.exponentialRampToValueAtTime(0.1, start + 0.016);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.4);

        tone.connect(toneGain);
        shimmer.connect(shimmerGain);
        toneGain.connect(filter);
        shimmerGain.connect(filter);
        filter.connect(master);

        tone.start(start);
        shimmer.start(start);
        tone.stop(start + duration);
        shimmer.stop(start + duration);
      }
    } catch {
      // Audio can be blocked by browser policy; ignore silently.
    }
  }

  private startInquirySubscription(): void {
    this.stopInquirySubscription();

    this.inquiryChannel = this.supabase
      .getClient()
      .channel('admin-inquiry-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_inquiries' },
        () => {
          void this.loadOpenInquiryCount();
        },
      )
      .subscribe();
  }

  private stopInquirySubscription(): void {
    if (!this.inquiryChannel) return;
    void this.supabase.getClient().removeChannel(this.inquiryChannel);
    this.inquiryChannel = null;
  }
}
