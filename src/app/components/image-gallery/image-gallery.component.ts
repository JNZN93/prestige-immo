import { DOCUMENT } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  Output,
  signal,
} from '@angular/core';

const CLOSE_MS = 360;
const CROSSFADE_MS = 300;

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.scss',
})
export class ImageGalleryComponent {
  @Input({ required: true }) images: string[] = [];
  @Input({ required: true }) title = '';

  @Output() closed = new EventEmitter<void>();

  readonly isVisible = signal(false);
  readonly isClosing = signal(false);
  readonly currentIndex = signal(0);
  readonly previousIndex = signal<number | null>(null);

  private closeTimer = 0;
  private crossfadeTimer = 0;
  private isAnimatingImage = false;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  @Input() set open(value: boolean) {
    if (value) {
      window.clearTimeout(this.closeTimer);
      this.isClosing.set(false);
      this.isVisible.set(true);
      this.currentIndex.set(0);
      this.previousIndex.set(null);
      this.isAnimatingImage = false;
      this.document.body.style.overflow = 'hidden';
    }
  }

  get hasMultiple(): boolean {
    return this.images.length > 1;
  }

  close(): void {
    if (!this.isVisible() || this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.closeTimer = window.setTimeout(() => {
      this.isVisible.set(false);
      this.isClosing.set(false);
      this.previousIndex.set(null);
      this.document.body.style.overflow = '';
      this.closed.emit();
    }, CLOSE_MS);
  }

  next(): void {
    if (!this.hasMultiple) {
      return;
    }

    this.goTo((this.currentIndex() + 1) % this.images.length);
  }

  prev(): void {
    if (!this.hasMultiple) {
      return;
    }

    this.goTo((this.currentIndex() - 1 + this.images.length) % this.images.length);
  }

  goTo(index: number): void {
    if (index === this.currentIndex() || this.isAnimatingImage || this.isClosing()) {
      return;
    }

    this.isAnimatingImage = true;
    this.previousIndex.set(this.currentIndex());
    this.currentIndex.set(index);

    window.clearTimeout(this.crossfadeTimer);
    this.crossfadeTimer = window.setTimeout(() => {
      this.previousIndex.set(null);
      this.isAnimatingImage = false;
    }, CROSSFADE_MS);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isVisible() || this.isClosing()) {
      return;
    }

    if (event.key === 'Escape') {
      this.close();
    }

    if (event.key === 'ArrowRight') {
      this.next();
    }

    if (event.key === 'ArrowLeft') {
      this.prev();
    }
  }
}
