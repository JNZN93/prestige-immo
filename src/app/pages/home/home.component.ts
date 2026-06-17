import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { parseAutoScrollParams } from '../../services/auto-scroll.config';
import { AutoScrollService } from '../../services/auto-scroll.service';
import { HeroComponent } from '../../components/hero/hero.component';
import { PropertiesComponent } from '../../components/properties/properties.component';
import { ServicesComponent } from '../../components/services/services.component';
import { AboutComponent } from '../../components/about/about.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { ContactComponent } from '../../components/contact/contact.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    PropertiesComponent,
    ServicesComponent,
    AboutComponent,
    TestimonialsComponent,
    ContactComponent,
    FooterComponent,
  ],
  template: `
    <a href="#main-content" class="skip-link">Zum Inhalt springen</a>
    <app-header />
    <main id="main-content">
      <app-hero />
      <app-properties />
      <app-services />
      <app-about />
      <app-testimonials />
      <app-contact />
    </main>
    <app-footer />
  `,
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly autoScroll: AutoScrollService,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const options = parseAutoScrollParams(window.location.search);
    if (options) {
      this.autoScroll.start(options);
    }
  }

  ngOnDestroy(): void {
    this.autoScroll.stop();
  }
}
