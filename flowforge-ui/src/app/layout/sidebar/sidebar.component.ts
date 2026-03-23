import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  collapsed = input(false);
  toggleCollapse = output<void>();

  mainNav = [
    { path: '/dashboard', label: 'Dashboard', icon: '◉' },
    { path: '/workflows', label: 'Workflows', icon: '⬡' },
    { path: '/executions', label: 'Executions', icon: '▷' },
  ];

  manageNav = [
    { path: '/credentials', label: 'Credentials', icon: '🔑' },
    { path: '/variables', label: 'Variables', icon: '{ }' },
    { path: '/settings', label: 'Settings', icon: '⚙' },
  ];
}
