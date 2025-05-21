const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { Pool } = require('@neondatabase/serverless');
const { config } = require('dotenv');

// Load environment variables
config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importCsvToDatabase() {
  try {
    console.log('Starting wine catalog import...');
    
    // Read the CSV file
    const filePath = path.join(__dirname, '..', 'winedb2.csv');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse the CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Parsed ${records.length} records from CSV file.`);
    
    // Connect to the database
    const client = await pool.connect();
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Clear the existing wine catalog
      await client.query('TRUNCATE TABLE wine_catalog RESTART IDENTITY');
      console.log('Cleared existing wine catalog data.');
      
      // Prepare the insert query
      const insertQuery = `
        INSERT INTO wine_catalog (name, category, wine, sub_type, producer, region, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      // Insert records in batches
      let count = 0;
      for (const record of records) {
        try {
          await client.query(insertQuery, [
            record.NAME || '',
            record.TYPE || 'Other',
            record.WINE || null,
            record.SUB_TYPE || null,
            record.PRODUCER || null,
            record.REGION || null,
            record.COUNTRY || null
          ]);
          count++;
        } catch (err) {
          console.error('Error inserting record:', err.message);
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log(`Successfully imported ${count} records into wine catalog.`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    console.log('Wine catalog import completed.');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import function
importCsvToDatabase();