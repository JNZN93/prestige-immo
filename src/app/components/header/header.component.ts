import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly auth = inject(AuthService);

  scrolled = signal(false);
  menuOpen = signal(false);
  activeSection = signal('hero');

  navLinks = [
    { label: 'Immobilien', href: '#immobilien', id: 'immobilien' },
    { label: 'Leistungen', href: '#leistungen', id: 'leistungen' },
    { label: 'Über uns', href: '#ueber-uns', id: 'ueber-uns' },
    { label: 'Kontakt', href: '#kontakt', id: 'kontakt' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
    this.updateActiveSection();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  private updateActiveSection(): void {
    const sections = ['hero', 'immobilien', 'leistungen', 'ueber-uns', 'kontakt'];
    const scrollPos = window.scrollY + 120;

    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i]);
      if (el && el.offsetTop <= scrollPos) {
        this.activeSection.set(sections[i]);
        return;
      }
    }
  }
}
