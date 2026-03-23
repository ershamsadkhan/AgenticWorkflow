import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Variable } from '../../models/workflow.model';

@Component({
  selector: 'app-variables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './variables.component.html',
  styleUrl: './variables.component.css'
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
