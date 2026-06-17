import { Component, signal } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
  image: string;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent {
  testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Dr. Michael & Anna Weber',
      role: 'Käufer, Penthouse München',
      text: 'Unser Makler hat uns ein Off-Market-Penthouse präsentiert, das perfekt zu unseren Wünschen passte. Diskret und professionell.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    },
    {
      id: 2,
      name: 'Sabine Hoffmann',
      role: 'Verkäuferin, Villa am Starnberger See',
      text: 'Innerhalb von sechs Wochen hatten wir einen Käufer über unseren Wunschpreis. Die Vermarktung war auf höchstem Niveau.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    },
    {
      id: 3,
      name: 'Thomas Richter',
      role: 'Investor, Portfolio Hamburg',
      text: 'Die Marktanalyse und der Zugang zu renditestarken Objekten machen Prestige Immobilien zu meinem verlässlichen Partner.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    },
  ];

  activeIndex = signal(0);

  setActive(index: number): void {
    this.activeIndex.set(index);
  }

  next(): void {
    this.activeIndex.update((i) => (i + 1) % this.testimonials.length);
  }

  prev(): void {
    this.activeIndex.update((i) => (i - 1 + this.testimonials.length) % this.testimonials.length);
  }
}
