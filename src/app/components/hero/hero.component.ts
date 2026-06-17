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

  readonly heroScrollHeight = signal(0);
  readonly contentReveal = signal(0);
  readonly contentOffsetY = signal(0);
  readonly readabilityOpacity = signal(0);

  private readonly clipDuration = 19;
  private readonly contentFadeLeadInClip = 13;
  private readonly scrollTrackViewports = 2;

  private videoStartTime = 0;
  private activeClipDuration = 0;
  private contentHideOffset = 0;
  private scrollRaf = 0;
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

    this.updateHeroScrollHeight();
    this.updateContentHideOffset();
    this.hideHeroContent();
    this.initVideo();
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
  }

  private initVideo(): void {
    const video = this.heroVideo?.nativeElement;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    video.pause();

    const onReady = () => {
      const duration = this.getPlayableDuration(video);
      if (!duration) {
        return;
      }

      this.activeClipDuration = Math.min(this.clipDuration, duration);
      this.videoStartTime = Math.max(0, duration - this.activeClipDuration);
      this.videoReady = true;
      video.currentTime = this.getClipEndTime();
      this.updateHeroScrollHeight();
      this.updateVideoFromScroll();
    };

    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('loadeddata', onReady);
    video.load();

    if (video.readyState >= 1) {
      onReady();
    }
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
    if (this.scrollRaf) return;

    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
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

    if (Math.abs(video.currentTime - targetTime) > 0.04) {
      video.currentTime = targetTime;
    }

    this.updateContentReveal(targetTime);
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
