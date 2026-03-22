import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Variable } from '../../models/workflow.model';

@Component({
  selector: 'app-variables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Variables</h1>
        <p class="page-subtitle">Manage global and workflow-scoped variables for use in expressions</p>
      </div>
      <button class="btn btn-primary" (click)="showForm.set(true)">+ New Variable</button>
    </div>

    @if (showForm()) {
      <div class="form-card card mb-24">
        <h3 class="mb-16">{{ editing() ? 'Edit Variable' : 'New Variable' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Key *</label>
            <input class="input" [(ngModel)]="form.key" placeholder="myVariable" />
            <span class="form-hint">Use in workflows as $vars.{{ form.key || 'key' }}</span>
          </div>
          <div class="form-group">
            <label>Value</label>
            <input class="input" [(ngModel)]="form.value"
                   [type]="form.type === 'secret' ? 'password' : 'text'" placeholder="value" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select class="input" [(ngModel)]="form.type">
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="secret">Secret</option>
            </select>
          </div>
          <div class="form-group">
            <label>Scope</label>
            <select class="input" [(ngModel)]="form.scope">
              <option value="global">Global</option>
              <option value="workflow">Workflow-scoped</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Description</label>
            <input class="input" [(ngModel)]="form.description" placeholder="What is this variable for?" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" (click)="cancelForm()">Cancel</button>
          <button class="btn btn-primary" (click)="saveVariable()" [disabled]="!form.key">
            {{ editing() ? 'Update' : 'Create' }} Variable
          </button>
        </div>
      </div>
    }

    <div class="card">
      <div class="table-header">
        <input class="input search-input" [(ngModel)]="search" placeholder="Search variables..." />
        <div class="filter-tabs">
          <button class="tab-btn" [class.active]="scopeFilter() === 'all'" (click)="scopeFilter.set('all')">All</button>
          <button class="tab-btn" [class.active]="scopeFilter() === 'global'" (click)="scopeFilter.set('global')">Global</button>
          <button class="tab-btn" [class.active]="scopeFilter() === 'workflow'" (click)="scopeFilter.set('workflow')">Workflow</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading variables...</div>
      } @else {
        @if (filteredVars().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">{{ leftBrace }} {{ rightBrace }}</div>
          <h3>No variables yet</h3>
          <p>Create variables to use in your workflow expressions</p>
        </div>
        } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Type</th>
              <th>Scope</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (v of filteredVars(); track v.id) {
              <tr>
                <td><code class="var-key">{{ v.key }}</code></td>
                <td class="var-value">{{ v.type === 'secret' ? '••••••••' : (v.value || '—') }}</td>
                <td><span class="badge" [class]="'badge-' + v.type">{{ v.type }}</span></td>
                <td><span class="badge badge-scope">{{ v.scope }}</span></td>
                <td class="text-muted">{{ v.description || '—' }}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon-sm" (click)="editVariable(v)" title="Edit">✏</button>
                    <button class="btn-icon-sm danger" (click)="deleteVariable(v.id)" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        }
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .page-subtitle { color: var(--text-tertiary); font-size: 14px; }
    .mb-16 { margin-bottom: 16px; }
    .mb-24 { margin-bottom: 24px; }
    .form-card { padding: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-hint { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 4px; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .table-header { display: flex; gap: 12px; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-primary); }
    .search-input { max-width: 280px; }
    .filter-tabs { display: flex; gap: 4px; }
    .tab-btn {
      padding: 6px 14px; border: 1px solid var(--border-primary); border-radius: var(--radius-sm);
      background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 12px;
      transition: all 0.15s;
      &.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
      &:hover:not(.active) { background: var(--bg-hover); }
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); border-bottom: 1px solid var(--border-primary); }
    .data-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-primary); font-size: 14px; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--bg-hover); }
    .var-key { font-family: monospace; font-size: 13px; background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; }
    .var-value { color: var(--text-secondary); font-family: monospace; font-size: 13px; }
    .text-muted { color: var(--text-tertiary); font-size: 13px; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600;
      &-string { background: rgba(99,102,241,.15); color: #6366f1; }
      &-number { background: rgba(59,130,246,.15); color: #3b82f6; }
      &-boolean { background: rgba(34,197,94,.15); color: #22c55e; }
      &-secret { background: rgba(239,68,68,.15); color: #ef4444; }
      &-scope { background: var(--bg-tertiary); color: var(--text-secondary); }
    }
    .row-actions { display: flex; gap: 4px; }
    .btn-icon-sm {
      width: 28px; height: 28px; border: none; border-radius: var(--radius-sm);
      background: transparent; cursor: pointer; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-tertiary); transition: all 0.15s;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.danger:hover { background: rgba(239,68,68,.1); color: #ef4444; }
    }
    .empty-state { text-align: center; padding: 64px 24px; color: var(--text-tertiary); }
    .empty-icon { font-size: 48px; margin-bottom: 12px; font-weight: 900; font-family: monospace; opacity: .3; }
    .empty-state h3 { font-size: 18px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
    .empty-state p { font-size: 14px; }
    code { font-family: monospace; background: var(--bg-tertiary); padding: 1px 5px; border-radius: 3px; }
    .loading-state { padding: 48px; text-align: center; color: var(--text-tertiary); }
  `]
})
export class VariablesComponent implements OnInit {
  api = inject(ApiService);

  leftBrace = '{';
  rightBrace = '}';
  variables = signal<Variable[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<string | null>(null);
  scopeFilter = signal<'all' | 'global' | 'workflow'>('all');
  search = '';

  form = {
    key: '',
    value: '',
    type: 'string' as any,
    scope: 'global' as any,
    description: ''
  };

  ngOnInit() {
    this.loadVariables();
  }

  loadVariables() {
    this.loading.set(true);
    this.api.getVariables().subscribe({
      next: vars => { this.variables.set(vars); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get filteredVars() {
    return () => {
      let vars = this.variables();
      if (this.scopeFilter() !== 'all') vars = vars.filter(v => v.scope === this.scopeFilter());
      if (this.search) {
        const term = this.search.toLowerCase();
        vars = vars.filter(v => v.key.toLowerCase().includes(term) || v.description?.toLowerCase().includes(term));
      }
      return vars;
    };
  }

  saveVariable() {
    const editId = this.editing();
    if (editId) {
      this.api.updateVariable(editId, this.form).subscribe(() => {
        this.cancelForm();
        this.loadVariables();
      });
    } else {
      this.api.createVariable(this.form).subscribe(() => {
        this.cancelForm();
        this.loadVariables();
      });
    }
  }

  editVariable(v: Variable) {
    this.form = { key: v.key, value: v.value || '', type: v.type, scope: v.scope, description: v.description || '' };
    this.editing.set(v.id);
    this.showForm.set(true);
  }

  deleteVariable(id: string) {
    if (confirm('Delete this variable?')) {
      this.api.deleteVariable(id).subscribe(() => this.loadVariables());
    }
  }

  cancelForm() {
    this.showForm.set(false);
    this.editing.set(null);
    this.form = { key: '', value: '', type: 'string', scope: 'global', description: '' };
  }
}
