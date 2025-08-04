import { Component,OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { ChargingSlotService } from './charging-slot.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit {

  constructor(private router: Router,private authService: AuthService) {}

  title = 'evcharging';
  
  ngOnInit(): void {
  }
  logoutAndRedirect() : void {
    this.router.navigate(['/login']);
  }
}
