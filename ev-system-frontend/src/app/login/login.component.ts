import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';  //  import path for AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService) {}

  // Method to call the login function from AuthService
  login() {
    if (this.email && this.password) {
      this.authService.login({ email: this.email, password: this.password })
        .subscribe(
          (response: any) => {
            if (response.status === 'success') {
              // Redirect based on the role
              this.authService.redirectToDashboard(response.role, response.redirect_url);
            } else {
              this.errorMessage = 'Invalid credentials';
            }
          },
          (error) => {
            console.error('Login failed', error);
            this.errorMessage = 'An error occurred. Please try again later.';
          }
        );
    } else {
      this.errorMessage = 'Please enter both username and password.';
    }

    this.authService.fetchUserData(this.email).subscribe(
      (response) => {
        const user = response.user;
        this.authService.setUserData(user); // Save user data in service
        console.log('User data saved:', user);
      },
      (error) => {
        console.error('Error during login:', error);
      }
    );
  }

 
}
