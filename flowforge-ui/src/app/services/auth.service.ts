import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthResponse } from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private tokenKey = 'flowforge_token';
  private userKey = 'flowforge_user';

  currentUser = signal<AuthResponse | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    const saved = localStorage.getItem(this.userKey);
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password });
  }

  register(email: string, password: string, firstName: string, lastName: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { email, password, firstName, lastName });
  }

  setSession(auth: AuthResponse) {
    localStorage.setItem(this.tokenKey, auth.token);
    localStorage.setItem(this.userKey, JSON.stringify(auth));
    this.currentUser.set(auth);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
