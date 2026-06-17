import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPTY_PROPERTY_INPUT,
  mapPropertyToInput,
  PropertyInput,
  PropertyLayout,
  PropertyType,
} from '../../../models/property.model';
import { Profile } from '../../../models/profile.model';
import { AuthService } from '../../../services/auth.service';
import { EmployeeService } from '../../../services/employee.service';
import { PropertyService } from '../../../services/property.service';

@Component({
  selector: 'app-admin-property-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-property-form.component.html',
  styleUrl: './admin-property-form.component.scss',
})
export class AdminPropertyFormComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly auth = inject(AuthService);

  form: PropertyInput = { ...EMPTY_PROPERTY_INPUT, images: [] };
  readonly staff = signal<Profile[]>([]);
  propertyId = '';
  loading = true;
  saving = false;
  uploading = false;
  error = '';
  assignedDisplayName = '';
  newImageUrl = '';
  private lockedAssignedTo: string | null = null;

  readonly types: PropertyType[] = ['Kauf', 'Miete'];
  readonly layouts: PropertyLayout[] = ['hero', 'wide', 'tall', 'standard'];

  get isEditMode(): boolean {
    return !!this.propertyId;
  }

  async ngOnInit(): Promise<void> {
    await this.auth.loadProfile();
    this.propertyId = this.route.snapshot.paramMap.get('id') ?? '';

    if (this.auth.isOwner()) {
      try {
        this.staff.set(await this.employeeService.getActiveStaff());
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Mitarbeiter konnten nicht geladen werden.';
      }
    }

    if (!this.isEditMode) {
      this.loading = false;
      return;
    }

    try {
      const property = await this.propertyService.getById(this.propertyId);
      if (!property) {
        this.error = 'Inserat nicht gefunden.';
        return;
      }

      this.form = mapPropertyToInput(property);
      this.lockedAssignedTo = property.assignedTo ?? null;
      this.assignedDisplayName = property.assignedToName || '';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Inserat konnte nicht geladen werden.';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    this.error = '';

    if (!this.form.images.length) {
      this.error = 'Bitte mindestens ein Bild hinzufügen.';
      return;
    }

    this.saving = true;

    if (!this.auth.isOwner()) {
      this.form.assignedTo = this.lockedAssignedTo;
    }

    try {
      if (this.isEditMode) {
        await this.propertyService.update(this.propertyId, this.form);
      } else {
        await this.propertyService.create(this.form);
      }

      await this.router.navigate(['/admin/properties']);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Speichern fehlgeschlagen.';
    } finally {
      this.saving = false;
    }
  }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    this.uploading = true;
    this.error = '';

    try {
      const urls = await this.propertyService.uploadImages(Array.from(files));
      this.form.images = [...this.form.images, ...urls];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Bild-Upload fehlgeschlagen.';
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  addImageUrl(): void {
    const url = this.newImageUrl.trim();
    if (!url) {
      return;
    }

    this.form.images = [...this.form.images, url];
    this.newImageUrl = '';
  }

  removeImage(index: number): void {
    this.form.images = this.form.images.filter((_, i) => i !== index);
  }

  setCover(index: number): void {
    if (index <= 0 || index >= this.form.images.length) {
      return;
    }

    const images = [...this.form.images];
    const [selected] = images.splice(index, 1);
    images.unshift(selected);
    this.form.images = images;
  }
}
