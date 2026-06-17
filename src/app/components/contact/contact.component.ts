import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../directives/reveal.directive';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  form = {
    name: '',
    email: '',
    phone: '',
    interest: 'kaufen',
    message: '',
  };

  errors: Record<string, string> = {};
  submitted = false;
  submitting = false;
  submitError = '';

  constructor(private readonly contactService: ContactService) {}

  async onSubmit(): Promise<void> {
    if (this.submitting) return;

    this.errors = {};
    this.submitError = '';

    if (!this.form.name.trim()) {
      this.errors['name'] = 'Bitte geben Sie Ihren Namen ein.';
    }

    if (!this.form.email.trim()) {
      this.errors['email'] = 'Bitte geben Sie Ihre E-Mail ein.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      this.errors['email'] = 'Bitte geben Sie eine gültige E-Mail ein.';
    }

    if (Object.keys(this.errors).length > 0) return;

    this.submitting = true;

    const error = await this.contactService.submitInquiry(this.form);

    this.submitting = false;

    if (error) {
      this.submitError = error;
      return;
    }

    this.submitted = true;
    this.form = { name: '', email: '', phone: '', interest: 'kaufen', message: '' };

    setTimeout(() => {
      this.submitted = false;
    }, 4000);
  }
}
