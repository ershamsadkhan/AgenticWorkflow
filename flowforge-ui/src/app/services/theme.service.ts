import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(true);

  constructor() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDark.set(saved === 'dark');
    }
    this.applyTheme();
  }

  toggle() {
    this.isDark.update(v => !v);
    this.applyTheme();
  }

  private applyTheme() {
    const theme = this.isDark() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
}
