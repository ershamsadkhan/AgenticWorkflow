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
  templateUrl: './workflows.component.html',
  styleUrl: './workflows.component.css'
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
