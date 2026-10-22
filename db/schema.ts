import {
  mysqlTable,
  mysqlEnum,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: varchar("description", { length: 280 }),
  imageKey: varchar("image_key", { length: 512 }),
  active: boolean("active").notNull().default(true),
  position: int("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const brands = mysqlTable("brands", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  logoKey: varchar("logo_key", { length: 512 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  brandId: int("brand_id"),
  categoryId: int("category_id"),
  price: int("price").notNull().default(0),
  oldPrice: int("old_price"),
  currency: varchar("currency", { length: 8 }).notNull().default("FCFA"),
  availability: mysqlEnum("availability", [
    "disponible",
    "indisponible",
    "bientot",
  ])
    .notNull()
    .default("disponible"),
  condition: mysqlEnum("condition", ["neuf", "occasion"])
    .notNull()
    .default("neuf"),
  storage: varchar("storage", { length: 40 }),
  color: varchar("color", { length: 60 }),
  batteryHealth: int("battery_health"),
  warranty: varchar("warranty", { length: 160 }),
  specifications: text("specifications"), // JSON: [{key, value}]
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const productImages = mysqlTable(
  "product_images",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("product_id").notNull(),
    imageKey: varchar("image_key", { length: 512 }).notNull(),
    alt: varchar("alt", { length: 200 }),
    position: int("position").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_position").on(t.productId, t.position)],
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value"),
});

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin"]).notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  content: text("content").notNull(),
  source: mysqlEnum("source", ["boutique", "whatsapp"]).notNull(),
  dateLabel: varchar("date_label", { length: 40 }),
  status: mysqlEnum("status", ["draft", "pending", "published", "archived"])
    .notNull()
    .default("draft"),
  publicationConsent: boolean("publication_consent").notNull().default(false),
  consentConfirmedAt: timestamp("consent_confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
