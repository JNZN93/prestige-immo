import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isSupabaseConfigured } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;
  readonly supabaseConfigured = isSupabaseConfigured();

  async onSubmit(): Promise<void> {
    this.error = '';
    this.loading = true;

    const message = await this.auth.signIn(this.email.trim(), this.password);
    this.loading = false;

    if (message) {
      this.error = message;
      return;
    }

    await this.router.navigate(['/admin/properties']);
  }
}
