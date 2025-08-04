import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChargingSlotService {

  private apiUrl = 'http://127.0.0.1:5000/api/charging-slots';
  private userDataUrl = 'http://127.0.0.1:5000/api/user';
  private reservations = 'http://127.0.0.1:5000/api/ev-owner-reservations';
  private visualization = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) { }

  getChargingSlots(provider_id: string): Observable<any> {
    const url = `${this.apiUrl}/${provider_id}`;
    return this.http.get<any>(url);
  }

  // addChargingSlot(slot: any,provider_id: string): Observable<any> {
  //   const url = `${this.apiUrl}/add/${provider_id}`;
  //   return this.http.post<any>(url, slot);
  // }

  addChargingSlot(slot: { slot_type: string, price: number, availability: string }, provider_id: string): Observable<any> { 
    const url = `${this.apiUrl}/add/${provider_id}`;
  
    // Send the slot data in the POST request body and add Content-Type header
    return this.http.post<any>(url, slot, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }
  
  
  // updateChargingSlot(stationId: number, slotNumber: number, updatedData: any): Observable<any> {
  //   const url = `${this.apiUrl}/${stationId}/${slotNumber}`;
  //   return this.http.put<any>(url, updatedData);
  // }

  updateChargingSlot(stationId: string, slotNumber: string, updatedData: { slot_type: string, availability: boolean, price: number }): Observable<any> {
    const requestBody = {
      station_id: stationId,
      slot_number: slotNumber,
      ...updatedData, // Spread the updatedData to include the fields in the body
    };
  
    return this.http.put<any>(`${this.apiUrl}/update`, requestBody);
  }
  
  deleteChargingSlot(requestBody: { station_id: string, slot_number: string }): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete`, { body: requestBody });
  }
  
  
  getStations(postalCode: string): Observable<any> {
    const body = { postal_code: postalCode }; // Prepare the payload
    return this.http.post(`${this.apiUrl}/get_stations`, body);
  }

  // Create payment session
  createPaymentSession(station: any,user_id:any): Observable<any> {
    const payload = {
      station_name: station.station_name,
      price: station.price,
      slot_number: station.slot_number,
      station_id: station.station_id,
      user_id:user_id
    };

    return this.http.post(`${this.apiUrl}/create_payment`, payload);
  }

  getUserData(email: string): Observable<any> {
    const url = `${this.userDataUrl}/${email}`;
    return this.http.get<any>(url);
  }
  

  getSummary(provider_id: string): Observable<any> {
    const url = `${this.apiUrl}/slots/${provider_id}`;
    return this.http.get<any>(url);
  }

  getRecentReservation(provider_id: string): Observable<any> {
    const url = `${this.reservations}/${provider_id}`;
    return this.http.get<any>(url);
  }

  getVisualization(provider_id: string): Observable<any> {
    const url = `${this.visualization}/energy-payment-stats/${provider_id}`;
    return this.http.get<any>(url);
  }

  getHistory(provider_id: string): Observable<any> {
    const url = `${this.visualization}/history/${provider_id}`;
    return this.http.get<any>(url);
  }

  getBooking(provider_id: string): Observable<any> {
    const url = `${this.visualization}/reservations/${provider_id}`;
    return this.http.get<any>(url);
  }

  getEnergyVisualize(provider_id: string): Observable<any> {
    const url = `${this.visualization}/reservations_with_charging_info/${provider_id}`;
    return this.http.get<any>(url);
  }
}
