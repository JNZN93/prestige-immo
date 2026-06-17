import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageGalleryComponent } from '../image-gallery/image-gallery.component';
import { RevealDirective } from '../../directives/reveal.directive';
import { Property } from '../../models/property.model';
import { PropertyService } from '../../services/property.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, RevealDirective, ImageGalleryComponent],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);

  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly galleryOpen = signal(false);
  readonly galleryImages = signal<string[]>([]);
  readonly galleryTitle = signal('');

  async ngOnInit(): Promise<void> {
    const data = await this.propertyService.getPublished();
    this.properties.set(data);
    this.loading.set(false);
  }

  openGallery(property: Property): void {
    const images = this.getPropertyImages(property);
    if (!images.length) {
      return;
    }

    this.galleryImages.set(images);
    this.galleryTitle.set(property.title);
    this.galleryOpen.set(true);
  }

  closeGallery(): void {
    this.galleryOpen.set(false);
  }

  private getPropertyImages(property: Property): string[] {
    return property.images.length ? property.images : property.image ? [property.image] : [];
  }
}
