// payment-success.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';  // Import ActivatedRoute to get query params
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {

  userData: any;
  userId?: string;

  constructor(
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute  // Inject ActivatedRoute to access query params
  ) {}

  ngOnInit(): void {
    // Retrieve user_id from query params
    this.route.queryParams.subscribe(params => {
      this.userId = params['user_id'];  // Capture the user_id from the URL query parameter
      console.log("Received user_id:", this.userId);

      // If you have other user-related information to fetch, you can do it here
      if (this.userId) {
        this.fetchUserData();
      }
    });
  }

  fetchUserData(): void {
    // Assuming you are fetching user data based on userId (you can replace this with your logic)
    this.authService.getUserData().user_id = this.userId;  // Or use an API to get data using the userId

    // Optionally, store the user data after fetching
    // this.authService.setUserData(fetchedData);
  }

  redirectToDashboard(): void {
    if (this.userId) {
      this.router.navigate(['/ev-owner-dashboard', this.userId]);
    } else {
      console.error("User ID not available!");
    }
  }

  // Close modal and navigate to the dashboard
  closeModal(): void {
    if (this.userId) {
      this.router.navigate(['/ev-owner-dashboard', this.userId]);
    } else {
      console.error("User ID not available!");
    }
  }

  // redirectToDashboard(): void {
  //   if (this.userId) {
  //     this.router.navigate(['/book-slot']);
  //   } else {
  //     console.error("User ID not available!");
  //   }
  // }

  // // Close modal and navigate to the dashboard
  // closeModal(): void {
  //   if (this.userId) {
  //     this.router.navigate(['/book-slot']);
  //   } else {
  //     console.error("User ID not available!");
  //   }
  // }
}
