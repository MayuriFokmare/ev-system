import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, CategoryScale, LinearScale, Title, Tooltip, Legend, BarController, BarElement } from 'chart.js';
import { AuthService } from '../auth/auth.service';
import { ChargingSlotService } from '../charging-slot.service';

// Register the necessary components for bar chart

Chart.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarController,   // Register BarController for bar charts
  BarElement        // Register BarElement for rendering bars in the chart
);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit,OnInit  {
  constructor(private router: Router,private authService: AuthService, private apiService: ChargingSlotService) {}

  userEmail: string | null = null;
  userData: any;
  summaryData: any;
  recentReservationData:any;
  responseData:any;

  ngOnInit(): void {
    this.userData = this.authService.getUserData(); // Get user data
    this.getApiData();
    }
  
    getApiData(): void {
      // Fetch data from the first API
      this.apiService.getSummary(this.userData.user_id).subscribe({
        next: (response) => (this.summaryData = response.stations),
        error: (err) => console.error('Error fetching data from API 1', err),
      });

      // Fetch data from the second API
      this.apiService.getRecentReservation(this.userData.user_id).subscribe({
        next: (response) => (this.recentReservationData = response.reservations),
        error: (err) => console.error('Error fetching data from API 2', err),
      });

      // //fetching visualization data
      // this.apiService.getVisualization(this.userData.user_id).subscribe({
      //   next: (response) => (this.responseData = response.data),
      //   error: (err) => console.error('Error fetching data from API 3', err),
      // });
    }

    getChargingSlots(): void {
      this.apiService.getVisualization(this.userData.user_id).subscribe(
        data => {
          this.responseData = data.data;
          console.log('responseData1:', this.responseData);
    
          // Call createChart after data is fetched
          this.createChart(this.responseData);
        },
        error => {
          console.error('Error fetching slots:', error);
        }
      );
    }
    
    ngAfterViewInit(): void {
      // Call getChargingSlots to fetch data and handle chart creation
      this.getChargingSlots();
    }
    
    // fetchDashboardData(): void {
    //   forkJoin({
    //     summary: this.apiService.getSummary(this.userData.user_id),
    //     //recentReservation: this.apiService.getRecentReservation(this.userData.user_id)
    //   }).subscribe({
    //     next: (results) => {
    //       this.summaryData = results.summary.stations;
    //     //  this.recentReservationData = results.recentReservation;
    //       console.log('Summary:', this.summaryData);
    //       console.log('Recent Reservation:', this.recentReservationData);
    //     },
    //     error: (error) => {
    //       console.error('Error fetching data:', error);
    //     }
    //   });
    // }

  navigateToStations(): void {
    this.router.navigate(['/manage-stations-slots']);
  }

  bookSlot() {
    this.router.navigate(['/slot-reservation']);
  }

  

  // createChart(): void {
  //   // Hardcoded values for revenue and energy consumption
  //   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  //   const revenue = [5000, 4000, 4500, 6000, 7000, 7500, 8000, 8500, 7000, 9500, 10000, 11000]; // Example revenue values
  //   const energyConsumption = [1500, 2000, 3000, 2000, 450, 480, 3000, 1000, 560, 2000, 650, 700]; // Example energy consumption values

  //   // Create the chart
  //   new Chart('myChart', {
  //     type: 'bar', // Type of chart: bar chart
  //     data: {
  //       labels: months, // X-axis labels
  //       datasets: [
  //         {
  //           label: 'Revenue',
  //           data: revenue, // Y-axis data for revenue
  //           backgroundColor: 'rgba(0, 0, 255, 0.7)', // Bar color for revenue
  //           borderColor: 'blue', // Border color for bars
  //           borderWidth: 1, // Border width for bars
  //           hoverBackgroundColor: 'rgba(0, 0, 255, 1)', // Hover effect for revenue bars
  //           hoverBorderColor: 'blue' // Hover border color for bars
  //         },
  //         {
  //           label: 'Energy Consumption',
  //           data: energyConsumption, // Y-axis data for energy consumption
  //           backgroundColor: 'rgba(255, 165, 0, 0.7)', // Bar color for energy consumption
  //           borderColor: 'orange', // Border color for bars
  //           borderWidth: 1, // Border width for bars
  //           hoverBackgroundColor: 'rgba(255, 165, 0, 1)', // Hover effect for energy consumption bars
  //           hoverBorderColor: 'orange' // Hover border color for bars
  //         }
  //       ]
  //     },
  //     options: {
  //       responsive: true,
  //       scales: {
  //         y: {
  //           beginAtZero: true,
  //           title: {
  //             display: true,
  //             text: 'Values'
  //           }
  //         },
  //         x: {
  //           title: {
  //             display: true,
  //             text: 'Months'
  //           }
  //         }
  //       },
  //       plugins: {
  //         legend: {
  //           position: 'top' // Positioning the legend at the top of the chart
  //         },
  //         tooltip: {
  //           callbacks: {
  //             label: function (tooltipItem) {
  //               return tooltipItem.dataset.label + ': ' + tooltipItem.raw; // Custom tooltip label
  //             }
  //           }
  //         }
  //       }
  //     }
  //   });
  // }

  createChart(responseData: any[]): void {
    if (!responseData || !Array.isArray(responseData)) {
      console.error('Invalid or empty responseData:', responseData);
      return;
    }
  
    const months = responseData.map((item) => item.month_year);
    const revenue = responseData.map((item) => parseFloat(item.total_amount));
    const energyConsumption = responseData.map((item) => parseFloat(item.total_energy_consumed));
  
    new Chart('myChart', {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Revenue',
            data: revenue,
            backgroundColor: 'rgba(0, 0, 255, 0.7)',
            borderColor: 'blue',
            borderWidth: 1,
          },
          {
            label: 'Energy Consumption',
            data: energyConsumption,
            backgroundColor: 'rgba(255, 165, 0, 0.7)',
            borderColor: 'orange',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
          x: { title: { display: true, text: 'Months' } },
        },
        plugins: {
          legend: { position: 'top' },
        },
      },
    });
  }
  

  logoutAndRedirect() : void {
    this.router.navigate(['/login']);
  }
}
