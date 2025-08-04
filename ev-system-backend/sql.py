import mysql.connector
from mysql.connector import pooling

class SqlOperations:
    def __init__(self, db_config, logger):
        if not isinstance(db_config, dict):
            raise TypeError("db_config should be a dictionary")
        
        self.db_config = db_config
        self.logger = logger
        self.pool = pooling.MySQLConnectionPool(
            pool_name="mypool",
            pool_size=10,
            **self.db_config  # db_config is passed as keyword arguments
        )

    def _get_connection(self):
        return self.pool.get_connection()

    def fetch_station_slot_status(self, provider_id):
        connection = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
            SELECT 
                cs.station_id,
                cs.station_name,
                SUM(CASE WHEN sl.availability = 0 THEN 1 ELSE 0 END) AS active_reservations,
                SUM(CASE WHEN sl.availability = 1 THEN 1 ELSE 0 END) AS available_slots,
                (SELECT SUM(amount) 
                 FROM payment_details 
                 WHERE provider_id = cs.provider_id 
                 AND payment_status = 'Completed' 
                 AND MONTH(payment_date) = MONTH(CURRENT_DATE) 
                 AND YEAR(payment_date) = YEAR(CURRENT_DATE)) AS total_payment_month,
                (SELECT SUM(amount) 
                 FROM payment_details 
                 WHERE provider_id = cs.provider_id 
                 AND payment_status = 'Completed' 
                 AND DATE(payment_date) = CURRENT_DATE) AS total_payment_today,
                COUNT(sl.slot_id) AS total_slots
            FROM 
                charging_stations cs
            JOIN 
                charging_slots sl
            ON 
                cs.station_id = sl.station_id
            WHERE 
                cs.provider_id = %s
            GROUP BY 
                cs.station_id, cs.station_name;
            """
            cursor.execute(query, (provider_id,))
            stations = cursor.fetchall()
            return stations if stations else []
        except Exception as e:
            self.logger.error(f"Error fetching station slot status for provider {provider_id}: {str(e)}")
        finally:
            if connection:
                connection.close()  # Return connection to the pool
        return None

    def fetch_ev_owner_reservations(self, provider_id):
        connection = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
                    SELECT 
                    r.reservation_id, 
                    r.start_time, 
                    r.status, 
                    r.energy_consumed, 
                    u.first_name, 
                    u.last_name
                    FROM 
                    reservations r
                    JOIN 
                    users u ON r.provider_id = u.user_id
                    WHERE
                    r.provider_id = %s
                    ORDER BY 
                    r.start_time DESC
                    LIMIT 5;
                    """
            cursor.execute(query, (provider_id,))
            reservations = cursor.fetchall()
            return reservations if reservations else []
        except Exception as e:
            self.logger.error(f"Error fetching EV owner reservations for provider {provider_id}: {str(e)}")
        finally:
            if connection:
                connection.close()  # Return connection to the pool
        return None

    def fetch_user_by_email(self, email):
        connection = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT 
                first_name, 
                last_name, 
                role, 
                user_id
            FROM 
                evsystem.users
            WHERE 
                email = %s;
            """

            cursor.execute(query, (email,))
            user = cursor.fetchone()
            return user if user else None
        except Exception as e:
            self.logger.error(f"Error fetching user with email {email}: {str(e)}")
        finally:
            if connection:
                connection.close()  # Return connection to the pool
        return None
    
    def fetch_user_by_email_and_password(self, email, password):
        connection = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT 
                user_id, 
                role, 
                first_name, 
                last_name
            FROM 
                evsystem.users
            WHERE 
                email = %s AND password = %s;
            """

            cursor.execute(query, (email, password))
            user = cursor.fetchone()
            return user if user else None
        except Exception as e:
            self.logger.error(f"Error fetching user with email {email}: {str(e)}")
        finally:
            if connection:
                connection.close()  # Return connection to the pool
        return None
    
    def fetch_energy_and_payment_data(self, provider_id):
        connection = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT 
                DATE_FORMAT(r.start_time, '%b %Y') AS month_year,
                COALESCE(SUM(r.energy_consumed), 0) AS total_energy_consumed,
                COALESCE(SUM(p.amount), 0) AS total_amount
            FROM 
                reservations r
            LEFT JOIN 
                payment_details p ON DATE_FORMAT(r.start_time, '%Y-%m') = DATE_FORMAT(p.payment_date, '%Y-%m') 
                AND p.provider_id = r.provider_id 
                AND p.payment_status = 'Completed'
            WHERE 
                r.provider_id = %s
                AND r.status = 'Completed'
                AND r.start_time >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
                AND r.start_time < CURDATE() + INTERVAL 1 DAY
            GROUP BY 
                DATE_FORMAT(r.start_time, '%Y-%m')
            ORDER BY 
                r.start_time DESC;
            """

            cursor.execute(query, (provider_id,))
            result = cursor.fetchall()
            return result if result else None

        except Exception as e:
            self.logger.error(f"Error fetching energy and payment data for provider {provider_id}: {str(e)}")
        finally:
            if connection:
                connection.close()  # Return connection to the pool
        return None
    
    def update_slot_availability(self, slot_number, station_id, availability=0):
        connection = None
        try:
            connection = self._get_connection()
            cursor = connection.cursor()

            query = """
                    UPDATE charging_slots
                    SET availability = %s
                    WHERE slot_number = %s AND station_id = %s;
                    """

            cursor.execute(query, (availability, slot_number, station_id))
            connection.commit()

            # successful update by checking affected rows
            if cursor.rowcount > 0:
                return True
            else:
                self.logger.warning(
                f"No rows updated for slot_number={slot_number}, station_id={station_id}"
            )
            return False
        except Exception as e:
            self.logger.error(f"Error fetching charging slots for provider {slot_number}: {str(e)}")
        finally:
            if connection:
                connection.close()  # Return connection to the pool
        return False

    def fetch_charging_slots_by_provider(self, provider_id):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT 
                cs.station_id, 
                s.slot_number, 
                s.slot_type, 
                s.price, 
                s.availability
            FROM 
                charging_stations cs
            JOIN 
                charging_slots s ON cs.station_id = s.station_id
            WHERE 
                cs.provider_id = %s;
            """
            cursor.execute(query, (provider_id,))
            slots = cursor.fetchall()
            return slots
        except Exception as e:
            self.logger.error(f"Error fetching charging slots for provider {provider_id}: {str(e)}")
            return []
        finally:
            if connection:
                connection.close()

    def update_charging_slot(self, station_id, slot_number, slot_type, price, availability):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor()

            query = """
            UPDATE charging_slots
            SET slot_type = %s, price = %s, availability = %s
            WHERE station_id = %s AND slot_number = %s
            """
            cursor.execute(query, (slot_type, price, availability, station_id, slot_number))
            connection.commit()

            if cursor.rowcount > 0:
                return True
            else:
                return False
        except Exception as e:
            self.logger.error(f"Error updating charging slot: {str(e)}")
            return False
        finally:
            if connection:
                connection.close()

    def delete_charging_point(self, station_id, slot_number):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor()

            query = """
            DELETE FROM charging_slots
            WHERE station_id = %s AND slot_number = %s
            """
            cursor.execute(query, (station_id, slot_number))
            connection.commit()

            # Check if any row was deleted
            if cursor.rowcount == 0:
                return False  # No rows deleted
            return True
        except Exception as e:
            self.logger.error(f"Error deleting charging slot: {str(e)}")
            raise
        finally:
            if connection:
                connection.close()
    
    def fetch_booked_reservations_by_owner(self, owner_id):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT 
            reservation_id, 
            owner_id, 
            slot_id, 
            start_time, 
            end_time, 
            status, 
            station_id
        FROM 
            evsystem.reservations
        WHERE 
            status = 'Booked' 
            AND owner_id = %s;
            """
            cursor.execute(query, (owner_id,))
            slots = cursor.fetchall()
            return slots
        except Exception as e:
            self.logger.error(f"Error fetching fetch_booked_reservations_by_owner {owner_id}: {str(e)}")
            return []
        finally:
            if connection:
                connection.close()

    def fetch_reservations_with_station_info(self, owner_id):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT 
            r.reservation_id, 
            r.start_time, 
            r.status, 
            cs.station_name
        FROM 
            reservations r
        INNER JOIN 
            charging_stations cs
        ON 
            r.station_id = cs.station_id
        WHERE 
            r.owner_id = %s;
        """
            self.logger.info(f"Executing query: {query} with owner_id={owner_id}")
            cursor.execute(query, (owner_id,))
            reservations = cursor.fetchall()
            self.logger.info(f"Fetched {len(reservations)} reservations for owner_id={owner_id}")
            return reservations
        except Exception as e:
            self.logger.error(f"Error fetching reservations with station info for {owner_id}: {str(e)}")
            return []
        finally:
            if connection:
                connection.close()

    def fetch_reservations_with_charging_info(self,owner_id):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor(dictionary=True)

            query = """
            SELECT
        energy_consumed,
    CASE
        WHEN HOUR(start_time) BETWEEN 6 AND 18 THEN 'Daytime Charging'
        ELSE 'Nighttime Charging'
    END AS charging_time,
    CASE
        WHEN DAYOFWEEK(start_time) BETWEEN 2 AND 6 THEN 'Weekday'
        ELSE 'Weekend'
    END AS charging_day
    FROM reservations
    WHERE owner_id = %s;
            """
            self.logger.info("Executing query to fetch reservations with charging time and day info.")
            cursor.execute(query, (owner_id,))
            reservations = cursor.fetchall()
            self.logger.info(f"Fetched {len(reservations)} reservations with charging info.")
            return reservations
        except Exception as e:
            self.logger.error(f"Error fetching reservations with charging info: {str(e)}")
            return []
        finally:
            if connection:
                connection.close()


    def generate_next_slot(self, provider_id, slot_type, price, availability):
        connection = None
        try:
            connection = self.pool.get_connection()
            cursor = connection.cursor()

            # Step 1: Retrieve the last slot_id and generate the next slot_id
            cursor.execute("SELECT slot_id FROM charging_slots ORDER BY slot_id DESC LIMIT 1")
            last_slot_id = cursor.fetchone()
            if last_slot_id:
                last_slot_number = int(last_slot_id[0][2:])  # Extract number part of 'SLxxx'
                next_slot_id = f"SL{str(last_slot_number + 1).zfill(3)}"
            else:
                next_slot_id = "SL"  # Default to SL001 if no slots exist

            # Step 2: Retrieve station_id for the specific provider_id
            cursor.execute("SELECT station_id FROM charging_stations WHERE provider_id = %s LIMIT 1", (provider_id,))
            station_id = cursor.fetchone()

            if not station_id:
                raise ValueError(f"No station found for provider_id {provider_id}")

            # Step 3: Retrieve the next slot_number for the specific station (1 to 10)
            cursor.execute("SELECT IFNULL(MAX(slot_number), 0) + 1 FROM charging_slots WHERE station_id = %s", (station_id[0],))
            next_slot_number = cursor.fetchone()[0]
            
            # Step 4: Reset slot_number to 1 if it exceeds 10
            next_slot_number = 1 if next_slot_number > 10 else next_slot_number

            # Step 5: Insert the new slot into charging_slots
            cursor.execute("""
                INSERT INTO charging_slots 
                (slot_id, station_id, slot_number, slot_type, price, availability, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (next_slot_id, station_id[0], next_slot_number, slot_type, price, availability))

            connection.commit()
            return {"status": "success", "message": "Charging slot inserted successfully"}
        
        except Exception as e:
            self.logger.error(f"Error inserting charging slot: {str(e)}")
            return {"status": "error", "message": str(e)}
        
        finally:
            if connection:
                connection.close()

    


    
