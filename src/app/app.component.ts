import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { HeroVideoLoaderService } from './services/hero-video-loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingScreenComponent],
  template: `
    @if (loader.visible()) {
      <app-loading-screen [progress]="loader.progress()" />
    }
    <div class="app-shell" [class.app-shell--hidden]="loader.visible()">
      <router-outlet />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .app-shell--hidden {
      visibility: hidden;
      overflow: hidden;
      height: 100vh;
    }
  `,
})
export class AppComponent implements OnInit {
  readonly loader = inject(HeroVideoLoaderService);
  private readonly router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.loader.shouldPreload(this.router.url)) {
      void this.loader.preload();
    }

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const url = (event as NavigationEnd).urlAfterRedirects;
      if (this.loader.shouldPreload(url) && !this.loader.ready()) {
        void this.loader.preload();
      }
    });
  }
}
