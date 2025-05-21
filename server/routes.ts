import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWineSchema } from "@shared/schema";
import path from "path";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  
  // Auth endpoint to get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Wine Inventory API Routes
  // Get all wines (user-specific if authenticated)
  app.get("/api/wines", async (req: any, res) => {
    try {
      const userId = req.isAuthenticated() ? req.user.claims.sub : undefined;
      const wines = await storage.getWines(userId);
      res.json(wines);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch wines" });
    }
  });

  // Get wine by ID
  app.get("/api/wines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wine ID" });
      }

      const wine = await storage.getWineById(id);
      if (!wine) {
        return res.status(404).json({ message: "Wine not found" });
      }

      res.json(wine);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch wine" });
    }
  });

  // Get wines by category (user-specific if authenticated)
  app.get("/api/wines/category/:category", async (req: any, res) => {
    try {
      const { category } = req.params;
      const userId = req.isAuthenticated() ? req.user.claims.sub : undefined;
      const wines = await storage.getWinesByCategory(category, userId);
      res.json(wines);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch wines by category" });
    }
  });

  // Add a new wine (requires authentication)
  app.post("/api/wines", isAuthenticated, async (req: any, res) => {
    try {
      const parseResult = insertWineSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid wine data", 
          errors: parseResult.error.format() 
        });
      }
      
      // Add the user ID to the wine data
      const wineData = {
        ...parseResult.data,
        userId: req.user.claims.sub
      };

      const newWine = await storage.addWine(wineData);
      res.status(201).json(newWine);
    } catch (err) {
      console.error("Error adding wine:", err);
      res.status(500).json({ message: "Failed to add wine" });
    }
  });

  // Update an existing wine
  app.patch("/api/wines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wine ID" });
      }

      // We only validate the fields that were provided
      const partial = insertWineSchema.partial();
      const parseResult = partial.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid wine data", 
          errors: parseResult.error.format() 
        });
      }

      const updatedWine = await storage.updateWine(id, parseResult.data);
      if (!updatedWine) {
        return res.status(404).json({ message: "Wine not found" });
      }

      res.json(updatedWine);
    } catch (err) {
      console.error("Error updating wine:", err);
      res.status(500).json({ message: "Failed to update wine", error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Delete a wine
  app.delete("/api/wines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wine ID" });
      }

      const success = await storage.deleteWine(id);
      if (!success) {
        return res.status(404).json({ message: "Wine not found" });
      }

      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete wine" });
    }
  });

  // Wine Catalog API Routes
  // Search wine catalog
  app.get("/api/catalog/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const results = await storage.searchWineCatalog(query);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Failed to search wine catalog" });
    }
  });

  // Get all catalog entries
  app.get("/api/catalog", async (req, res) => {
    try {
      const catalog = await storage.getWineCatalog();
      res.json(catalog);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch wine catalog" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
