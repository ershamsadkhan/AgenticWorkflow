import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ getPageTitle() }}</h1>
      </div>

      <div class="header-right">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input type="text" placeholder="Search workflows..." class="search-input" />
          <kbd class="search-kbd">⌘K</kbd>
        </div>

        <button class="btn-icon theme-toggle" (click)="theme.toggle()" [title]="theme.isDark() ? 'Light mode' : 'Dark mode'">
          {{ theme.isDark() ? '☀' : '☾' }}
        </button>

        <div class="notification-btn btn-icon" title="Notifications">
          🔔
          <span class="notification-dot"></span>
        </div>

        <div class="user-menu" (click)="showMenu = !showMenu">
          <div class="avatar">
            {{ getInitials() }}
          </div>
          @if (showMenu) {
            <div class="dropdown" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <strong>{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</strong>
                <span class="user-email">{{ auth.currentUser()?.email }}</span>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="showMenu = false">Profile</button>
              <button class="dropdown-item" (click)="showMenu = false">Settings</button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" (click)="auth.logout()">Log out</button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary);
      flex-shrink: 0;
    }

    .page-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 16px;
      color: var(--text-tertiary);
    }

    .search-input {
      width: 280px;
      padding: 8px 60px 8px 36px;
      background: var(--bg-input);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: all var(--transition-fast);

      &::placeholder { color: var(--text-tertiary); }
      &:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-primary-light); width: 360px; }
    }

    .search-kbd {
      position: absolute;
      right: 10px;
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: 4px;
      font-size: 11px;
      color: var(--text-tertiary);
      font-family: inherit;
    }

    .btn-icon, .notification-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 16px;
      transition: all var(--transition-fast);
      position: relative;

      &:hover { background: var(--bg-hover); color: var(--text-primary); }
    }

    .notification-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 7px;
      height: 7px;
      background: var(--danger);
      border-radius: 50%;
      border: 2px solid var(--bg-secondary);
    }

    .user-menu {
      position: relative;
      cursor: pointer;
      margin-left: 4px;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 220px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 8px;
      z-index: 100;
      animation: fadeIn 0.15s ease;
    }

    .dropdown-header {
      padding: 12px;
      strong { display: block; font-size: 14px; }
      .user-email { font-size: 12px; color: var(--text-tertiary); }
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-primary);
      margin: 4px 0;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: none;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 13px;
      text-align: left;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.danger { color: var(--danger); &:hover { background: var(--danger-light); } }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HeaderComponent {
  theme = inject(ThemeService);
  auth = inject(AuthService);
  router = inject(Router);
  showMenu = false;

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Dashboard';
    if (url.includes('editor')) return 'Workflow Editor';
    if (url.includes('workflows')) return 'Workflows';
    if (url.includes('executions')) return 'Executions';
    if (url.includes('credentials')) return 'Credentials';
    if (url.includes('settings')) return 'Settings';
    return 'FlowForge';
  }

  getInitials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }
}
