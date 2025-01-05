import logging
from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS
import mysql.connector
from config import config
from sql import SqlOperations
from dotenv import load_dotenv
import os
import stripe

load_dotenv()  # Load environment variables from the .env file

# Set the Stripe secret key
stripe.api_key = os.getenv('STRIPE_API_KEY')

# logger
logging.basicConfig(level=logging.DEBUG,  # Set log level
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')  # Log format
logger = logging.getLogger(__name__)
# # sql related operations
# db_config = config.db_config
# connection = mysql.connector.connect(**db_config)
# sql_op = SqlOperations(connection, logger)

# sql related operations
db_config = config.db_config  # Assuming db_config is a dictionary in config

# Pass the db_config to SqlOperations instead of connection
sql_op = SqlOperations(db_config, logger)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all domains (or specify origins as needed)
CORS(app)  # This will allow all origins by default

# CORS(app, origins=["http://localhost:4200"])

# Route to fetch data
@app.route('/api/charging-slots/<provider_id>', methods=['GET'])
def get_charging_slots(provider_id):
    try:
        # Fetch charging slots for the given provider ID
        slots = sql_op.fetch_charging_slots_by_provider(provider_id)
        
        if slots:
            return jsonify({"status": "success", "slots": slots}), 200
        else:
            return jsonify({"status": "error", "message": "No slots found for the given provider"}), 404
    except Exception as e:
        logger.error(f"Error in get_charging_slots API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500


# Route to add a new charging slot (POST API)
@app.route('/api/charging-slots/add/<provider_id>', methods=['POST'])
def add_charging_slot(provider_id):
    try:
        # Parse request data
        data = request.get_json()
        slot_type = data.get('slot_type')
        price = data.get('price')
        availability = data.get('availability')

        # Validate input
        if not provider_id or not slot_type or not price or not availability:
            return jsonify({"status": "error", "message": "Provider ID, Slot Type, Price, and Availability are required"}), 400

        # Call the insert method
        result = sql_op.generate_next_slot(provider_id, slot_type, price, availability)

        if result["status"] == "success":
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error in add_charging_slot API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500



@app.route('/api/charging-slots/update', methods=['PUT'])
def update_charging_slot():
    try:
        # Parse request data
        data = request.get_json()
        station_id = data.get('station_id')
        slot_number = data.get('slot_number')
        slot_type = data.get('slot_type')
        price = data.get('price')
        availability = data.get('availability')

        # Validate input
        if not all([station_id, slot_number, slot_type, price, availability]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        # Update the charging slot
        success = sql_op.update_charging_slot(
            station_id, slot_number, slot_type, price, availability
        )

        if success:
            return jsonify({"status": "success", "message": "Charging slot updated successfully"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to update the charging slot"}), 404
    except Exception as e:
        logger.error(f"Error in update_charging_slot API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500


# Route to delete a charging slot (DELETE API)
@app.route('/api/charging-slots/delete', methods=['DELETE'])
def delete_charging_slot():
    try:
        # Parse request data
        data = request.get_json()
        station_id = data.get('station_id')
        slot_number = data.get('slot_number')

        # Validate input
        if not station_id or not slot_number:
            return jsonify({"status": "error", "message": "Station ID and slot number are required"}), 400

        # Call the delete method
        success = sql_op.delete_charging_point(station_id, slot_number)

        if success:
            return jsonify({"status": "success", "message": "Charging slot deleted successfully"}), 200
        else:
            return jsonify({"status": "error", "message": "Charging slot not found"}), 404
    except Exception as e:
        logger.error(f"Error in delete_charging_slot API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500


# Get charging stations by postal code
def get_stations_by_postal_code(postal_code):
    try:
        # Connect to the database
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Query to fetch charging stations based on postal code
        query = """
        SELECT 
            s.station_id,
            cs.price, 
            cs.availability, 
            cs.slot_type,
            cs.slot_number, 
            s.station_name,
            s.postalcode,
            s.latitude, 
            s.longitude
        FROM 
            charging_slots cs
        JOIN 
            charging_stations s 
        ON 
            cs.station_id = s.station_id
        WHERE 
            s.postalcode = %s;
        """
        
        # Execute the query with the postal code as parameter
        cursor.execute(query, (postal_code,))  # Make sure postal_code is passed as a tuple
        stations = cursor.fetchall()

        return stations

    except mysql.connector.Error as err:
        raise Exception(f"Database error: {str(err)}")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


# API to fetch stations based on postal code
@app.route('/api/charging-slots/get_stations', methods=['POST'])
def get_stations():
    try:
        data = request.get_json()
        postal_code = data.get("postal_code")

        if not postal_code:
            return jsonify({"status": "error", "message": "Postal code is required"}), 400

        stations = get_stations_by_postal_code(postal_code)

        if not stations:
            return jsonify({"status": "success", "data": [], "message": "No stations found for the given postal code"}), 200

        return jsonify({"status": "success", "data": stations}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/charging-slots/create_payment', methods=['POST'])
def create_payment_session():
    data = request.get_json()

    # Get the station name and price from the request data
    station_name = data.get('station_name')
    price = data.get('price')
    slotNumber = data.get('slot_number')
    stationId = data.get('station_id')
    userId = data.get('user_id')

    # Validate the incoming data
    if not station_name or not price:
        return jsonify({'status': 'error', 'message': 'Station name and price are required.'}), 400

    try:
        # Create a Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'gbp',  # Set currency to GBP (British Pounds)
                    'product_data': {
                        'name': station_name,
                    },
                    'unit_amount': int(float(price) * 100),  # Convert price to the smallest unit (pence)
                },
                'quantity': 1,
            }],
            mode='payment',
           #success_url='http://localhost:4200/payment-success',
            success_url = f'http://localhost:4200/payment-success?user_id={userId}',
            cancel_url='http://localhost:5000/cancel',
        )
        # Call the update_slot_availability method
        try:
            # Assuming the method is defined in a relevant class and needs an instance to call
            sql_op.update_slot_availability(slotNumber, stationId, availability=0)
        except Exception as update_error:
            # Handle any errors from the custom method
            print(f"Error updating slot availability: {update_error}")
            return jsonify({'status': 'error', 'message': 'Internal server error while updating slot availability.'}), 500

        # Return the session URL to the frontend
        return jsonify({
            'status': 'success',
            'url': checkout_session.url
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Define the success and cancel routes
@app.route('/success')
def success():
    return jsonify({"status": "success", "message": "Payment successful"})

@app.route('/cancel')
def cancel():
    return jsonify({"status": "error", "message": "Payment canceled"})

    
# Route to handle login
@app.route('/api/login', methods=['POST'])
def login():
    try:
        # Get the login data (email and password)
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Validate the required fields
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        # Fetch user from the database by email and password
        user = sql_op.fetch_user_by_email_and_password(email, password)

        if user:
            # Check user role to redirect
            role = user['role']
            redirect_url = ""
            first_name = user['first_name']
            last_name = user['last_name']

            if role == 'EnergyProvider':
                redirect_url = '/energy-provider-dashboard'  # Redirect URL for EnergyProvider
            elif role == 'EVOwner':
                redirect_url = '/ev-owner-dashboard'  # Redirect URL for EVOwner
            
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "role": role,
                "redirect_url": redirect_url,
                "first_name": first_name,
                "last_name": last_name
            }), 200
        
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500
    

@app.route('/api/user/<email>', methods=['GET'])
def get_user_by_email(email):
    try:
        user = sql_op.fetch_user_by_email(email)
        if user is not None:
            return jsonify({"status": "success", "user": user}), 200
        return jsonify({"status": "error", "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/charging-slots/slots/<provider_id>', methods=['GET'])
def get_station_status(provider_id):
    try:
        stations = sql_op.fetch_station_slot_status(provider_id)
        
        if stations is not None:
            return jsonify({"status": "success", "stations": stations}), 200
        else:
            return jsonify({"status": "error", "message": "No data found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/ev-owner-reservations/<provider_id>', methods=['GET'])
def get_ev_owner_reservations(provider_id):
    try:
        reservations = sql_op.fetch_ev_owner_reservations(provider_id)
        
        if reservations:
            return jsonify({"status": "success", "reservations": reservations}), 200
        else:
            return jsonify({"status": "error", "message": "No reservations found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/energy-payment-stats/<provider_id>', methods=['GET'])
def get_energy_payment_stats(provider_id):
    try:
        # provider_id = request.args.get('provider_id', default='EP', type=str)  # Default 'EP005'

        # Fetch energy and payment data
        data = sql_op.fetch_energy_and_payment_data(provider_id)
        
        if data:
            return jsonify({
                "status": "success",
                "data": data
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "No data found for the provider"
            }), 404

    except Exception as e:
        logger.error(f"Error fetching energy payment stats: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Internal Server Error"
        }), 500


@app.route('/api/reservations/<owner_id>', methods=['GET']) 
def get_reservations_by_owner(owner_id):
    try:
        if not owner_id:
            return jsonify({"status": "error", "message": "Invalid owner_id"}), 400

        # Fetch reservations
        reservations = sql_op.fetch_booked_reservations_by_owner(owner_id)
        
        # Respond with data
        if reservations:
            return jsonify({"status": "success", "data": reservations}), 200
        else:
            return jsonify({
                "status": "success", 
                "data": [], 
                "message": "No reservations found"
            }), 200
    except Exception as e:
        # Log error and respond with a 500 Internal Server Error
        sql_op.logger.error(f"Error in get_reservations_by_owner API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500

@app.route('/api/history/<owner_id>', methods=['GET'])
def get_reservations_with_station_info(owner_id):
    try:
        if not owner_id:
            return jsonify({"status": "error", "message": "Invalid owner_id"}), 400

        # Fetch reservations with station information
        reservations = sql_op.fetch_reservations_with_station_info(owner_id)
        
        # Respond with data
        if reservations:
            return jsonify({"status": "success", "data": reservations}), 200
        else:
            return jsonify({
                "status": "success", 
                "data": [], 
                "message": "No reservations found"
            }), 200
    except Exception as e:
        # Log error and respond with a 500 Internal Server Error
        sql_op.logger.error(f"Error in get_reservations_with_station_info API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500

@app.route('/api/reservations_with_charging_info/<owner_id>', methods=['GET'])
def get_reservations_with_charging_info(owner_id):
    try:
        # Fetch reservations with charging time and day info
        reservations = sql_op.fetch_reservations_with_charging_info(owner_id)
        
        # Respond with data
        if reservations:
            return jsonify({"status": "success", "data": reservations}), 200
        else:
            return jsonify({
                "status": "success", 
                "data": [], 
                "message": "No reservations found"
            }), 200
    except Exception as e:
        # Log error and respond with a 500 Internal Server Error
        sql_op.logger.error(f"Error in get_reservations_with_charging_info API: {str(e)}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500


if __name__ == '__main__':
    app.run(debug=True)
