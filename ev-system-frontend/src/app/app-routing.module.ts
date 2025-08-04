import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BookSlotComponent } from './book-slot/book-slot.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { EvOwnerDashboardComponent } from './ev-owner-dashboard/ev-owner-dashboard.component';
import { ManageStationsSlotsComponent } from './manage-station-slots/manage-stations-slots.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'energy-provider-dashboard', component: DashboardComponent },
  {path:'book-slot',component:BookSlotComponent},
  {path:'manage-stations-slots',component:ManageStationsSlotsComponent},
  { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'ev-owner-dashboard/:user_id', component: EvOwnerDashboardComponent },
  { path: 'ev-owner-dashboard', component: EvOwnerDashboardComponent },

    // Add this route
  // { path: 'analytics', component: AnalyticsComponent },
  // { path: 'manage-stations-slots', component: ManageStationsSlotsComponent },
  // { path: 'slot-reservation', component: SlotReservationComponent },
  // {path: 'forgot-password', component:ForgotPasswordComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
