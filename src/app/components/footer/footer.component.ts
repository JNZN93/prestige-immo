import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  links = {
    nav: [
      { label: 'Immobilien', href: '#immobilien' },
      { label: 'Leistungen', href: '#leistungen' },
      { label: 'Über uns', href: '#ueber-uns' },
      { label: 'Kontakt', href: '#kontakt' },
    ],
    legal: [
      { label: 'Impressum', href: '#' },
      { label: 'Datenschutz', href: '#' },
      { label: 'AGB', href: '#' },
    ],
  };
}
