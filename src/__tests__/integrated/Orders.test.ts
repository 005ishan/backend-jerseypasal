/**
 * ORDERS INTEGRATION TESTS — 12 Tests
 * File: __tests__/integration/orders.test.ts
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
import { OrderModel } from "../../models/order.model";
import { JWT_SECRET } from "../../config";

const TAG = "ordtest_";

let adminToken: string;
let userToken: string;
let userId: string;
let userObjectId: mongoose.Types.ObjectId;
let productId: string;
let productObjectId: mongoose.Types.ObjectId;
let seededOrderId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
  }
  await UserModel.deleteMany({ email: new RegExp(TAG) });
  await Product.deleteMany({ name: new RegExp(TAG) });
  await OrderModel.deleteMany({ transactionId: new RegExp(TAG) });

  const admin = await UserModel.create({
    email: `${TAG}admin@test.com`,
    password: "hashed_irrelevant",
    role: "admin",
  });
  adminToken = jwt.sign(
    { _id: admin._id, email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const user = await UserModel.create({
    email: `${TAG}user@test.com`,
    password: "hashed_irrelevant",
    role: "user",
  });
  userId = user._id.toString();
  userObjectId = user._id as mongoose.Types.ObjectId;
  userToken = jwt.sign(
    { _id: user._id, email: user.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const product = await Product.create({
    name: `${TAG}Argentina World Cup Jersey`,
    price: 94.99,
    category: "country",
    sizes: ["S", "M", "L"],
  });
  productId = product._id.toString();
  productObjectId = product._id as mongoose.Types.ObjectId;

  const order = await OrderModel.create({
    userId: user._id,
    transactionId: `${TAG}seed_txn_001`,
    items: [{
      productId: product._id,
      productName: `${TAG}Argentina World Cup Jersey`,
      size: "L",
      quantity: 1,
      price: 94.99,
    }],
    totalAmount: 94.99,
    status: "pending",
  });
  seededOrderId = order._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await OrderModel.deleteMany({ transactionId: new RegExp(TAG) });
    await UserModel.deleteMany({ email: new RegExp(TAG) });
    await Product.deleteMany({ name: new RegExp(TAG) });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE ORDER
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/orders — Create Order", () => {
  // TC-ORD-01
  it("TC-ORD-01: authenticated user creates an order and gets 201 with status=pending", async () => {
    const txnId = `${TAG}txn_tc01`;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId,
        transactionId: txnId,
        items: [{ productId, productName: `${TAG}Argentina World Cup Jersey`, size: "M", quantity: 2, price: 94.99 }],
        totalAmount: 189.98,
      });
    expect(res.status).toBe(201);
    expect(res.body.userId.toString()).toBe(userId);
    expect(res.body.status).toBe("pending");
    await OrderModel.deleteOne({ transactionId: txnId }); // self-clean
  });

  // TC-ORD-02
  it("TC-ORD-02: order always defaults to status=pending regardless of payload", async () => {
    const txnId = `${TAG}txn_tc02`;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId,
        transactionId: txnId,
        items: [{ productId, productName: `${TAG}Argentina World Cup Jersey`, size: "S", quantity: 1, price: 94.99 }],
        totalAmount: 94.99,
        status: "delivered", // should be ignored
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    await OrderModel.deleteOne({ transactionId: txnId }); // self-clean
  });

  // TC-ORD-03
  it("TC-ORD-03: returns 401 when unauthenticated user tries to create an order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ userId, transactionId: `${TAG}txn_noauth`, items: [], totalAmount: 0 });
    expect(res.status).toBe(401);
  });

  // TC-ORD-04
  it("TC-ORD-04: order response contains correct userId and totalAmount", async () => {
    const txnId = `${TAG}txn_tc04`;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId,
        transactionId: txnId,
        items: [{ productId, productName: `${TAG}Argentina World Cup Jersey`, size: "L", quantity: 1, price: 94.99 }],
        totalAmount: 94.99,
      });
    expect(res.status).toBe(201);
    expect(res.body.userId.toString()).toBe(userId);
    expect(res.body.totalAmount).toBe(94.99);
    await OrderModel.deleteOne({ transactionId: txnId }); // self-clean
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET USER ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/orders/:userId — Customer Orders", () => {
  // TC-ORD-05
  it("TC-ORD-05: user retrieves only their own orders", async () => {
    const res = await request(app)
      .get(`/api/orders/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((order: any) =>
      expect(order.userId.toString()).toBe(userId)
    );
  });

  // TC-ORD-06
  it("TC-ORD-06: returns empty array for a user with no orders", async () => {
    const fresh = await UserModel.create({
      email: `${TAG}noorders@test.com`,
      password: "hashed",
      role: "user",
    });
    const freshToken = jwt.sign(
      { _id: fresh._id, email: fresh.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    const res = await request(app)
      .get(`/api/orders/${fresh._id}`)
      .set("Authorization", `Bearer ${freshToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    await UserModel.deleteOne({ _id: fresh._id }); // self-clean
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Admin Orders — GET & PATCH /api/admin/orders", () => {
  // TC-ORD-07
  it("TC-ORD-07: admin retrieves all orders successfully", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // TC-ORD-08
  it("TC-ORD-08: returns 403 when non-admin tries to access admin orders", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  // TC-ORD-09
  it("TC-ORD-09: admin updates order status from pending to processing", async () => {
    const order = await OrderModel.create({
      userId: userObjectId,
      transactionId: `${TAG}txn_tc09`,
      items: [{ productId: productObjectId, productName: `${TAG}Argentina World Cup Jersey`, size: "M", quantity: 1, price: 94.99 }],
      totalAmount: 94.99,
      status: "pending",
    });
    const res = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processing");
    await OrderModel.deleteOne({ _id: order._id }); // self-clean
  });

  // TC-ORD-10
  it("TC-ORD-10: admin updates order status to delivered", async () => {
    const order = await OrderModel.create({
      userId: userObjectId,
      transactionId: `${TAG}txn_tc10`,
      items: [{ productId: productObjectId, productName: `${TAG}Argentina World Cup Jersey`, size: "L", quantity: 1, price: 94.99 }],
      totalAmount: 94.99,
      status: "processing",
    });
    const res = await request(app)
      .patch(`/api/admin/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("delivered");
    await OrderModel.deleteOne({ _id: order._id }); // self-clean
  });

  // TC-ORD-11
  it("TC-ORD-11: returns 400 when status is not a valid enum value", async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${seededOrderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid status");
  });

  // TC-ORD-12
  it("TC-ORD-12: returns 404 when updating status of a non-existent order", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/admin/orders/${fakeId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });
});