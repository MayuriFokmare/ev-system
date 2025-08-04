// src/app/auth/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Make sure HttpClient is imported
import { Router } from '@angular/router';  // Make sure Router is imported
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl: string = 'http://localhost:5000/api/login'; // Replace with your backend URL
  private userDataUrl: string = 'http://localhost:5000/api/user';

  private userData: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  // Method to handle login functionality
  login(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post<any>(this.loginUrl, credentials);
  }

    // Method to redirect to appropriate dashboard based on the role
  redirectToDashboard(role: string, redirectUrl: string): void {
    if (role === 'EnergyProvider') {
      this.router.navigate([redirectUrl]);  // This will navigate to "/energy-provider-dashboard"
    } else if (role === 'EVOwner') {
      this.router.navigate([redirectUrl]);  // This will navigate to "/ev-owner-dashboard"
    } else {
      // Handle unknown roles if necessary
      console.error('Unknown role', role);
    }
  }

  // Fetch user data from the backend
  fetchUserData(email: string): Observable<any> {
    const url = `${this.userDataUrl}/${email}`;
    return this.http.get<any>(url);
  }

  // Save user data locally
  setUserData(data: any): void {
    this.userData = data;
  }

  // Get user data
  getUserData(): any {
    return this.userData;
  }
}
