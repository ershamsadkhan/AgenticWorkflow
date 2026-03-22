import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WorkflowExecution } from '../../models/workflow.model';

@Component({
  selector: 'app-executions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Executions</h1>
        <p class="page-subtitle">View and monitor all workflow executions</p>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="loadExecutions()">↻ Refresh</button>
    </div>

    <div class="card">
      <div class="table-filters">
        <div class="status-tabs">
          @for (tab of statusTabs; track tab.value) {
            <button class="tab-btn" [class.active]="statusFilter() === tab.value"
                    (click)="statusFilter.set(tab.value)">
              {{ tab.label }}
              @if (tab.value !== 'all') {
                <span class="tab-count">{{ getCount(tab.value) }}</span>
              }
            </button>
          }
        </div>
        <input class="input search-input" [(ngModel)]="search" placeholder="Search by workflow..." />
      </div>

      @if (loading()) {
        <div class="loading">Loading executions...</div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <div style="font-size:48px; opacity:.2; margin-bottom:12px">▷</div>
          <h3>No executions found</h3>
          <p>Run a workflow to see execution history here</p>
        </div>
      } @else {
        <table class="exec-table">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Status</th>
              <th>Mode</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Nodes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (ex of filtered(); track ex.id) {
              <tr class="exec-row" [class.selected]="selectedId() === ex.id">
                <td>
                  <a [routerLink]="['/editor', ex.workflowId]" class="workflow-link">{{ ex.workflowName }}</a>
                </td>
                <td><span class="status-badge" [class]="'status-' + ex.status.toLowerCase()">
                  {{ statusIcon(ex.status) }} {{ ex.status }}
                </span></td>
                <td><span class="mode-badge">{{ ex.mode }}</span></td>
                <td class="text-muted">{{ formatDate(ex.startedAt) }}</td>
                <td class="text-muted mono">{{ formatDuration(ex.durationMs) }}</td>
                <td class="text-muted">{{ ex.nodeExecutions?.length ?? '—' }}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon-sm" (click)="toggleDetail(ex)" title="View details">
                      {{ selectedId() === ex.id ? '▲' : '▼' }}
                    </button>
                    <button class="btn-icon-sm danger" (click)="deleteExecution(ex.id)" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
              @if (selectedId() === ex.id && ex.nodeExecutions) {
                <tr class="detail-row">
                  <td colspan="7">
                    <div class="node-executions">
                      <div class="ne-header">Node Execution Details</div>
                      <div class="ne-list">
                        @for (ne of ex.nodeExecutions; track ne.id) {
                          <div class="ne-item" [class]="'ne-' + ne.status.toLowerCase()">
                            <div class="ne-status">{{ statusIcon(ne.status) }}</div>
                            <div class="ne-info">
                              <div class="ne-name">{{ ne.nodeName }}</div>
                              <div class="ne-time">{{ formatDuration(ne.durationMs) }}</div>
                            </div>
                            @if (ne.errorMessage) {
                              <div class="ne-error">{{ ne.errorMessage }}</div>
                            }
                          </div>
                        }
                      </div>
                      @if (ex.errorMessage) {
                        <div class="exec-error">
                          <strong>Error:</strong> {{ ex.errorMessage }}
                        </div>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        <div class="pagination">
          <button class="btn btn-ghost btn-sm" [disabled]="page() === 1" (click)="prevPage()">← Prev</button>
          <span class="page-info">Page {{ page() }}</span>
          <button class="btn btn-ghost btn-sm" (click)="nextPage()">Next →</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .page-subtitle { color: var(--text-tertiary); font-size: 14px; }
    .table-filters { display: flex; gap: 12px; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-primary); flex-wrap: wrap; }
    .status-tabs { display: flex; gap: 4px; flex: 1; }
    .tab-btn {
      padding: 6px 14px; border: 1px solid var(--border-primary); border-radius: var(--radius-sm);
      background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 12px;
      display: flex; align-items: center; gap: 6px; transition: all 0.15s;
      &.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
    }
    .tab-count { background: rgba(255,255,255,.25); border-radius: 10px; padding: 0 6px; font-size: 10px; }
    .search-input { width: 220px; }
    .exec-table { width: 100%; border-collapse: collapse; }
    .exec-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-tertiary); border-bottom: 1px solid var(--border-primary); }
    .exec-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-primary); font-size: 13px; vertical-align: middle; }
    .exec-row:hover td { background: var(--bg-hover); }
    .exec-row.selected td { background: var(--accent-primary-light); }
    .workflow-link { color: var(--accent-primary); text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }
    .status-badge {
      display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
      &.status-success { background: rgba(34,197,94,.15); color: #22c55e; }
      &.status-failed { background: rgba(239,68,68,.15); color: #ef4444; }
      &.status-running { background: rgba(59,130,246,.15); color: #3b82f6; }
      &.status-pending { background: rgba(100,116,139,.15); color: #64748b; }
      &.status-cancelled { background: rgba(245,158,11,.15); color: #f59e0b; }
    }
    .mode-badge { background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; font-size: 11px; color: var(--text-secondary); }
    .text-muted { color: var(--text-tertiary); }
    .mono { font-family: monospace; }
    .row-actions { display: flex; gap: 4px; }
    .btn-icon-sm {
      width: 28px; height: 28px; border: none; border-radius: var(--radius-sm);
      background: transparent; cursor: pointer; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-tertiary); transition: all 0.15s;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.danger:hover { background: rgba(239,68,68,.1); color: #ef4444; }
    }
    .detail-row td { padding: 0; background: var(--bg-tertiary); }
    .node-executions { padding: 16px; }
    .ne-header { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
    .ne-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .ne-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: var(--radius-md);
      border: 1px solid var(--border-primary); background: var(--bg-card);
      font-size: 12px; min-width: 140px;
      &.ne-success { border-color: rgba(34,197,94,.3); }
      &.ne-failed { border-color: rgba(239,68,68,.3); }
      &.ne-running { border-color: rgba(59,130,246,.3); }
    }
    .ne-status { font-size: 14px; }
    .ne-name { font-weight: 600; color: var(--text-primary); }
    .ne-time { color: var(--text-tertiary); font-family: monospace; font-size: 11px; }
    .ne-error { color: #ef4444; font-size: 11px; }
    .exec-error { margin-top: 10px; padding: 10px 14px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: var(--radius-md); color: #ef4444; font-size: 13px; }
    .empty-state { text-align: center; padding: 64px 24px; color: var(--text-tertiary); h3 { font-size: 18px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; } p { font-size: 14px; } }
    .loading { padding: 48px; text-align: center; color: var(--text-tertiary); }
    .pagination { display: flex; align-items: center; gap: 12px; padding: 16px; justify-content: center; border-top: 1px solid var(--border-primary); }
    .page-info { color: var(--text-secondary); font-size: 13px; }
  `]
})
export class ExecutionsComponent implements OnInit {
  api = inject(ApiService);
  executions = signal<WorkflowExecution[]>([]);
  loading = signal(true);
  page = signal(1);
  statusFilter = signal<string>('all');
  selectedId = signal<string | null>(null);
  search = '';

  statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'Success', label: 'Success' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Running', label: 'Running' },
  ];

  ngOnInit() { this.loadExecutions(); }

  loadExecutions() {
    this.loading.set(true);
    this.api.getAllExecutions(this.page()).subscribe({
      next: exs => { this.executions.set(exs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get filtered() {
    return () => {
      let exs = this.executions();
      if (this.statusFilter() !== 'all') exs = exs.filter(e => e.status === this.statusFilter());
      if (this.search) {
        const t = this.search.toLowerCase();
        exs = exs.filter(e => e.workflowName.toLowerCase().includes(t));
      }
      return exs;
    };
  }

  getCount(status: string) {
    return this.executions().filter(e => e.status === status).length;
  }

  toggleDetail(ex: WorkflowExecution) {
    if (this.selectedId() === ex.id) {
      this.selectedId.set(null);
    } else {
      if (!ex.nodeExecutions) {
        this.api.getExecution(ex.id).subscribe(full => {
          this.executions.update(exs => exs.map(e => e.id === full.id ? full : e));
          this.selectedId.set(ex.id);
        });
      } else {
        this.selectedId.set(ex.id);
      }
    }
  }

  deleteExecution(id: string) {
    if (confirm('Delete this execution record?')) {
      this.api.deleteExecution(id).subscribe(() => {
        this.executions.update(exs => exs.filter(e => e.id !== id));
        if (this.selectedId() === id) this.selectedId.set(null);
      });
    }
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.loadExecutions(); } }
  nextPage() { this.page.update(p => p + 1); this.loadExecutions(); }

  statusIcon(s: string) {
    return s === 'Success' ? '✓' : s === 'Failed' ? '✕' : s === 'Running' ? '⟳' : '◷';
  }

  formatDate(d: string) {
    return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(ms?: number) {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}
