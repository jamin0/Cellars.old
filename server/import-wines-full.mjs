import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  webSocketConstructor: ws
});

async function importCsvToDatabase() {
  try {
    console.log('Starting wine catalog import...');
    
    // Read the CSV file
    const filePath = path.join(__dirname, '..', 'winedb2.csv');
    console.log(`Reading CSV file from: ${filePath}`);
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
      await client.query('TRUNCATE TABLE wine_catalog RESTART IDENTITY CASCADE');
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
          const wine = record.WINE || '';
          const subType = record.SUB_TYPE || '';
          const category = record.TYPE || 'Other';
          
          await client.query(insertQuery, [
            record.NAME || '',
            category,
            wine,
            subType,
            record.PRODUCER || '',
            record.REGION || '',
            record.COUNTRY || ''
          ]);
          count++;
          
          // Log progress for every 100 records
          if (count % 100 === 0) {
            console.log(`Processed ${count} records...`);
          }
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