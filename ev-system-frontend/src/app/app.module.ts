import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BookSlotComponent } from './book-slot/book-slot.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { EvOwnerDashboardComponent } from './ev-owner-dashboard/ev-owner-dashboard.component';
import { ManageStationsSlotsComponent } from './manage-station-slots/manage-stations-slots.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    DashboardComponent,
    BookSlotComponent,
    ManageStationsSlotsComponent,
    PaymentSuccessComponent,
    EvOwnerDashboardComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, //  FormsModule 
    HttpClientModule, //  HttpClientModule for API calls
    GoogleMapsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
