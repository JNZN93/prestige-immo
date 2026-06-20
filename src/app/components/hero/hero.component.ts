import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroSection') heroSection!: ElementRef<HTMLElement>;
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

  searchType = 'kaufen';
  searchLocation = '';
  videoReady = false;
  searchMessage = '';
  useSimpleVideoMode = false;

  readonly heroScrollHeight = signal(0);
  readonly contentReveal = signal(0);
  readonly contentOffsetY = signal(0);
  readonly readabilityOpacity = signal(0);

  private readonly clipDuration = 19;
  private readonly contentFadeLeadInClip = 13;
  private readonly scrollTrackViewports = 2;
  private readonly desktopVideoSrc = '/videos/127983-739777069_medium.mp4';
  private readonly mobileVideoSrc = '/videos/hero.mp4';
  private readonly seekThreshold = 0.08;
  private readonly minSeekIntervalMs = 80;

  private videoStartTime = 0;
  private activeClipDuration = 0;
  private contentHideOffset = 0;
  private scrollRaf = 0;
  private seekRaf = 0;
  private isSeeking = false;
  private pendingTargetTime: number | null = null;
  private lastAppliedTargetTime = -1;
  private lastSeekAt = 0;

  private onScroll = () => this.scheduleScrollUpdate();
  private onResize = () => {
    this.updateHeroScrollHeight();
    this.updateContentHideOffset();
    this.scheduleScrollUpdate();
  };

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.useSimpleVideoMode = this.shouldUseSimpleVideoMode();
    this.updateHeroScrollHeight();
    this.updateContentHideOffset();
    this.hideHeroContent();
    void this.initVideo();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    this.scheduleScrollUpdate();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);

    if (this.scrollRaf) {
      cancelAnimationFrame(this.scrollRaf);
    }

    if (this.seekRaf) {
      cancelAnimationFrame(this.seekRaf);
    }
  }

  private shouldUseSimpleVideoMode(): boolean {
    const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const narrowViewport = window.matchMedia('(max-width: 900px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return coarsePointer || narrowViewport || reducedMotion;
  }

  private async initVideo(): Promise<void> {
    const video = this.heroVideo?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    video.disablePictureInPicture = true;
    video.controls = false;

    if (this.useSimpleVideoMode) {
      await this.initSimpleVideo(video);
      return;
    }

    await this.initScrubVideo(video);
  }

  private async initSimpleVideo(video: HTMLVideoElement): Promise<void> {
    video.preload = 'metadata';
    video.loop = true;
    video.src = this.mobileVideoSrc;

    await this.waitForVideoMetadata(video);

    this.videoReady = true;
    this.updateHeroScrollHeight();

    try {
      await video.play();
    } catch {
      // Autoplay may require another user gesture on some devices.
    }

    this.updateContentFromScrollProgress();
  }

  private async initScrubVideo(video: HTMLVideoElement): Promise<void> {
    video.preload = 'auto';
    video.loop = false;
    video.pause();
    video.src = this.desktopVideoSrc;

    await this.waitForVideoMetadata(video);
    await this.waitForVideoBuffer(video);

    video.currentTime = this.getClipEndTime();
    this.lastAppliedTargetTime = video.currentTime;
    this.videoReady = true;
    this.updateHeroScrollHeight();
    this.updateVideoFromScroll();
  }

  private waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const applyMetadata = () => {
        const duration = this.getPlayableDuration(video);
        if (!duration) {
          return;
        }

        this.activeClipDuration = Math.min(this.clipDuration, duration);
        this.videoStartTime = Math.max(0, duration - this.activeClipDuration);
        resolve();
      };

      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        applyMetadata();
        return;
      }

      video.addEventListener('loadedmetadata', applyMetadata, { once: true });
      video.load();
    });
  }

  private waitForVideoBuffer(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        video.removeEventListener('progress', check);
        resolve();
      };

      const check = () => {
        if (this.isClipFullyBuffered(video) || video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          finish();
        }
      };

      check();
      video.addEventListener('progress', check);
      video.addEventListener('canplaythrough', finish, { once: true });
      window.setTimeout(finish, 8000);
    });
  }

  private isClipFullyBuffered(video: HTMLVideoElement): boolean {
    const clipEnd = this.getClipEndTime();
    if (!clipEnd) {
      return false;
    }

    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= this.videoStartTime + 0.05 && video.buffered.end(i) >= clipEnd - 0.05) {
        return true;
      }
    }

    return false;
  }

  private getPlayableDuration(video: HTMLVideoElement): number {
    if (video.seekable.length > 0) {
      return video.seekable.end(video.seekable.length - 1);
    }

    return video.duration;
  }

  private getViewportHeight(): number {
    return window.innerHeight;
  }

  private updateHeroScrollHeight(): void {
    const viewport = this.getViewportHeight();
    this.heroScrollHeight.set(viewport * (1 + this.scrollTrackViewports));
  }

  private updateContentHideOffset(): void {
    this.contentHideOffset = this.getViewportHeight();
  }

  private hideHeroContent(): void {
    this.contentReveal.set(0);
    this.contentOffsetY.set(this.contentHideOffset);
    this.readabilityOpacity.set(0);
  }

  private scheduleScrollUpdate(): void {
    if (this.scrollRaf) {
      return;
    }

    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;

      if (this.useSimpleVideoMode) {
        this.updateContentFromScrollProgress();
        return;
      }

      this.updateVideoFromScroll();
    });
  }

  private getScrollProgress(): number {
    const hero = this.heroSection?.nativeElement;
    if (!hero) {
      return 0;
    }

    const viewport = this.getViewportHeight();
    const scrollable = hero.offsetHeight - viewport;
    if (scrollable <= 0) {
      return 0;
    }

    const scrolled = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), scrollable);
    return scrolled / scrollable;
  }

  private getClipEndTime(): number {
    return this.videoStartTime + Math.max(this.activeClipDuration - 0.05, 0);
  }

  private updateContentFromScrollProgress(): void {
    const progress = this.getScrollProgress();
    const revealStart = 0.18;
    const revealEnd = 0.72;
    const normalized = (progress - revealStart) / (revealEnd - revealStart);
    const eased = this.easeOutCubic(Math.min(Math.max(normalized, 0), 1));

    this.contentReveal.set(eased);
    this.contentOffsetY.set((1 - eased) * this.contentHideOffset);
    this.readabilityOpacity.set(eased * 0.55);
  }

  private updateVideoFromScroll(): void {
    const video = this.heroVideo?.nativeElement;
    if (!video || !this.activeClipDuration) {
      this.hideHeroContent();
      return;
    }

    const progress = this.getScrollProgress();
    const clipEnd = this.getClipEndTime();
    const clipSpan = clipEnd - this.videoStartTime;
    const targetTime = clipEnd - progress * clipSpan;

    this.queueVideoSeek(video, targetTime);
    this.updateContentReveal(targetTime);
  }

  private queueVideoSeek(video: HTMLVideoElement, targetTime: number): void {
    this.pendingTargetTime = targetTime;

    if (this.isSeeking) {
      return;
    }

    const now = performance.now();
    if (now - this.lastSeekAt < this.minSeekIntervalMs) {
      if (!this.seekRaf) {
        this.seekRaf = requestAnimationFrame(() => {
          this.seekRaf = 0;
          this.flushVideoSeek(video);
        });
      }
      return;
    }

    this.flushVideoSeek(video);
  }

  private flushVideoSeek(video: HTMLVideoElement): void {
    if (this.pendingTargetTime === null || this.isSeeking) {
      return;
    }

    const targetTime = this.pendingTargetTime;

    if (
      Math.abs(video.currentTime - targetTime) < this.seekThreshold &&
      Math.abs(this.lastAppliedTargetTime - targetTime) < this.seekThreshold
    ) {
      this.pendingTargetTime = null;
      return;
    }

    this.isSeeking = true;
    this.lastAppliedTargetTime = targetTime;
    this.lastSeekAt = performance.now();

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      this.isSeeking = false;

      if (
        this.pendingTargetTime !== null &&
        Math.abs(this.pendingTargetTime - video.currentTime) >= this.seekThreshold
      ) {
        this.queueVideoSeek(video, this.pendingTargetTime);
        return;
      }

      this.pendingTargetTime = null;
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = targetTime;
  }

  private updateContentReveal(clipTime: number): void {
    const clipOffset = clipTime - this.videoStartTime;
    const revealEnd = Math.min(this.contentFadeLeadInClip, this.activeClipDuration);

    if (clipOffset > revealEnd) {
      this.hideHeroContent();
      return;
    }

    const rawProgress = (revealEnd - clipOffset) / this.contentFadeLeadInClip;
    const eased = this.easeOutCubic(Math.min(Math.max(rawProgress, 0), 1));

    this.contentReveal.set(eased);
    this.contentOffsetY.set((1 - eased) * this.contentHideOffset);
    this.readabilityOpacity.set(eased * 0.55);
  }

  private easeOutCubic(value: number): number {
    return 1 - Math.pow(1 - value, 3);
  }

  onSearch(): void {
    const type = this.searchType === 'kaufen' ? 'Kauf' : 'Miete';
    const location = this.searchLocation.trim();
    this.searchMessage = location
      ? `Suche nach Objekten zum ${type} in ${location} wird vorbereitet.`
      : `Bitte geben Sie eine Stadt oder PLZ ein, um Objekte zum ${type} zu finden.`;
  }
}
