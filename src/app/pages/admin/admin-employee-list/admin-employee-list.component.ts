import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile } from '../../../models/profile.model';
import { EmployeeService } from '../../../services/employee.service';

@Component({
  selector: 'app-admin-employee-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-employee-list.component.html',
  styleUrl: './admin-employee-list.component.scss',
})
export class AdminEmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);

  readonly employees = signal<Profile[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  updatingId = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const data = await this.employeeService.getStaff();
      this.employees.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Mitarbeiter konnten nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActive(employee: Profile): Promise<void> {
    const nextActive = !employee.active;
    const action = nextActive ? 'aktivieren' : 'deaktivieren';

    if (!confirm(`Mitarbeiter „${employee.fullName || employee.email}" wirklich ${action}?`)) {
      return;
    }

    this.updatingId = employee.id;
    this.error.set('');

    try {
      await this.employeeService.setEmployeeActive(employee.id, nextActive);
      this.employees.update((items) =>
        items.map((item) => (item.id === employee.id ? { ...item, active: nextActive } : item)),
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.');
    } finally {
      this.updatingId = '';
    }
  }
}
