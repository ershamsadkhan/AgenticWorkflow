import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-layout">
      <app-sidebar [collapsed]="sidebarCollapsed()" (toggleCollapse)="toggleSidebar()" />
      <div class="main-area">
        <app-header />
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
    }

    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      background: var(--bg-primary);
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }
}
