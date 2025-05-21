const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importChunk(records, startIdx, endIdx) {
  console.log(`Processing records ${startIdx} to ${endIdx}`);
  
  // Connect to the database for this chunk
  const client = await pool.connect();
  try {
    // Prepare the insert query
    const insertQuery = `
      INSERT INTO wine_catalog (name, category, wine, sub_type, producer, region, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    // Process this chunk of records
    for (let i = startIdx; i < endIdx && i < records.length; i++) {
      const record = records[i];
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
        
        // Log progress occasionally
        if (i % 1000 === 0) {
          console.log(`Imported ${i} records so far...`);
        }
      } catch (err) {
        console.error(`Error inserting record at index ${i}:`, err.message);
      }
    }
    
    console.log(`Successfully processed chunk ${startIdx} to ${endIdx}`);
  } finally {
    client.release();
  }
}

async function importCsvToDatabase() {
  try {
    console.log('Starting wine catalog import...');
    
    // Read the CSV file
    const filePath = './winedb2.csv';
    console.log(`Reading CSV file from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse the CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Parsed ${records.length} records from CSV file.`);
    
    // Clear the existing wine catalog
    const client = await pool.connect();
    try {
      await client.query('TRUNCATE TABLE wine_catalog RESTART IDENTITY CASCADE');
      console.log('Cleared existing wine catalog data.');
    } finally {
      client.release();
    }
    
    // Split into chunks of 5000 records to avoid memory issues
    const CHUNK_SIZE = 5000;
    const numChunks = Math.ceil(records.length / CHUNK_SIZE);
    
    console.log(`Processing ${records.length} records in ${numChunks} chunks...`);
    
    // Process each chunk sequentially to avoid overwhelming the database
    for (let chunk = 0; chunk < numChunks; chunk++) {
      const startIdx = chunk * CHUNK_SIZE;
      const endIdx = Math.min(startIdx + CHUNK_SIZE, records.length);
      
      await importChunk(records, startIdx, endIdx);
      console.log(`Completed chunk ${chunk + 1} of ${numChunks}`);
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