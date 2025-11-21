# Database Setup Instructions

## Setting up the Wellness Forever Pharmacy Database

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qcrotvmlfhjsuxubbhbf`
3. Navigate to the SQL Editor

### Step 2: Run the Migration Script
1. Copy the entire content from `/supabase/migrations/001_create_pharmacy_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

This will:
- Drop any existing tables to start fresh
- Create the new relational database schema with proper table names
- Insert sample data for testing
- Set up indexes for optimal performance
- Create triggers for automatic timestamp updates

### Step 3: Verify the Setup
After running the migration, you should see these tables in your database:

#### Core Tables
- **medicines** - Medicine inventory with stock levels
- **employees** - Employee information and roles
- **sales** - Sales transaction records
- **sale_items** - Individual items in each sale
- **prescriptions** - Medical prescriptions
- **prescription_medicines** - Medicines in each prescription
- **time_entries** - Employee time tracking
- **support_tickets** - Help desk tickets
- **stock_movements** - Inventory change audit trail

#### Sample Data Included
- 5 sample medicines with different stock levels
- 5 sample employees with different roles
- Sample prescriptions and time entries
- Proper relationships between all tables

### Step 4: Test the API
1. The application will automatically connect to the new database structure
2. All existing functionality will work with the new relational schema
3. Data will persist between sessions using the proper Supabase tables

### Database Schema Benefits

#### Improved Structure
- **Proper Relationships**: Foreign keys ensure data integrity
- **Normalized Data**: Eliminates redundancy and improves consistency
- **Clear Naming**: Table and column names are descriptive and professional
- **Scalability**: Designed to handle growth in data volume

#### Enhanced Features
- **Audit Trail**: Stock movements are tracked with full history
- **UUID Primary Keys**: Better for distributed systems and security
- **Automatic Timestamps**: Created/updated timestamps are managed automatically
- **Optimized Queries**: Indexes improve search and filtering performance

#### Professional Naming Convention
- Tables use plural nouns (e.g., `medicines`, `employees`)
- Columns use snake_case (e.g., `full_name`, `unit_price`)
- Clear semantic meaning (e.g., `prescription_status` instead of just `status`)
- Consistent patterns across all tables

### Troubleshooting

If you encounter any issues:

1. **Permission Errors**: Ensure you're using the service role key
2. **Connection Issues**: Check your Supabase project URL and keys
3. **Migration Errors**: Run the script in smaller chunks if needed
4. **Data Issues**: The application includes fallback to localStorage if database is unavailable

### Next Steps

Once the database is set up:
1. The application will automatically use the new schema
2. All data will be stored in proper relational tables
3. Reports and analytics will work with real database queries
4. The system is ready for production deployment

The migration maintains backward compatibility while providing a much more robust and scalable foundation for the pharmacy management system.