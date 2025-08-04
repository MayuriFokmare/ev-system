import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, CategoryScale, LinearScale, Title, Tooltip, Legend, BarController, BarElement, registerables } from 'chart.js';
import { AuthService } from '../auth/auth.service';
import { ChargingSlotService } from '../charging-slot.service';
import { ActivatedRoute } from '@angular/router';  // Import ActivatedRoute

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
  selector: 'app-ev-owner-dashboard',
  templateUrl: './ev-owner-dashboard.component.html',
  styleUrls: ['./ev-owner-dashboard.component.css']
})
export class EvOwnerDashboardComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute, private authService: AuthService, private chargingSlotService: ChargingSlotService) {
    Chart.register(...registerables);
  }

  userData: any;
  booking: any;
  historyData: any;
  energyData: any;
  private chart: any;
  userId: any;
  userIdParam: any;

  ngOnInit(): void {
    // Get user data from the authentication service
    this.userData = this.authService.getUserData();
    
    if (this.userData) {
      this.userId = this.userData.user_id; // Get user data from authService
    } else {
      console.error('User data is not available');
    }

    // Get user_id from route parameter
    this.userIdParam = this.route.snapshot.paramMap.get('user_id');
    console.log('User ID from route param:', this.userIdParam);

    // If userIdParam is available, override the userId from authService
    if (this.userIdParam) {
      this.userId = this.userIdParam;
    }
    console.log('Final User ID to be used:', this.userId);

    if (this.userId) {
      // Now fetch the data based on the correct userId
      this.getChargingSlots();
      this.getHistory();
      this.chargingSlotService.getEnergyVisualize(this.userId).subscribe((response) => {
        const data = response.data as { charging_time: string; energy_consumed: string }[]; // Explicit typing
    
        // Process the data
        const energyData = data.reduce<Record<string, number>>((acc, item) => {
          const time = item.charging_time;
          const energy = parseFloat(item.energy_consumed);
          acc[time] = (acc[time] || 0) + energy;
          return acc;
        }, {});
    
        // Chart data
        const labels = Object.keys(energyData);
        const values = Object.values(energyData);
    
        // Render the chart
        this.renderChart(labels, values);
      });
    } else {
      console.error('No valid user ID found to fetch data');
    }
  }

  private renderChart(labels: string[], values: number[]): void {
    const canvas = document.getElementById('energyChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element with ID "energyChart" not found.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context for the canvas.');
      return;
    }

    if (this.chart) {
      this.chart.destroy(); // Destroy the previous chart instance
    }

    // Define colors
    const defaultColors = ['#81c784', '#66bb6a', '#4caf50', '#388e3c', '#2c6e2f'];
    const nighttimeColor = '#1e88e5'; // Blue for nighttime
    const hoverNighttimeColor = '#1565c0'; // Darker blue for hover

    // Map labels to colors
    const backgroundColors = labels.map(label =>
      label.toLowerCase().includes('night') ? nighttimeColor : defaultColors.shift() || '#888'
    );

    const hoverColors = labels.map(label =>
      label.toLowerCase().includes('night') ? hoverNighttimeColor : '#000'
    );

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: backgroundColors,
            hoverBackgroundColor: hoverColors
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `Energy: ${value} kWh`;
              }
            }
          }
        }
      }
    });
  }

  getChargingSlots(): void {
    this.chargingSlotService.getBooking(this.userId).subscribe(
      data => {
        this.booking = data.data;
      },
      error => {
        console.error('Error fetching booking:', error);
      }
    );
  }

  getHistory(): void {
    this.chargingSlotService.getHistory(this.userId).subscribe(
      data => {
        this.historyData = data.data;
        console.log('historyData:', this.historyData);
      },
      error => {
        console.error('Error fetching historyData:', error);
      }
    );
  }

  navigateToSlots() {
    this.router.navigate(['/book-slot']);
  }

  logoutAndRedirect(): void {
    this.router.navigate(['/login']);
  }
}
