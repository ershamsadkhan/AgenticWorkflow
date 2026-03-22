import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="grid-pattern"></div>
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>

      <div class="login-card animate-fade-in">
        <div class="login-header">
          <svg viewBox="0 0 32 32" width="48" height="48">
            <defs>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#a855f7"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#lg)"/>
            <path d="M10 11h4l4 5-4 5h-4l4-5z" fill="white"/>
            <path d="M16 11h4l4 5-4 5h-4l4-5z" fill="white" opacity=".6"/>
          </svg>
          <h1>FlowForge</h1>
          <p class="subtitle">Workflow Automation Platform</p>
        </div>

        <div class="login-tabs">
          <button [class.active]="!isRegister()" (click)="isRegister.set(false)">Sign In</button>
          <button [class.active]="isRegister()" (click)="isRegister.set(true)">Sign Up</button>
        </div>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          @if (isRegister()) {
            <div class="input-row">
              <div class="form-group">
                <label>First Name</label>
                <input class="input" [(ngModel)]="firstName" name="firstName" placeholder="John" required />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input class="input" [(ngModel)]="lastName" name="lastName" placeholder="Doe" required />
              </div>
            </div>
          }

          <div class="form-group">
            <label>Email</label>
            <input class="input" type="email" [(ngModel)]="email" name="email"
                   placeholder="you&#64;example.com" required />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input class="input" type="password" [(ngModel)]="password" name="password"
                   placeholder="Enter password" required />
          </div>

          <button type="submit" class="btn btn-primary btn-lg submit-btn" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
            }
            {{ isRegister() ? 'Create Account' : 'Sign In' }}
          </button>
        </form>

        <p class="login-footer-text">
          Demo: admin&#64;flowforge.dev / admin123
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      position: relative;
      overflow: hidden;
    }

    .login-bg {
      position: absolute;
      inset: 0;
      .grid-pattern {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
        background-size: 60px 60px;
      }
    }

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }
    .glow-1 { top: 20%; left: 30%; width: 400px; height: 400px; background: #6366f1; }
    .glow-2 { bottom: 20%; right: 30%; width: 300px; height: 300px; background: #a855f7; }

    .login-card {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
      h1 {
        font-size: 28px;
        font-weight: 800;
        margin-top: 16px;
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subtitle {
        color: var(--text-tertiary);
        font-size: 14px;
        margin-top: 4px;
      }
    }

    .login-tabs {
      display: flex;
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      padding: 4px;
      margin-bottom: 24px;

      button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-secondary);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);

        &.active {
          background: var(--accent-primary);
          color: white;
          box-shadow: var(--shadow-sm);
        }
      }
    }

    .error-message {
      background: var(--danger-light);
      color: var(--danger);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 18px;
      label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
      margin-top: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .login-footer-text {
      text-align: center;
      font-size: 12px;
      color: var(--text-tertiary);
      margin-top: 20px;
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isRegister = signal(false);
  loading = signal(false);
  error = signal('');

  email = 'admin@flowforge.dev';
  password = 'admin123';
  firstName = '';
  lastName = '';

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    const req = this.isRegister()
      ? this.auth.register(this.email, this.password, this.firstName, this.lastName)
      : this.auth.login(this.email, this.password);

    req.subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.router.navigate(['/dashboard']);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      }
    });
  }
}
