import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { parse } from 'csv-parse/sync';
import pg from 'pg';
import readline from 'readline';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Process a batch of lines
async function processBatch(batchLines) {
  if (batchLines.length === 0) return 0;
  
  // Add header row back for parsing
  const csvData = 'NAME,PRODUCER,WINE,COUNTRY,REGION,TYPE,SUB_TYPE,VINTAGE_CONFIG,FIRST_VINTAGE\n' + batchLines.join('\n');
  
  // Parse the CSV data
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  // Skip if no records
  if (records.length === 0) return 0;
  
  // Connect to the database
  const client = await pool.connect();
  try {
    // Prepare the insert query
    const insertQuery = `
      INSERT INTO wine_catalog (name, category, wine, sub_type, producer, region, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    // Insert each record
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
    
    return count;
  } finally {
    client.release();
  }
}

// Process the CSV file in batches
async function processCSVInBatches() {
  try {
    console.log('Starting wine catalog import in batches...');
    
    // Clear the existing wine catalog
    const client = await pool.connect();
    try {
      await client.query('TRUNCATE TABLE wine_catalog RESTART IDENTITY CASCADE');
      console.log('Cleared existing wine catalog data.');
    } finally {
      client.release();
    }
    
    // Create a read stream for the CSV file
    const filePath = path.join(__dirname, '..', 'winedb2.csv');
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let batchLines = [];
    let lineCount = 0;
    let batchCount = 0;
    let totalImported = 0;
    let isFirstLine = true;  // Skip header line
    
    const BATCH_SIZE = 1000;
    
    // Process each line
    for await (const line of rl) {
      if (isFirstLine) {
        isFirstLine = false;
        continue;  // Skip header
      }
      
      batchLines.push(line);
      lineCount++;
      
      // Process a batch when we reach batch size
      if (lineCount % BATCH_SIZE === 0) {
        batchCount++;
        console.log(`Processing batch ${batchCount} (lines ${lineCount - BATCH_SIZE + 1} to ${lineCount})...`);
        
        const imported = await processBatch(batchLines);
        totalImported += imported;
        
        console.log(`Imported ${imported} records in this batch. Total: ${totalImported}`);
        batchLines = [];  // Clear for next batch
      }
    }
    
    // Process the last batch if there are any remaining lines
    if (batchLines.length > 0) {
      batchCount++;
      console.log(`Processing final batch ${batchCount} (${batchLines.length} lines)...`);
      
      const imported = await processBatch(batchLines);
      totalImported += imported;
      
      console.log(`Imported ${imported} records in final batch. Total: ${totalImported}`);
    }
    
    console.log(`Import completed. Total records imported: ${totalImported}`);
    
    // Verify the count
    const result = await pool.query('SELECT COUNT(*) FROM wine_catalog');
    console.log(`Verification: Total wine catalog records: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import function
processCSVInBatches();