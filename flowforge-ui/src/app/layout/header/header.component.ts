import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  theme = inject(ThemeService);
  auth = inject(AuthService);
  router = inject(Router);
  showMenu = false;

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Dashboard';
    if (url.includes('editor')) return 'Workflow Editor';
    if (url.includes('workflows')) return 'Workflows';
    if (url.includes('executions')) return 'Executions';
    if (url.includes('credentials')) return 'Credentials';
    if (url.includes('settings')) return 'Settings';
    return 'FlowForge';
  }

  getInitials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }
}
