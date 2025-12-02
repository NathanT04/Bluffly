import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NavBar } from '../navbar/navbar';
import { HomeTab } from '../tabs/home-tab/home-tab';
import { SimulationTab } from '../tabs/simulation-tab/simulation-tab';
import { AnalyzerTab } from '../tabs/analyzer-tab/analyzer-tab';
import { LessonsTab } from '../tabs/lessons-tab/lessons-tab';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, NavBar, HomeTab, SimulationTab, AnalyzerTab, LessonsTab],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class Homepage implements OnInit {
  active = 'Home';
  currentYear = new Date().getFullYear();
  user: any = null;
  isAuthenticated = false;
  loginError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Check for login success/error in URL params
    this.route.queryParams.subscribe(params => {
      if (params['login'] === 'success') {
        this.checkAuthStatus();
        // Clean URL after successful login
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (params['error']) {
        this.handleLoginError(params['error']);
        // Clean URL after error
        window.history.replaceState({}, '', window.location.pathname);
      }
    });

    // Check initial auth status
    this.checkAuthStatus();
  }

  setActive(tab: string) {
    if (!this.isAuthenticated && tab !== 'Home') {
      return;
    }
    this.active = tab;
  }

  checkAuthStatus() {
    this.http.get('/auth/status').subscribe({
      next: (response: any) => {
        this.isAuthenticated = response.authenticated;
        this.user = response.user;
        if (response.authenticated) {
          this.loginError = null;
        }
      },
      error: (error) => {
        console.error('Auth status check failed:', error);
        this.isAuthenticated = false;
        this.user = null;
      }
    });
  }

  signInWithGoogle() {
    this.loginError = null;
    window.location.href = '/auth/google';
  }

  logout() {
    this.http.post('/auth/logout', {}).subscribe({
      next: () => {
        this.isAuthenticated = false;
        this.user = null;
        this.loginError = null;
        this.setActive('Home');
        console.log('Successfully logged out');
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }

  private handleLoginError(error: string) {
    switch(error) {
      case 'google_auth_failed':
        this.loginError = 'Google authentication failed. Please try again.';
        break;
      case 'no_code':
        this.loginError = 'Authentication was cancelled.';
        break;
      default:
        this.loginError = 'An error occurred during sign in.';
    }
    
    setTimeout(() => {
      this.loginError = null;
    }, 5000);
  }
}
