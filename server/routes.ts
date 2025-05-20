import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWineSchema } from "@shared/schema";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Wine Inventory API Routes
  // Get all wines
  app.get("/api/wines", async (req, res) => {
    try {
      const wines = await storage.getWines();
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

  // Get wines by category
  app.get("/api/wines/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const wines = await storage.getWinesByCategory(category);
      res.json(wines);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch wines by category" });
    }
  });

  // Add a new wine
  app.post("/api/wines", async (req, res) => {
    try {
      const parseResult = insertWineSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid wine data", 
          errors: parseResult.error.format() 
        });
      }

      const newWine = await storage.addWine(parseResult.data);
      res.status(201).json(newWine);
    } catch (err) {
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
      res.status(500).json({ message: "Failed to update wine" });
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
