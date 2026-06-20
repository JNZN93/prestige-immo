import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface HeroFrameManifest {
  frameCount: number;
  clipSeconds: number;
  fps?: number;
  pattern: string;
  extension?: string;
  baseUrl?: string;
  contentFadeLeadInFrames: number;
}

const MANIFEST_URL = '/videos/hero-frames/manifest.json';
const LOAD_CONCURRENCY = 10;
/** Last N frames — visible at page load and during early scroll. */
const PRIORITY_FRAME_COUNT = 65;

@Injectable({ providedIn: 'root' })
export class HeroFrameLoaderService {
  readonly progress = signal(0);
  readonly visible = signal(false);
  readonly ready = signal(false);

  private manifest: HeroFrameManifest | null = null;
  private frames: (HTMLImageElement | null)[] = [];
  private loadPromise: Promise<HeroFrameManifest> | null = null;
  private backgroundLoadPromise: Promise<void> | null = null;
  private interactiveUnlocked = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  shouldPreload(path: string): boolean {
    const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
    return normalized === '/';
  }

  getManifest(): HeroFrameManifest | null {
    return this.manifest;
  }

  getFrame(index: number): HTMLImageElement | null {
    if (index < 0 || index >= this.frames.length) {
      return null;
    }

    if (this.frames[index]) {
      return this.frames[index];
    }

    for (let offset = 1; offset < this.frames.length; offset++) {
      const after = this.frames[index + offset];
      if (after) {
        return after;
      }

      const before = this.frames[index - offset];
      if (before) {
        return before;
      }
    }

    return null;
  }

  getFrameUrl(index: number): string {
    const oneBased = String(index + 1).padStart(3, '0');
    const ext = this.manifest?.extension ?? 'webp';
    return `${this.getBaseUrl()}/frame-${oneBased}.${ext}`;
  }

  complete(): void {
    this.progress.set(100);
    this.ready.set(true);
    this.hideLoaderSoon();
  }

  async preload(): Promise<HeroFrameManifest> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.getFallbackManifest();
    }

    if (this.manifest && this.interactiveUnlocked) {
      return this.manifest;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.visible.set(true);
    this.progress.set(0);
    this.ready.set(false);
    this.interactiveUnlocked = false;
    this.loadPromise = this.loadFrames();

    return this.loadPromise;
  }

  private startBackgroundLoad(indices: number[]): void {
    if (!indices.length || this.backgroundLoadPromise) {
      return;
    }

    this.backgroundLoadPromise = this.loadIndices(indices, 85, 100).then(() => {
      this.ready.set(true);
      this.progress.set(100);
    });
  }

  private getFallbackManifest(): HeroFrameManifest {
    return {
      frameCount: 120,
      clipSeconds: 15,
      fps: 8,
      extension: 'webp',
      pattern: '/videos/hero-frames/frame-{index}.webp',
      contentFadeLeadInFrames: 56,
    };
  }

  private getManifestUrl(): string {
    const envBase = (environment as { heroFramesBaseUrl?: string | null }).heroFramesBaseUrl;
    if (envBase) {
      return `${envBase.replace(/\/$/, '')}/manifest.json`;
    }

    return MANIFEST_URL;
  }

  private getBaseUrl(): string {
    const envBase = (environment as { heroFramesBaseUrl?: string | null }).heroFramesBaseUrl;
    if (envBase) {
      return envBase.replace(/\/$/, '');
    }

    if (this.manifest?.baseUrl) {
      return this.manifest.baseUrl.replace(/\/$/, '');
    }

    return '/videos/hero-frames';
  }

  private async loadFrames(): Promise<HeroFrameManifest> {
    const manifestUrl = this.getManifestUrl();
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error('Hero frame manifest not found.');
    }

    this.manifest = (await response.json()) as HeroFrameManifest;
    this.frames = new Array(this.manifest.frameCount).fill(null);

    const priority = this.buildPriorityOrder(this.manifest.frameCount);

    await this.loadIndices(priority, 0, 85);
    this.unlockInteractive();

    const rest = [...Array(this.manifest.frameCount).keys()].filter(
      (index) => !priority.includes(index),
    );
    this.startBackgroundLoad(rest);

    return this.manifest;
  }

  private buildPriorityOrder(frameCount: number): number[] {
    const count = Math.min(PRIORITY_FRAME_COUNT, frameCount);
    const indices: number[] = [];

    for (let index = frameCount - 1; index >= frameCount - count; index--) {
      indices.push(index);
    }

    return indices;
  }

  private async loadIndices(indices: number[], progressFrom: number, progressTo: number): Promise<void> {
    let loaded = 0;

    await this.runWithConcurrency(indices, LOAD_CONCURRENCY, async (index) => {
      this.frames[index] = await this.loadImage(this.getFrameUrl(index));
      loaded++;
      const ratio = loaded / indices.length;
      this.progress.set(Math.round(progressFrom + ratio * (progressTo - progressFrom)));
    });
  }

  private async runWithConcurrency(
    items: number[],
    concurrency: number,
    worker: (index: number) => Promise<void>,
  ): Promise<void> {
    let cursor = 0;

    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor++;
        await worker(item);
      }
    });

    await Promise.all(runners);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Frame could not be loaded: ${src}`));
      image.src = src;
    });
  }

  private unlockInteractive(): void {
    this.interactiveUnlocked = true;
    this.progress.set(Math.max(this.progress(), 85));
    this.hideLoaderSoon();
  }

  private hideLoaderSoon(): void {
    window.setTimeout(() => this.visible.set(false), 350);
  }
}
