import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
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
