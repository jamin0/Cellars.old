CREATE TABLE "wine_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"wine" text,
	"sub_type" text,
	"producer" text,
	"region" text,
	"country" text
);
--> statement-breakpoint
CREATE TABLE "wines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"wine" text,
	"sub_type" text,
	"producer" text,
	"region" text,
	"country" text,
	"description" text,
	"stock_level" integer DEFAULT 0,
	"vintage_stocks" json DEFAULT '[]'::json,
	"image_url" text,
	"created_at" text DEFAULT '2025-05-21T01:00:51.146Z'
);
