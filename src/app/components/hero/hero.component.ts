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
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeroFrameLoaderService } from '../../services/hero-frame-loader.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroSection') heroSection!: ElementRef<HTMLElement>;
  @ViewChild('heroCanvas') heroCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly frameLoader = inject(HeroFrameLoaderService);

  searchType = 'kaufen';
  searchLocation = '';
  framesReady = false;
  searchMessage = '';

  readonly heroScrollHeight = signal(0);
  readonly contentReveal = signal(0);
  readonly contentOffsetY = signal(0);
  readonly readabilityOpacity = signal(0);

  private readonly scrollTrackViewports = 2;
  private frameCount = 0;
  private contentFadeLeadInFrames = 41;
  private contentHideOffset = 0;
  private currentFrameIndex = -1;
  private currentFrameBlend = -1;
  private scrollRaf = 0;
  private resizeObserver: ResizeObserver | null = null;

  private onScroll = () => this.scheduleScrollUpdate();
  private onResize = () => {
    this.resizeCanvas();
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
    void this.initFrames();
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
    this.resizeObserver?.disconnect();

    if (this.scrollRaf) {
      cancelAnimationFrame(this.scrollRaf);
    }
  }

  private async initFrames(): Promise<void> {
    try {
      const manifest = await this.frameLoader.preload();
      this.frameCount = manifest.frameCount;
      this.contentFadeLeadInFrames = manifest.contentFadeLeadInFrames;
      this.setupCanvasObserver();
      this.resizeCanvas();
      this.framesReady = true;
      this.updateHeroScrollHeight();
      this.updateSequenceFromScroll(true);
    } catch {
      this.frameLoader.complete();
    }
  }

  private setupCanvasObserver(): void {
    const wrap = this.heroCanvas?.nativeElement?.parentElement;
    if (!wrap || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
      this.drawFrame(this.currentFrameIndex, this.currentFrameBlend, true);
    });
    this.resizeObserver.observe(wrap);
  }

  private resizeCanvas(): void {
    const canvas = this.heroCanvas?.nativeElement;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = wrap.clientWidth;
    const height = wrap.clientHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
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
      this.updateSequenceFromScroll();
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

  private getFramePosition(progress: number): { index: number; blend: number } {
    if (this.frameCount <= 1) {
      return { index: 0, blend: 0 };
    }

    const exact = (1 - progress) * (this.frameCount - 1);
    const index = Math.min(Math.floor(exact), this.frameCount - 1);
    const blend = exact - index;

    return { index, blend };
  }

  private updateSequenceFromScroll(force = false): void {
    if (!this.framesReady || !this.frameCount) {
      this.hideHeroContent();
      return;
    }

    const progress = this.getScrollProgress();
    const { index: frameIndex, blend } = this.getFramePosition(progress);

    if (force || frameIndex !== this.currentFrameIndex || blend !== this.currentFrameBlend) {
      this.drawFrame(frameIndex, blend);
      this.currentFrameIndex = frameIndex;
      this.currentFrameBlend = blend;
    }

    this.updateContentReveal(frameIndex, blend);
  }

  private drawFrame(frameIndex: number, blend = 0, force = false): void {
    if (!force && frameIndex === this.currentFrameIndex && blend === this.currentFrameBlend) {
      return;
    }

    const canvas = this.heroCanvas?.nativeElement;
    const imageA = this.frameLoader.getFrame(frameIndex);
    if (!canvas || !imageA) {
      return;
    }

    const imageB =
      blend > 0 && frameIndex < this.frameCount - 1
        ? this.frameLoader.getFrame(frameIndex + 1)
        : null;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      return;
    }

    const dpr = canvas.width / canvas.clientWidth;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Opaque base frame; only the next frame is faded in on top (avoids black gaps).
    this.paintFrame(ctx, imageA);

    if (imageB && blend > 0.001) {
      this.paintFrame(ctx, imageB, blend);
    }
  }

  private paintFrame(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    alpha = 1,
  ): void {
    const canvas = this.heroCanvas.nativeElement;
    const canvasRatio = canvas.clientWidth / canvas.clientHeight;
    const imageRatio = image.width / image.height;
    let drawWidth = canvas.clientWidth;
    let drawHeight = canvas.clientHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > canvasRatio) {
      drawHeight = canvas.clientHeight;
      drawWidth = drawHeight * imageRatio;
      offsetX = (canvas.clientWidth - drawWidth) / 2;
    } else {
      drawWidth = canvas.clientWidth;
      drawHeight = drawWidth / imageRatio;
      offsetY = (canvas.clientHeight - drawHeight) / 2;
    }

    ctx.save();
    if (alpha < 1) {
      ctx.globalAlpha = alpha;
    }
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  private updateContentReveal(frameIndex: number, blend = 0): void {
    const framesFromStart = frameIndex + blend;
    const revealEnd = this.contentFadeLeadInFrames;

    if (framesFromStart > revealEnd) {
      this.hideHeroContent();
      return;
    }

    const rawProgress = (revealEnd - framesFromStart) / revealEnd;
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
