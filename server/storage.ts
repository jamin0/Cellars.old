import { 
  wines, 
  wineCatalog, 
  type Wine, 
  type InsertWine, 
  type WineCatalog, 
  type InsertWineCatalog 
} from "@shared/schema";
import fs from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { db } from './db';
import { eq, or, sql } from 'drizzle-orm';

// Modify the interface with needed CRUD methods
export interface IStorage {
  // Wine inventory management
  getWines(): Promise<Wine[]>;
  getWineById(id: number): Promise<Wine | undefined>;
  getWinesByCategory(category: string): Promise<Wine[]>;
  addWine(wine: InsertWine): Promise<Wine>;
  updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined>;
  deleteWine(id: number): Promise<boolean>;
  
  // Wine catalog management (from CSV)
  getWineCatalog(): Promise<WineCatalog[]>;
  searchWineCatalog(query: string): Promise<WineCatalog[]>;
  loadWineCatalogFromCSV(filePath: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private wineStore: Map<number, Wine>;
  private catalogStore: Map<number, WineCatalog>;
  private wineCurrentId: number;
  private catalogCurrentId: number;

  constructor() {
    this.wineStore = new Map();
    this.catalogStore = new Map();
    this.wineCurrentId = 1;
    this.catalogCurrentId = 1;

    // Try to load the wine catalog from CSV on initialization
    this.loadWineCatalogFromCSV(path.join(process.cwd(), 'server/data/winedb2.csv'))
      .catch(err => console.error('Failed to load wine catalog:', err));
  }

  // Wine Inventory Methods
  async getWines(): Promise<Wine[]> {
    return Array.from(this.wineStore.values());
  }

  async getWineById(id: number): Promise<Wine | undefined> {
    return this.wineStore.get(id);
  }

  async getWinesByCategory(category: string): Promise<Wine[]> {
    return Array.from(this.wineStore.values()).filter(
      wine => wine.category === category
    );
  }

  async addWine(wine: InsertWine): Promise<Wine> {
    const id = this.wineCurrentId++;
    const createdAt = new Date().toISOString();
    const newWine: Wine = { ...wine, id, createdAt };
    this.wineStore.set(id, newWine);
    return newWine;
  }

  async updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined> {
    const existingWine = this.wineStore.get(id);
    if (!existingWine) return undefined;

    const updatedWine: Wine = { ...existingWine, ...wine };
    this.wineStore.set(id, updatedWine);
    return updatedWine;
  }

  async deleteWine(id: number): Promise<boolean> {
    return this.wineStore.delete(id);
  }

  // Wine Catalog Methods (from CSV)
  async getWineCatalog(): Promise<WineCatalog[]> {
    return Array.from(this.catalogStore.values());
  }

  async searchWineCatalog(query: string): Promise<WineCatalog[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.catalogStore.values()).filter(wine => 
      wine.name.toLowerCase().includes(lowerQuery) || 
      (wine.producer && wine.producer.toLowerCase().includes(lowerQuery))
    );
  }

  async loadWineCatalogFromCSV(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Make sure the data directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create an empty CSV file if it doesn't exist
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'name,category,producer,region,country\n');
      }

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      const readableStream = createReadStream(filePath);

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          const id = this.catalogCurrentId++;
          const wineEntry: WineCatalog = {
            id,
            name: record.name || '',
            category: record.category || 'Other',
            producer: record.producer || '',
            region: record.region || '',
            country: record.country || ''
          };
          this.catalogStore.set(id, wineEntry);
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve();
      });

      readableStream.pipe(parser);
    });
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // When the database storage is initialized, we'll try to load the catalog
    this.loadWineCatalogFromCSV(path.join(process.cwd(), 'server/data/winedb2.csv'))
      .catch(err => console.error('Failed to load wine catalog:', err));
  }

  // Wine Inventory Methods
  async getWines(): Promise<Wine[]> {
    const result = await db.select().from(wines);
    return result;
  }

  async getWineById(id: number): Promise<Wine | undefined> {
    const [wine] = await db.select().from(wines).where(eq(wines.id, id));
    return wine;
  }

  async getWinesByCategory(category: string): Promise<Wine[]> {
    const result = await db.select().from(wines).where(eq(wines.category, category));
    return result;
  }

  async addWine(wine: InsertWine): Promise<Wine> {
    const now = new Date().toISOString();
    const [result] = await db.insert(wines).values({
      ...wine,
      vintageStocks: Array.isArray(wine.vintageStocks) ? wine.vintageStocks : [],
      createdAt: now
    }).returning();
    return result;
  }

  async updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine | undefined> {
    const [result] = await db.update(wines)
      .set(wine)
      .where(eq(wines.id, id))
      .returning();
    return result;
  }

  async deleteWine(id: number): Promise<boolean> {
    const result = await db.delete(wines).where(eq(wines.id, id));
    return !!result;
  }

  // Wine Catalog Methods (from CSV)
  async getWineCatalog(): Promise<WineCatalog[]> {
    const result = await db.select().from(wineCatalog);
    return result;
  }

  async searchWineCatalog(query: string): Promise<WineCatalog[]> {
    const lowerQuery = query.toLowerCase();
    const result = await db.select().from(wineCatalog).where(
      or(
        sql`lower(${wineCatalog.name}) like ${`%${lowerQuery}%`}`,
        sql`lower(${wineCatalog.producer}) like ${`%${lowerQuery}%`}`
      )
    );
    return result;
  }

  async loadWineCatalogFromCSV(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Make sure the data directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Create an empty CSV file if it doesn't exist
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, 'name,category,producer,region,country\n');
          resolve();
          return;
        }

        const parser = parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        });

        const wines: InsertWineCatalog[] = [];

        parser.on('readable', () => {
          let record;
          while ((record = parser.read()) !== null) {
            wines.push({
              name: record.name || '',
              category: record.category || 'Other',
              producer: record.producer || null,
              region: record.region || null,
              country: record.country || null
            });
          }
        });

        parser.on('error', (err) => {
          reject(err);
        });

        parser.on('end', async () => {
          try {
            // First delete all existing catalog items
            await db.delete(wineCatalog);
            
            // Then bulk insert if we have wines
            if (wines.length > 0) {
              await db.insert(wineCatalog).values(wines);
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        createReadStream(filePath).pipe(parser);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();
