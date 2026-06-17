import { Component } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

interface Service {
  icon: string;
  title: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  services: Service[] = [
    {
      icon: 'home',
      title: 'Verkauf & Vermittlung',
      description: 'Professionelle Bewertung und diskrete Vermarktung Ihrer Immobilie mit maximalem Ertrag.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80',
    },
    {
      icon: 'search',
      title: 'Exklusive Suche',
      description: 'Zugang zu Off-Market-Objekten und personalisierte Suchprofile für anspruchsvolle Käufer.',
      image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80',
    },
    {
      icon: 'chart',
      title: 'Marktanalyse',
      description: 'Fundierte Markteinschätzungen und Investitionsberatung auf Basis aktueller Daten.',
      image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=80',
    },
    {
      icon: 'key',
      title: 'Vermietung',
      description: 'Komplette Betreuung von der Mietersuche bis zur Verwaltung Ihrer Renditeimmobilie.',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80',
    },
  ];
}
