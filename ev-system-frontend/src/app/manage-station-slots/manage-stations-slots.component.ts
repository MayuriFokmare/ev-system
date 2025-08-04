import { Component, OnInit } from '@angular/core';
import { ChargingSlotService } from '../charging-slot.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-manage-stations-slots',
  templateUrl: './manage-stations-slots.component.html',
  styleUrls: ['./manage-stations-slots.component.css']
})
export class ManageStationsSlotsComponent implements OnInit {

  slots: any[] = [];
  totalSlots = 0;
  availableSlots = 0;
  fastSlots = 0;
  userData : any;

  constructor(private chargingSlotService: ChargingSlotService, private router: Router,private authService : AuthService) { }

  ngOnInit(): void {
    this.userData = this.authService.getUserData(); // Get user data
    this.getChargingSlots();
  }

  getChargingSlots(): void {
    this.chargingSlotService.getChargingSlots(this.userData.user_id).subscribe(
      data => {
        this.slots = data.slots;
        this.calculateSlotOverview();
      },
      error => {
        console.error('Error fetching slots:', error);
      }
    );
  }

  deleteChargingSlot(stationId: string, slotNumber: string): void {
  const requestBody = {
    station_id: stationId,
    slot_number: slotNumber
  };

  this.chargingSlotService.deleteChargingSlot(requestBody).subscribe(
    () => this.getChargingSlots(),
    error => {
      console.error('Error deleting slot:', error);
    }
  );
}

  

  addEditableRow(): void {
    const newSlotNumber = this.slots.length > 0 
      ? Math.max(...this.slots.map(slot => slot.slot_number)) + 1 
      : 1; // Auto-increment or start from 1 if no slots exist
  
    const newSlot = {
      station_id: this.slots[0]?.station_id || 'Default Station ID', // Replace with a constant if necessary
      slot_number: newSlotNumber,
      slot_type: 'Fast', // Default value for slot type
      availability: 1, // Default value for availability
      price: 0.00, // Default value for price
      isEditable: true, // Mark as editable
      isNew: true
    };
  
    this.slots.push(newSlot);
    this.calculateSlotOverview();
  }
  
  saveSlot(slot: any): void {
    if (slot.isNew) {
      // Handle adding a new slot
      const slotData = {
        slot_type: slot.slot_type,
        availability: slot.availability,
        price: slot.price,
      };
      
      // Call the service to add the new slot
      this.chargingSlotService.addChargingSlot(slotData, this.userData.user_id).subscribe(
        () => {
          console.log('New slot added successfully');
      
          // Refresh the slots from the backend
          this.getChargingSlots();
      
          alert('New slot added successfully!');
        },
        (error) => {
          console.error('Error adding new slot:', error);
          alert('An error occurred while adding the slot. Please try again.');
        }
      );
    } else {
      // Handle updating an existing slot
      
      const updatedData = {
        slot_type: slot.slot_type,
        availability: slot.availability,
        price: slot.price,
      };
      
      this.chargingSlotService.updateChargingSlot(slot.station_id, slot.slot_number, updatedData).subscribe(
        () => {
          console.log('Slot updated successfully');
      
          // Refresh the slots from the backend
          this.getChargingSlots();
      
          alert('Slot updated successfully!');
        },
        (error) => {
          console.error('Error updating slot:', error);
          alert('An error occurred while updating the slot. Please try again.');
        }
      );      
    }
  }
  
  
  editRow(slot: any): void {
    slot.isEditable = true; // Allow editing
  }

  calculateSlotOverview(): void {
    this.totalSlots = this.slots.length;

    this.availableSlots = this.slots.filter(slot => slot.availability === 1).length;

    this.fastSlots = this.slots.filter(slot => slot.slot_type === 'Fast').length;
  }

  dashboard() {
    this.router.navigate(['/energy-provider-dashboard']);
  }
}
