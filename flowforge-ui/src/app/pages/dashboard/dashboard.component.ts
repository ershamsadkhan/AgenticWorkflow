import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats, WorkflowList } from '../../models/workflow.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Stats Row -->
      <div class="stats-grid animate-fade-in">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--accent-primary-light); color: var(--accent-primary)">⬡</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalWorkflows || 0 }}</span>
            <span class="stat-label">Total Workflows</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--success-light); color: var(--success)">▶</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.activeWorkflows || 0 }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--info-light); color: var(--info)">◎</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalExecutions || 0 }}</span>
            <span class="stat-label">Total Runs</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--success-light); color: var(--success)">✓</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.successRate || 0 }}%</span>
            <span class="stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Execution Trend Chart -->
        <div class="card chart-card animate-fade-in">
          <div class="card-header">
            <h3>Execution Trend</h3>
            <span class="badge badge-accent">Last 7 Days</span>
          </div>
          <div class="chart-area">
            @if (stats()?.recentTrend?.length) {
              <div class="bar-chart">
                @for (item of stats()!.recentTrend; track item.date) {
                  <div class="bar-group">
                    <div class="bars">
                      <div class="bar bar-success" [style.height.px]="getBarHeight(item.success)"></div>
                      <div class="bar bar-danger" [style.height.px]="getBarHeight(item.failed)"></div>
                    </div>
                    <span class="bar-label">{{ item.date }}</span>
                  </div>
                }
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot success"></span> Success</span>
                <span class="legend-item"><span class="legend-dot danger"></span> Failed</span>
              </div>
            } @else {
              <div class="empty-chart">
                <span>No execution data yet</span>
              </div>
            }
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card quick-actions animate-fade-in">
          <h3 style="margin-bottom: 20px">Quick Actions</h3>
          <div class="action-grid">
            <a routerLink="/editor" class="action-item">
              <div class="action-icon" style="background: var(--accent-gradient)">+</div>
              <span>New Workflow</span>
            </a>
            <a routerLink="/workflows" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #22c55e, #16a34a)">⬡</div>
              <span>All Workflows</span>
            </a>
            <a routerLink="/executions" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb)">▷</div>
              <span>Executions</span>
            </a>
            <a routerLink="/credentials" class="action-item">
              <div class="action-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706)">🔑</div>
              <span>Credentials</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Recent Workflows -->
      <div class="card animate-fade-in" style="margin-top: 20px">
        <div class="card-header" style="margin-bottom: 20px">
          <h3>Recent Workflows</h3>
          <a routerLink="/workflows" class="btn btn-ghost btn-sm">View All →</a>
        </div>
        @if (workflows().length) {
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Nodes</th>
                <th>Runs</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              @for (w of workflows().slice(0, 5); track w.id) {
                <tr style="cursor: pointer" [routerLink]="'/editor/' + w.id">
                  <td>
                    <div class="workflow-name">
                      <strong>{{ w.name }}</strong>
                      @if (w.description) {
                        <span class="workflow-desc">{{ w.description }}</span>
                      }
                    </div>
                  </td>
                  <td><span class="badge" [class]="'badge-' + getStatusClass(w.status)">{{ w.status }}</span></td>
                  <td><span class="badge badge-accent">{{ w.triggerType }}</span></td>
                  <td>{{ w.nodeCount }}</td>
                  <td>{{ w.executionCount }}</td>
                  <td class="text-muted">{{ timeAgo(w.updatedAt) }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <div class="empty-state">
            <div class="icon">⬡</div>
            <div class="title">No workflows yet</div>
            <div class="text">Create your first automation workflow to get started.</div>
            <a routerLink="/editor" class="btn btn-primary">Create Workflow</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all var(--transition-base);
      &:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-tertiary);
      font-weight: 500;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h3 { font-size: 16px; font-weight: 700; }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    .chart-area { padding: 16px 0; }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 160px;
      gap: 8px;
      padding: 0 8px;
    }

    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
    .bars { display: flex; align-items: flex-end; gap: 4px; height: 140px; }
    .bar {
      width: 18px;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.5s ease;
    }
    .bar-success { background: var(--success); }
    .bar-danger { background: var(--danger); }
    .bar-label { font-size: 10px; color: var(--text-tertiary); }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 16px;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
    .legend-dot { width: 8px; height: 8px; border-radius: 2px; &.success { background: var(--success); } &.danger { background: var(--danger); } }

    .empty-chart { display: flex; align-items: center; justify-content: center; height: 160px; color: var(--text-tertiary); }

    .action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-primary);
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      transition: all var(--transition-fast);

      &:hover { border-color: var(--border-secondary); background: var(--bg-hover); color: var(--text-primary); transform: translateY(-2px); }
    }

    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: 700;
    }

    .workflow-name {
      strong { display: block; font-size: 14px; }
      .workflow-desc { font-size: 12px; color: var(--text-tertiary); }
    }

    .text-muted { color: var(--text-tertiary); font-size: 12px; }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  stats = signal<DashboardStats | null>(null);
  workflows = signal<WorkflowList[]>([]);

  ngOnInit() {
    this.api.getDashboardStats().subscribe(s => this.stats.set(s));
    this.api.getWorkflows().subscribe(w => this.workflows.set(w));
  }

  getBarHeight(value: number): number {
    const max = Math.max(1, ...this.stats()!.recentTrend.map(t => Math.max(t.success, t.failed)));
    return Math.max(4, (value / max) * 120);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'success';
      case 'Draft': return 'info';
      case 'Inactive': return 'warning';
      case 'Error': return 'danger';
      default: return 'info';
    }
  }

  timeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
  }
}
