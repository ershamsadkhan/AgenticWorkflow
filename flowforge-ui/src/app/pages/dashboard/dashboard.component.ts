import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats, WorkflowList } from '../../models/workflow.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
