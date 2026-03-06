/**
 * CART & FAVOURITES INTEGRATION TESTS — 14 Tests
 * File: __tests__/integration/cart.test.ts
 *
 * All data created during tests is deleted immediately after each test.
 * Safe to run against your real MongoDB.
 */

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { Product } from "../../models/product.model";
import { JWT_SECRET } from "../../config";

const TAG = "carttest_";

let userToken: string;
let userId: string;
let productId: string;
let productId2: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
  }
  await UserModel.deleteMany({ email: new RegExp(TAG) });
  await Product.deleteMany({ name: new RegExp(TAG) });

  const user = await UserModel.create({
    email: `${TAG}user@test.com`,
    password: "hashed_irrelevant",
    role: "user",
    cart: [],
    favourites: [],
  });
  userId = user._id.toString();
  userToken = jwt.sign(
    { _id: user._id, email: user.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const product = await Product.create({
    name: `${TAG}Man United Home Jersey`,
    price: 84.99,
    category: "club",
    sizes: ["S", "M", "L", "XL", "XXL"],
  });
  productId = product._id.toString();

  const product2 = await Product.create({
    name: `${TAG}Real Madrid Away Jersey`,
    price: 79.99,
    category: "club",
    sizes: ["S", "M", "L"],
  });
  productId2 = product2._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await UserModel.deleteMany({ email: new RegExp(TAG) });
    await Product.deleteMany({ name: new RegExp(TAG) });
  }
});

// Helper to clear cart between tests
const clearCart = async () =>
  UserModel.updateOne({ _id: userId }, { $set: { cart: [] } });

const clearFavourites = async () =>
  UserModel.updateOne({ _id: userId }, { $set: { favourites: [] } });

// ═══════════════════════════════════════════════════════════════════════════════
// CART — ADD
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/users/:userId/cart — Add to Cart", () => {
  afterEach(async () => clearCart());

  // TC-CART-01
  it("TC-CART-01: user adds a product to cart and gets back updated cart array", async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2, size: "M" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const item = res.body.find(
      (i: any) => i.product?.toString() === productId && i.size === "M"
    );
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
  });

  // TC-CART-02
  it("TC-CART-02: adding same product+size increments quantity, does not duplicate", async () => {
    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2, size: "L" });

    const res = await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 3, size: "L" });

    expect(res.status).toBe(200);
    const items = res.body.filter((i: any) => {
      const p = i.product?._id ?? i.product;
      return p?.toString() === productId && i.size === "L";
    });
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(5);
  });

  // TC-CART-03
  it("TC-CART-03: adding different sizes creates separate cart entries", async () => {
    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "S" });

    const res = await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "M" });

    expect(res.status).toBe(200);
    const entries = res.body.filter(
      (i: any) => (i.product?._id ?? i.product)?.toString() === productId
    );
    expect(entries.length).toBe(2);
  });

  // TC-CART-04
  it("TC-CART-04: returns 4xx or 5xx when size is not a valid enum (XXXL)", async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "XXXL" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // TC-CART-05
  it("TC-CART-05: returns 4xx or 5xx when quantity is less than 1", async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 0, size: "S" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // TC-CART-06
  it("TC-CART-06: returns 4xx or 5xx when productId is missing", async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 1, size: "S" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CART — GET, PUT, DELETE
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET, PUT, DELETE /api/users/:userId/cart — Manage Cart", () => {
  afterEach(async () => clearCart());

  // TC-CART-07
  it("TC-CART-07: GET cart returns array with current items", async () => {
    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "S" });

    const res = await request(app).get(`/api/users/${userId}/cart`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // TC-CART-08
  it("TC-CART-08: GET cart returns empty array when cart is empty", async () => {
    const res = await request(app).get(`/api/users/${userId}/cart`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // TC-CART-09
  it("TC-CART-09: PUT cart updates quantity of an existing item", async () => {
    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "XL" });

    const res = await request(app)
      .put(`/api/users/${userId}/cart`)
      .send({ productId, size: "XL", quantity: 10 });

    expect(res.status).toBe(200);
    const updated = res.body.find(
      (i: any) => i.product?.toString() === productId && i.size === "XL"
    );
    expect(updated?.quantity).toBe(10);
  });

  // TC-CART-10
  it("TC-CART-10: DELETE cart item removes only the matching product+size", async () => {
    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "M" });

    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1, size: "XXL" });

    const res = await request(app)
      .delete(`/api/users/${userId}/cart`)
      .send({ productId, size: "XXL" });

    expect(res.status).toBe(200);
    const removed = res.body.find(
      (i: any) => i.product?.toString() === productId && i.size === "XXL"
    );
    expect(removed).toBeUndefined();

    // M size should still be there
    const remaining = res.body.find(
      (i: any) => i.product?.toString() === productId && i.size === "M"
    );
    expect(remaining).toBeDefined();
  });

  // TC-CART-11
  it("TC-CART-11: DELETE /cart/clear empties the entire cart", async () => {
    await request(app)
      .post(`/api/users/${userId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2, size: "M" });

    const res = await request(app)
      .delete(`/api/users/${userId}/cart/clear`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await UserModel.findById(userId);
    expect(user?.cart.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FAVOURITES
// ═══════════════════════════════════════════════════════════════════════════════

describe("Favourites — POST /api/users/:userId/favourite", () => {
  afterEach(async () => clearFavourites());

  // TC-FAV-01
  it("TC-FAV-01: POST toggle adds product to favourites", async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const fav = res.body.find((f: any) => f.product?.toString() === productId);
    expect(fav).toBeDefined();
  });

  // TC-FAV-02
  it("TC-FAV-02: POST toggle again removes product from favourites", async () => {
    await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId });

    const res = await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId });

    expect(res.status).toBe(200);
    const fav = res.body.find((f: any) => f.product?.toString() === productId);
    expect(fav).toBeUndefined();
  });

  // TC-FAV-03
  it("TC-FAV-03: favourites list is empty in DB after toggling off", async () => {
    await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId });
    await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId });

    const user = await UserModel.findById(userId);
    expect(user?.favourites.length).toBe(0);
  });

  // TC-FAV-04
  it("TC-FAV-04: multiple products can be added to favourites independently", async () => {
    await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId });
    await request(app)
      .post(`/api/users/${userId}/favourite`)
      .send({ productId: productId2 });

    const user = await UserModel.findById(userId);
    expect(user?.favourites.length).toBe(2);
  });
});