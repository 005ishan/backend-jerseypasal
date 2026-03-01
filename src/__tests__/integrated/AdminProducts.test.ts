import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../app";
import { Product } from "../../models/product.model";
import { UserModel } from "../../models/user.model";
import { JWT_SECRET } from "../../config";

let adminToken: string;
let seededProductId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve),
    );
  }
  await UserModel.deleteMany({ email: /prodtest_admin/i });
  await Product.deleteMany({ name: /prodtest_/i });

  const admin = await UserModel.create({
    email: "prodtest_admin@test.com",
    password: "hashed_irrelevant",
    role: "admin",
  });
  adminToken = jwt.sign(
    { _id: admin._id, email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  const product = await Product.create({
    name: "prodtest_Barcelona Home Jersey",
    price: 89.99,
    category: "club",
    sizes: ["S", "M", "L", "XL"],
  });
  seededProductId = product._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await UserModel.deleteMany({ email: /prodtest_admin/i });
    await Product.deleteMany({ name: /prodtest_/i });
  }
});

// ─────────────────────────────────────────────

describe("POST /admin/products — Create Product", () => {
  // TC-PROD-01
  it("TC-PROD-01: admin creates a product and returns 201 with product data", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "prodtest_Brazil Away Jersey",
        price: 74.99,
        category: "country",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("prodtest_Brazil Away Jersey");
  });

  // TC-PROD-02
  it("TC-PROD-02: returns 500 when product name is missing (required field)", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 50, category: "club" });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  // TC-PROD-03
  it("TC-PROD-03: returns 500 when category is an invalid enum value", async () => {
    const res = await request(app)
      .post("/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "prodtest_Bad Category", price: 60, category: "league" });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /admin/products — Retrieve Products", () => {
  // TC-PROD-04
  it("TC-PROD-04: retrieves all products and returns a non-empty array", async () => {
    const res = await request(app)
      .get("/admin/products")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // TC-PROD-05
  it("TC-PROD-05: filters by category=club and only returns club jerseys", async () => {
    const res = await request(app)
      .get("/admin/products?category=club")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((p: any) => expect(p.category).toBe("club"));
  });

  // TC-PROD-06
  it("TC-PROD-06: filters by category=country and only returns country jerseys", async () => {
    const res = await request(app)
      .get("/admin/products?category=country")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((p: any) => expect(p.category).toBe("country"));
  });

  // TC-PROD-07
  it("TC-PROD-07: retrieves a single product by ID", async () => {
    const res = await request(app)
      .get(`/admin/products/${seededProductId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(seededProductId);
  });

  // TC-PROD-08
  it("TC-PROD-08: returns 404 for a non-existent product ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/admin/products/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT & DELETE /admin/products/:id", () => {
  // TC-PROD-09
  it("TC-PROD-09: admin updates a product price and returns the updated document", async () => {
    const res = await request(app)
      .put(`/admin/products/${seededProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 99.99 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(99.99);
  });

  // TC-PROD-10
  it("TC-PROD-10: admin deletes a product and it no longer exists in DB", async () => {
    const tmp = await Product.create({
      name: "prodtest_Temp Delete Jersey",
      price: 45,
      category: "club",
    });
    const res = await request(app)
      .delete(`/admin/products/${tmp._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Product deleted");

    const gone = await Product.findById(tmp._id);
    expect(gone).toBeNull();
  });
});
