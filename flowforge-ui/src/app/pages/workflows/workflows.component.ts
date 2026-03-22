import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { WorkflowList } from '../../models/workflow.model';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="workflows-page">
      <div class="page-header animate-fade-in">
        <div>
          <h2 class="page-title">Workflows</h2>
          <p class="page-subtitle">Manage your automation workflows</p>
        </div>
        <a routerLink="/editor" class="btn btn-primary">
          <span>+</span> New Workflow
        </a>
      </div>

      <!-- Filters -->
      <div class="filters animate-fade-in">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input class="input search-input" placeholder="Search workflows..." [(ngModel)]="searchTerm" (ngModelChange)="filterWorkflows()" />
        </div>
        <div class="filter-pills">
          @for (filter of statusFilters; track filter) {
            <button class="pill" [class.active]="activeFilter() === filter" (click)="setFilter(filter)">
              {{ filter }}
            </button>
          }
        </div>
        <div class="view-toggle">
          <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">◫</button>
          <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">☰</button>
        </div>
      </div>

      @if (viewMode() === 'grid') {
        <div class="workflow-grid animate-fade-in">
          @for (w of filteredWorkflows(); track w.id) {
            <div class="workflow-card" [routerLink]="'/editor/' + w.id">
              <div class="card-top">
                <div class="workflow-icon" [style.background]="getStatusGradient(w.status)">⬡</div>
                <div class="card-actions">
                  <button class="btn btn-sm btn-ghost" (click)="runWorkflow(w, $event)">▶ Run</button>
                  <button class="btn-icon" (click)="deleteWorkflow(w, $event)">🗑</button>
                </div>
              </div>
              <h3 class="card-title">{{ w.name }}</h3>
              <p class="card-desc">{{ w.description || 'No description' }}</p>
              <div class="card-meta">
                <span class="badge" [class]="'badge-' + getStatusClass(w.status)">{{ w.status }}</span>
                <span class="meta-item">{{ w.nodeCount }} nodes</span>
                <span class="meta-item">{{ w.executionCount }} runs</span>
              </div>
              <div class="card-footer">
                <span class="badge badge-accent">{{ w.triggerType }}</span>
                <span class="meta-time">{{ timeAgo(w.updatedAt) }}</span>
              </div>
            </div>
          }

          <!-- New workflow card -->
          <a routerLink="/editor" class="workflow-card new-card">
            <div class="new-card-content">
              <div class="new-icon">+</div>
              <span>Create New Workflow</span>
            </div>
          </a>
        </div>
      } @else {
        <div class="card animate-fade-in" style="padding: 0; overflow: hidden;">
          <table>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Nodes</th>
                <th>Runs</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (w of filteredWorkflows(); track w.id) {
                <tr class="clickable" [routerLink]="'/editor/' + w.id">
                  <td>
                    <div class="wf-name-cell">
                      <div class="wf-icon-sm" [style.background]="getStatusGradient(w.status)">⬡</div>
                      <div>
                        <strong>{{ w.name }}</strong>
                        <span class="wf-desc">{{ w.description || '' }}</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge" [class]="'badge-' + getStatusClass(w.status)">{{ w.status }}</span></td>
                  <td><span class="badge badge-accent">{{ w.triggerType }}</span></td>
                  <td>{{ w.nodeCount }}</td>
                  <td>{{ w.executionCount }}</td>
                  <td class="text-muted">{{ timeAgo(w.updatedAt) }}</td>
                  <td>
                    <div class="row-actions" (click)="$event.stopPropagation()">
                      <button class="btn btn-sm btn-ghost" (click)="runWorkflow(w, $event)">▶</button>
                      <button class="btn btn-sm btn-ghost" (click)="deleteWorkflow(w, $event)">🗑</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (!filteredWorkflows().length && workflows().length) {
        <div class="empty-state animate-fade-in">
          <div class="icon">⌕</div>
          <div class="title">No matching workflows</div>
          <div class="text">Try a different search term or filter.</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;
    }
    .page-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .page-subtitle { color: var(--text-tertiary); font-size: 14px; margin-top: 2px; }

    .filters {
      display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
    }

    .search-box { position: relative; flex: 1; min-width: 200px; }
    .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); font-size: 16px; }
    .search-input { padding-left: 38px !important; }

    .filter-pills { display: flex; gap: 6px; }
    .pill {
      padding: 6px 16px; border: 1px solid var(--border-primary); border-radius: 20px;
      background: transparent; color: var(--text-secondary); font-family: inherit;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast);
      &:hover { border-color: var(--border-secondary); background: var(--bg-hover); }
      &.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
    }

    .view-toggle {
      display: flex; gap: 2px; background: var(--bg-tertiary); padding: 2px; border-radius: var(--radius-md);
      .btn-icon { width: 32px; height: 32px; font-size: 14px; border-radius: var(--radius-sm); }
      .btn-icon.active { background: var(--accent-primary); color: white; }
    }

    .workflow-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
    }

    .workflow-card {
      background: var(--bg-card); border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg); padding: 20px;
      cursor: pointer; transition: all var(--transition-base); text-decoration: none; color: inherit;
      &:hover { border-color: var(--border-accent); box-shadow: var(--shadow-glow); transform: translateY(-2px); }
    }

    .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .workflow-icon {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: white;
    }
    .card-actions { display: flex; gap: 4px; }
    .card-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .card-desc { font-size: 13px; color: var(--text-tertiary); margin-bottom: 14px; line-height: 1.4; }
    .card-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .meta-item { font-size: 12px; color: var(--text-tertiary); }
    .card-footer { display: flex; align-items: center; justify-content: space-between; }
    .meta-time { font-size: 11px; color: var(--text-tertiary); }

    .new-card {
      border-style: dashed; border-color: var(--border-secondary); display: flex;
      &:hover { border-color: var(--accent-primary); .new-icon { background: var(--accent-gradient); color: white; } }
    }
    .new-card-content {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 100%; gap: 12px; color: var(--text-tertiary); font-weight: 600; font-size: 14px;
    }
    .new-icon {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;
      font-size: 24px; transition: all var(--transition-base);
    }

    .wf-name-cell { display: flex; align-items: center; gap: 12px; }
    .wf-icon-sm { width: 32px; height: 32px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; flex-shrink: 0; }
    .wf-desc { display: block; font-size: 12px; color: var(--text-tertiary); }
    .text-muted { color: var(--text-tertiary); font-size: 12px; }
    .clickable { cursor: pointer; }
    .row-actions { display: flex; gap: 4px; }
  `]
})
export class WorkflowsComponent implements OnInit {
  private api = inject(ApiService);

  workflows = signal<WorkflowList[]>([]);
  filteredWorkflows = signal<WorkflowList[]>([]);
  activeFilter = signal('All');
  viewMode = signal<'grid' | 'list'>('grid');
  searchTerm = '';

  statusFilters = ['All', 'Active', 'Draft', 'Inactive'];

  ngOnInit() {
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.api.getWorkflows().subscribe(w => {
      this.workflows.set(w);
      this.filterWorkflows();
    });
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
    this.filterWorkflows();
  }

  filterWorkflows() {
    let result = this.workflows();
    if (this.activeFilter() !== 'All') {
      result = result.filter(w => w.status === this.activeFilter());
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(w => w.name.toLowerCase().includes(term) || w.description?.toLowerCase().includes(term));
    }
    this.filteredWorkflows.set(result);
  }

  runWorkflow(w: WorkflowList, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.api.runWorkflow(w.id).subscribe();
  }

  deleteWorkflow(w: WorkflowList, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (confirm(`Delete workflow "${w.name}"?`)) {
      this.api.deleteWorkflow(w.id).subscribe(() => this.loadWorkflows());
    }
  }

  getStatusClass(status: string): string {
    switch (status) { case 'Active': return 'success'; case 'Draft': return 'info'; case 'Inactive': return 'warning'; case 'Error': return 'danger'; default: return 'info'; }
  }

  getStatusGradient(status: string): string {
    switch (status) { case 'Active': return 'linear-gradient(135deg, #22c55e, #16a34a)'; case 'Draft': return 'linear-gradient(135deg, #6366f1, #8b5cf6)'; case 'Error': return 'linear-gradient(135deg, #ef4444, #dc2626)'; default: return 'linear-gradient(135deg, #64748b, #475569)'; }
  }

  timeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago';
  }
}
