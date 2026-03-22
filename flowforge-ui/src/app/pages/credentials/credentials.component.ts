import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Credential } from '../../models/workflow.model';

@Component({
  selector: 'app-credentials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="credentials-page">
      <div class="page-header animate-fade-in">
        <div>
          <h2>Credentials</h2>
          <p class="subtitle">Manage API keys and authentication tokens</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">+ Add Credential</button>
      </div>

      <div class="cred-grid animate-fade-in">
        @for (cred of credentials(); track cred.id) {
          <div class="cred-card">
            <div class="cred-header">
              <div class="cred-icon" [style.background]="getTypeColor(cred.type)">
                {{ getTypeIcon(cred.type) }}
              </div>
              <div class="cred-info">
                <h3>{{ cred.name }}</h3>
                <span class="cred-type">{{ cred.type }}</span>
              </div>
              <button class="btn-icon" (click)="deleteCred(cred)">🗑</button>
            </div>
            <div class="cred-meta">
              <span>Created {{ formatDate(cred.createdAt) }}</span>
              <span class="cred-dot">·</span>
              <span>Updated {{ formatDate(cred.updatedAt) }}</span>
            </div>
            <div class="cred-secret">
              <span class="secret-dots">•••••••••••••••••</span>
            </div>
          </div>
        }

        @if (!credentials().length) {
          <div class="empty-state" style="grid-column: 1 / -1">
            <div class="icon">🔑</div>
            <div class="title">No credentials yet</div>
            <div class="text">Add credentials to securely connect to external services.</div>
            <button class="btn btn-primary" (click)="showModal.set(true)">Add Credential</button>
          </div>
        }
      </div>

      <!-- Add Modal -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="showModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
              <h2 style="font-size: 20px; font-weight: 700;">Add Credential</h2>
              <button class="btn-icon" (click)="showModal.set(false)">✕</button>
            </div>
            <div class="form-group">
              <label>Name</label>
              <input class="input" [(ngModel)]="newName" placeholder="My API Key" />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select class="input" [(ngModel)]="newType">
                <option value="ApiKey">API Key</option>
                <option value="OAuth2">OAuth 2.0</option>
                <option value="BasicAuth">Basic Auth</option>
                <option value="BearerToken">Bearer Token</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div class="form-group">
              <label>Secret Data</label>
              <textarea class="input" [(ngModel)]="newData" placeholder="Enter your API key or token..." rows="4"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
              <button class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="createCred()">Save Credential</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;
      h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
      .subtitle { color: var(--text-tertiary); font-size: 14px; margin-top: 2px; }
    }

    .cred-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;
    }

    .cred-card {
      background: var(--bg-card); border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg); padding: 20px;
      transition: all var(--transition-base);
      &:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-md); }
    }

    .cred-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .cred-icon {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: white; flex-shrink: 0;
    }
    .cred-info { flex: 1; }
    .cred-info h3 { font-size: 15px; font-weight: 700; }
    .cred-type { font-size: 12px; color: var(--text-tertiary); }

    .cred-meta {
      font-size: 11px; color: var(--text-tertiary); margin-bottom: 12px;
      .cred-dot { margin: 0 4px; }
    }

    .cred-secret {
      background: var(--bg-input); border: 1px solid var(--border-primary);
      border-radius: var(--radius-sm); padding: 8px 12px;
    }
    .secret-dots { color: var(--text-tertiary); font-size: 12px; letter-spacing: 2px; }
  `]
})
export class CredentialsComponent implements OnInit {
  private api = inject(ApiService);

  credentials = signal<Credential[]>([]);
  showModal = signal(false);
  newName = '';
  newType = 'ApiKey';
  newData = '';

  ngOnInit() {
    this.loadCredentials();
  }

  loadCredentials() {
    this.api.getCredentials().subscribe(c => this.credentials.set(c));
  }

  createCred() {
    this.api.createCredential({ name: this.newName, type: this.newType, data: this.newData }).subscribe(() => {
      this.showModal.set(false);
      this.newName = ''; this.newData = '';
      this.loadCredentials();
    });
  }

  deleteCred(cred: Credential) {
    if (confirm(`Delete credential "${cred.name}"?`)) {
      this.api.deleteCredential(cred.id).subscribe(() => this.loadCredentials());
    }
  }

  getTypeColor(type: string): string {
    switch (type) { case 'OAuth2': return '#8b5cf6'; case 'ApiKey': return '#3b82f6'; case 'BasicAuth': return '#f59e0b'; case 'BearerToken': return '#22c55e'; default: return '#6366f1'; }
  }

  getTypeIcon(type: string): string {
    switch (type) { case 'OAuth2': return '🔐'; case 'ApiKey': return '🔑'; case 'BasicAuth': return '👤'; case 'BearerToken': return '🎫'; default: return '🔒'; }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
