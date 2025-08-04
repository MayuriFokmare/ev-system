##  Application Demo
Watch the demo video here:  https://drive.google.com/file/d/1QyVGzUTHqJXm9qLADu-6mXxrU3BmKXnS/view?usp=drive_link

# Charging Slot Management API
 
This project provides an API for managing charging slots for Electric Vehicles (EVs). It allows energy providers and EV owners to interact with charging stations, manage reservations, and process payments via Stripe.
 
## Features
 
- **Charging Slot Management**:
  - Add, update, and delete charging slots.
  - Fetch available charging slots for a provider.
- **Reservations**:
  - Fetch reservations made by EV owners.
  - Fetch reservation history with station information and charging times.
 
- **Payment Integration**:
  - Payment processing via Stripe for reserving charging slots.
 
- **User Authentication**:
  - Login functionality for users based on email and password.
  - Role-based redirection (EnergyProvider or EVOwner).
 
- **Fetching Charging Stations**:
  - Get a list of charging stations based on postal code.
 
## Prerequisites
 
Before running this project, ensure you have the following:
 
- Python 3.x
- MySQL database
- Stripe account for payment functionality
 
## Installation
 
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/charging-slot-management.git
   cd charging-slot-management
