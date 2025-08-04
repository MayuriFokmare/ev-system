import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChargingSlotService } from '../charging-slot.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-book-slot',
  templateUrl: './book-slot.component.html',
  styleUrls: ['./book-slot.component.css'],
})
export class BookSlotComponent implements AfterViewInit,OnInit {
  postalCode: string = '';
  stations: any[] = [];
  uniqueStations: any[] = [];
  expandedStationId: number | null = null; // To track which station is expanded
  map!: google.maps.Map;
  userData:any;

  @ViewChild('map') mapElement!: ElementRef;

  constructor(
    private chargingSlotService: ChargingSlotService,
    private router: Router,private authService:AuthService
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getUserData(); // Get user data
    }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.mapElement) {
        this.initMap();
      } else {
        console.error('Map container element not found.');
      }
    }, 0);
  }

  fetchStations(): void {
    if (!this.postalCode) {
      if (window.confirm('Postal code is missing. Do you want to proceed without entering one?')) {
        this.fetchStationsWithoutPostalCode(); // Placeholder logic
      }
      return;
    }

    this.chargingSlotService.getStations(this.postalCode).subscribe(
      (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.stations = response.data;
          console.log('stations', this.stations);
          this.uniqueStations = this.getUniqueStations(this.stations);
          // After fetching stations, add markers to the map
          this.addMarkers();
        } else {
          window.confirm('No stations found for the given postal code. Try another postal code.');
        }
      },
      (error) => {
        console.error('Error fetching stations:', error);
        window.confirm('Could not fetch stations. Please try again.');
      }
    );
  }

  getUniqueStations(stations: any[]): any[] {
    const uniqueStations = new Map();
    stations.forEach((station) => {
      if (!uniqueStations.has(station.station_id)) {
        uniqueStations.set(station.station_id, station);
      }
    });
    return Array.from(uniqueStations.values());
  }

  getStationSlots(stationId: number): any[] {
    const filteredSlots = this.stations.filter((slot) => slot.station_id === stationId);

    // Logging the input and output for debugging
    console.log(`getStationSlots called with stationId: ${stationId}`);
    console.log(`Filtered slots:`, filteredSlots);

    return filteredSlots;
}


  toggleStationDetails(stationId: number): void {
    this.expandedStationId =
      this.expandedStationId === stationId ? null : stationId;
  }

  bookSlot(slot: any): void {
    if (window.confirm(`Do you want to book the slot: ${slot.slot_type} at station ${slot.station_name}?`)) {
      this.chargingSlotService.createPaymentSession(slot,this.userData.user_id).subscribe(
        (response: any) => {
          if (response.status === 'success' && response.url) {
            // Redirect the user to the Stripe checkout page
            window.location.href = response.url;
          } else {
            window.confirm('Error initiating payment. Please try again.');
          }
        },
        (error) => {
          console.error('Error creating payment session:', error);
          window.confirm('Could not initiate payment. Please try again.');
        }
      );
    } else {
      // User canceled the booking
      console.log('Booking process canceled by the user.');
    }
  }
  


  initMap(): void {
    const mapElement = this.mapElement?.nativeElement;
    if (!mapElement) {
      console.error('Map container element not found.');
      return;
    }

    const mapOptions: google.maps.MapOptions = {
      center: { lat: 51.5520114, lng: -0.08589690000000001 },
      zoom: 10,
    };

    this.map = new google.maps.Map(mapElement as HTMLElement, mapOptions);
  }

  // Add markers for each station
  addMarkers(): void {
    const bounds = new google.maps.LatLngBounds(); // Create bounds to include all markers
  
    this.uniqueStations.forEach((station) => {
      const lat = parseFloat(station.latitude); // Convert to a number
      const lng = parseFloat(station.longitude); // Convert to a number
  
      if (!isNaN(lat) && !isNaN(lng)) {
        const position = new google.maps.LatLng(lat, lng);
        const marker = new google.maps.Marker({
          position,
          map: this.map,
          title: station.station_name,
        });
  
        bounds.extend(position);
  
        marker.addListener('click', () => {
          this.toggleStationDetails(station.station_id);
        });
      } else {
        console.error('Invalid latitude or longitude for station:', station);
      }
    });
  
    if (this.uniqueStations.length > 0) {
      // Adjust map to fit all markers
      this.map.fitBounds(bounds);
    } else {
      // Zoom out to a wider view if no stations are present
      this.map.setZoom(8); // Adjust this value as needed
      this.map.setCenter({ lat: 51.5520114, lng: -0.08589690000000001 });
    }
  }
  

  fetchStationsWithoutPostalCode(): void {
    console.log('Fetching stations without a postal code is not implemented.');
    // Add logic here if fetching without postal code is allowed
  }
}
