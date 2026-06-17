import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmployeeInput } from '../../../models/profile.model';
import { EmployeeService } from '../../../services/employee.service';

@Component({
  selector: 'app-admin-employee-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-employee-form.component.html',
  styleUrl: './admin-employee-form.component.scss',
})
export class AdminEmployeeFormComponent {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  form: EmployeeInput = {
    fullName: '',
    email: '',
    password: '',
  };

  saving = false;
  error = '';
  success = '';

  async onSubmit(): Promise<void> {
    this.error = '';
    this.success = '';
    this.saving = true;

    const message = await this.employeeService.createEmployee(this.form);
    this.saving = false;

    if (message) {
      this.error = message;
      return;
    }

    this.success = 'Mitarbeiter wurde angelegt und kann sich sofort anmelden.';
    setTimeout(() => {
      void this.router.navigate(['/admin/employees']);
    }, 1200);
  }
}
