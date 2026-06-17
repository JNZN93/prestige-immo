import { Component, OnDestroy, OnInit } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit, OnDestroy {
  stats: Stat[] = [
    { value: 847, suffix: '', label: 'Vermittelte Objekte' },
    { value: 15, suffix: '', label: 'Jahre Erfahrung' },
    { value: 97, suffix: '%', label: 'Kundenzufriedenheit' },
    { value: 12, suffix: '', label: 'Standorte in DE' },
  ];

  animatedStats: number[] = [0, 0, 0, 0];
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const el = document.querySelector('.about__stats');
    if (!el) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.animateStats();
          this.observer?.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animateStats(): void {
    this.stats.forEach((stat, i) => {
      const duration = 2000;
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.animatedStats[i] = Math.round(stat.value * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  }
}
