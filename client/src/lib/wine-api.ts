import { Wine, InsertWine, VintageStock, WineCatalog } from "@shared/schema";
import { apiRequest } from "./queryClient";

/**
 * Service class for interacting with the wine API
 */
export class WineService {
  /**
   * Gets all wines in the inventory
   */
  static async getWines(): Promise<Wine[]> {
    const response = await fetch("/api/wines", {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wines: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Gets a specific wine by ID
   */
  static async getWineById(id: number): Promise<Wine> {
    const response = await fetch(`/api/wines/${id}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wine: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Gets wines of a specific category
   */
  static async getWinesByCategory(category: string): Promise<Wine[]> {
    const response = await fetch(`/api/wines/category/${encodeURIComponent(category)}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wines by category: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Adds a new wine to the inventory
   */
  static async addWine(wine: InsertWine): Promise<Wine> {
    const response = await apiRequest("POST", "/api/wines", wine);
    return response.json();
  }
  
  /**
   * Updates an existing wine
   */
  static async updateWine(id: number, wine: Partial<InsertWine>): Promise<Wine> {
    const response = await apiRequest("PATCH", `/api/wines/${id}`, wine);
    return response.json();
  }
  
  /**
   * Updates the stock level of a wine
   */
  static async updateStockLevel(id: number, stockLevel: number): Promise<Wine> {
    return this.updateWine(id, { stockLevel });
  }
  
  /**
   * Updates the vintage stocks of a wine
   */
  static async updateVintageStocks(id: number, vintageStocks: VintageStock[]): Promise<Wine> {
    return this.updateWine(id, { vintageStocks });
  }
  
  /**
   * Deletes a wine from the inventory
   */
  static async deleteWine(id: number): Promise<void> {
    await apiRequest("DELETE", `/api/wines/${id}`);
  }
  
  /**
   * Searches the wine catalog for matching wines
   */
  static async searchWineCatalog(query: string): Promise<WineCatalog[]> {
    const response = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search wine catalog: ${response.statusText}`);
    }
    
    return response.json();
  }
}
