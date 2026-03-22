import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-brand">
        <div class="logo">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#a855f7"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)"/>
            <path d="M10 11h4l4 5-4 5h-4l4-5z" fill="white"/>
            <path d="M16 11h4l4 5-4 5h-4l4-5z" fill="white" opacity=".6"/>
          </svg>
        </div>
        @if (!collapsed()) {
          <span class="brand-text">FlowForge</span>
        }
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          @if (!collapsed()) { <span class="nav-label">Main</span> }
          @for (item of mainNav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item"
               [attr.title]="collapsed() ? item.label : null">
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) { <span class="nav-text">{{ item.label }}</span> }
            </a>
          }
        </div>

        <div class="nav-section">
          @if (!collapsed()) { <span class="nav-label">Manage</span> }
          @for (item of manageNav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item"
               [attr.title]="collapsed() ? item.label : null">
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) { <span class="nav-text">{{ item.label }}</span> }
            </a>
          }
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="collapse-btn" (click)="toggleCollapse.emit()">
          <span class="nav-icon">{{ collapsed() ? '▶' : '◀' }}</span>
          @if (!collapsed()) { <span class="nav-text">Collapse</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width); height: 100vh;
      background: var(--bg-secondary); border-right: 1px solid var(--border-primary);
      display: flex; flex-direction: column;
      transition: width var(--transition-slow); overflow: hidden; flex-shrink: 0;
      &.collapsed {
        width: var(--sidebar-collapsed);
        .nav-item { justify-content: center; padding: 10px; }
        .sidebar-brand { justify-content: center; padding: 16px; }
        .collapse-btn { justify-content: center; padding: 10px; }
      }
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 20px 16px; border-bottom: 1px solid var(--border-primary);
    }
    .brand-text {
      font-size: 18px; font-weight: 800;
      background: var(--accent-gradient); -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; letter-spacing: -0.02em;
    }
    .sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 8px; }
    .nav-section { margin-bottom: 8px; }
    .nav-label {
      display: block; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--text-tertiary); padding: 12px 14px 6px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: var(--radius-md);
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      text-decoration: none; transition: all var(--transition-fast); margin-bottom: 2px;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.active { background: var(--accent-primary-light); color: var(--accent-primary); }
    }
    .nav-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .sidebar-footer { padding: 12px 8px; border-top: 1px solid var(--border-primary); }
    .collapse-btn {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      width: 100%; border: none; border-radius: var(--radius-md); background: transparent;
      color: var(--text-tertiary); font-family: inherit; font-size: 13px;
      cursor: pointer; transition: all var(--transition-fast);
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
    }
  `]
})
export class SidebarComponent {
  collapsed = input(false);
  toggleCollapse = output<void>();

  mainNav = [
    { path: '/dashboard', label: 'Dashboard', icon: '◉' },
    { path: '/workflows', label: 'Workflows', icon: '⬡' },
    { path: '/executions', label: 'Executions', icon: '▷' },
  ];

  manageNav = [
    { path: '/credentials', label: 'Credentials', icon: '🔑' },
    { path: '/variables', label: 'Variables', icon: '{ }' },
    { path: '/settings', label: 'Settings', icon: '⚙' },
  ];
}
