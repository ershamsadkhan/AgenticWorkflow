import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Credential } from '../../models/workflow.model';

@Component({
  selector: 'app-credentials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credentials.component.html',
  styleUrl: './credentials.component.css'
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
