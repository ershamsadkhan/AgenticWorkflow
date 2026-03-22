import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page animate-fade-in">
      <h2 class="page-title">Settings</h2>
      <p class="page-subtitle">Manage your account and application preferences</p>

      <div class="settings-grid">
        <!-- Profile -->
        <div class="card settings-card">
          <h3 class="section-title">Profile</h3>
          <div class="form-group">
            <label>Email</label>
            <input class="input" [value]="auth.currentUser()?.email" disabled />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input class="input" [value]="auth.currentUser()?.firstName" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input class="input" [value]="auth.currentUser()?.lastName" />
            </div>
          </div>
          <button class="btn btn-primary btn-sm">Save Changes</button>
        </div>

        <!-- Appearance -->
        <div class="card settings-card">
          <h3 class="section-title">Appearance</h3>
          <div class="theme-selector">
            <div class="theme-option" [class.active]="theme.isDark()" (click)="theme.isDark() || theme.toggle()">
              <div class="theme-preview dark-preview">
                <div class="preview-sidebar"></div>
                <div class="preview-content">
                  <div class="preview-block"></div>
                  <div class="preview-block"></div>
                </div>
              </div>
              <span>Dark</span>
            </div>
            <div class="theme-option" [class.active]="!theme.isDark()" (click)="!theme.isDark() || theme.toggle()">
              <div class="theme-preview light-preview">
                <div class="preview-sidebar"></div>
                <div class="preview-content">
                  <div class="preview-block"></div>
                  <div class="preview-block"></div>
                </div>
              </div>
              <span>Light</span>
            </div>
          </div>
        </div>

        <!-- API -->
        <div class="card settings-card">
          <h3 class="section-title">API Configuration</h3>
          <div class="form-group">
            <label>API Base URL</label>
            <input class="input" value="http://localhost:5000" />
          </div>
          <div class="form-group">
            <label>Webhook Base URL</label>
            <input class="input" value="http://localhost:5000/webhook" />
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card settings-card danger-zone">
          <h3 class="section-title" style="color: var(--danger)">Danger Zone</h3>
          <div class="danger-item">
            <div>
              <strong>Log out</strong>
              <p>Sign out of your account</p>
            </div>
            <button class="btn btn-danger btn-sm" (click)="auth.logout()">Log Out</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .page-subtitle { color: var(--text-tertiary); font-size: 14px; margin-top: 2px; margin-bottom: 24px; }

    .settings-grid {
      display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 720px;
    }

    .settings-card { padding: 24px; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 20px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .theme-selector { display: flex; gap: 16px; }
    .theme-option {
      cursor: pointer; text-align: center;
      font-size: 13px; font-weight: 600; color: var(--text-secondary);
      span { display: block; margin-top: 8px; }
      &.active { color: var(--accent-primary); .theme-preview { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-primary-light); } }
    }

    .theme-preview {
      width: 120px; height: 80px; border-radius: var(--radius-md);
      border: 2px solid var(--border-primary); overflow: hidden;
      display: flex; transition: all var(--transition-fast);
    }
    .preview-sidebar { width: 30px; }
    .preview-content { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
    .preview-block { height: 12px; border-radius: 3px; }

    .dark-preview {
      background: #0a0a0f;
      .preview-sidebar { background: #12121a; }
      .preview-block { background: #2a2a4a; }
    }
    .light-preview {
      background: #f8f9fc;
      .preview-sidebar { background: #ffffff; border-right: 1px solid #e2e4ea; }
      .preview-block { background: #e2e4ea; }
    }

    .danger-zone { border-color: rgba(239, 68, 68, 0.3); }
    .danger-item {
      display: flex; align-items: center; justify-content: space-between;
      p { font-size: 13px; color: var(--text-tertiary); margin-top: 2px; }
    }
  `]
})
export class SettingsComponent {
  theme = inject(ThemeService);
  auth = inject(AuthService);
}
