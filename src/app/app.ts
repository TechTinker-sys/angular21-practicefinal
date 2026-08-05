import { Component, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular21-practice');
  protected readonly routeTransition = signal(true);

  protected readonly navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/playground', label: 'Playground' },
    { path: '/about', label: 'About' }
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly isDark = signal(this.getInitialTheme());
  protected readonly mobileMenuOpen = signal(false);

  constructor(private router: Router, private titleService: Title, private meta: Meta) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.routeTransition.set(false);
      } else if (event instanceof NavigationEnd) {
        // Set title and meta description based on deepest activated route data
        const root = this.router.routerState.root;
        let route = root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        const data = route.snapshot.data || {};
        if (data['title']) {
          this.titleService.setTitle(data['title']);
        }
        if (data['description']) {
          const descTag = this.meta.getTag('name=description');
          if (descTag) {
            this.meta.updateTag({ name: 'description', content: data['description'] });
          } else {
            this.meta.addTag({ name: 'description', content: data['description'] });
          }
        }

        setTimeout(() => this.routeTransition.set(true));
      }
    });

    effect(() => {
      const dark = this.isDark();
      if (!this.isBrowser) return;
      document.documentElement.classList.toggle('dark', dark);
      try {
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      } catch {
        /* localStorage unavailable — safe to ignore */
      }
    });
  }

  private getInitialTheme(): boolean {
    if (!this.isBrowser) return true;
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  }

  toggleTheme(): void {
    this.isDark.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
