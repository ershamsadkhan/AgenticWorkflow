import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'workflows', loadComponent: () => import('./pages/workflows/workflows.component').then(m => m.WorkflowsComponent) },
      { path: 'editor', loadComponent: () => import('./pages/workflow-editor/workflow-editor.component').then(m => m.WorkflowEditorComponent) },
      { path: 'editor/:id', loadComponent: () => import('./pages/workflow-editor/workflow-editor.component').then(m => m.WorkflowEditorComponent) },
      { path: 'executions', loadComponent: () => import('./pages/executions/executions.component').then(m => m.ExecutionsComponent) },
      { path: 'credentials', loadComponent: () => import('./pages/credentials/credentials.component').then(m => m.CredentialsComponent) },
      { path: 'variables', loadComponent: () => import('./pages/variables/variables.component').then(m => m.VariablesComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
