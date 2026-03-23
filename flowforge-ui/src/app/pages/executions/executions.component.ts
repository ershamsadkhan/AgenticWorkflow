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
  templateUrl: './executions.component.html',
  styleUrl: './executions.component.css'
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
