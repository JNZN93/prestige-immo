import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../../../models/property.model';
import { AuthService } from '../../../services/auth.service';
import { PropertyService } from '../../../services/property.service';

@Component({
  selector: 'app-admin-property-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-property-list.component.html',
  styleUrl: './admin-property-list.component.scss',
})
export class AdminPropertyListComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  readonly auth = inject(AuthService);

  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  deletingId = '';

  async ngOnInit(): Promise<void> {
    await this.auth.loadProfile();
    await this.load();
  }

  isAssignedToMe(property: Property): boolean {
    const profile = this.auth.profile();
    return !!profile?.id && property.assignedTo === profile.id;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const data = await this.propertyService.getAll();
      this.properties.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Inserate konnten nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProperty(property: Property): Promise<void> {
    if (!confirm(`„${property.title}" wirklich löschen?`)) {
      return;
    }

    this.deletingId = property.id;
    this.error.set('');

    try {
      await this.propertyService.delete(property.id);
      this.properties.update((items) => items.filter((item) => item.id !== property.id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.');
    } finally {
      this.deletingId = '';
    }
  }
}
