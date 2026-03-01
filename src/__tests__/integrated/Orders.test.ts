import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { Product } from "../../models/product.model";
import { OrderModel } from "../../models/order.model";
import { JWT_SECRET } from "../../config";

let adminToken: string;
let userToken: string;
let testUserId: string;
let testProductId: string;
let testOrderId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve),
    );
  }
  await UserModel.deleteMany({ email: /ordtest_/i });
  await Product.deleteMany({ name: /ordtest_/i });

  const admin = await UserModel.create({
    email: "ordtest_admin@test.com",
    password: "hashed_irrelevant",
    role: "admin",
  });
  adminToken = jwt.sign(
    { _id: admin._id, email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  const user = await UserModel.create({
    email: "ordtest_user@test.com",
    password: "hashed_irrelevant",
    role: "user",
  });
  testUserId = user._id.toString();
  userToken = jwt.sign(
    { _id: user._id, email: user.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  const product = await Product.create({
    name: "ordtest_Argentina World Cup Jersey",
    price: 94.99,
    category: "country",
    sizes: ["S", "M", "L"],
  });
  testProductId = product._id.toString();

  // Seed one order for update/status tests
  const order = await OrderModel.create({
    userId: user._id,
    transactionId: "ordtest_seed_txn_001",
    items: [
      {
        productId: product._id,
        productName: "ordtest_Argentina World Cup Jersey",
        size: "L",
        quantity: 1,
        price: 94.99,
      },
    ],
    totalAmount: 94.99,
    status: "pending",
  });
  testOrderId = order._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await OrderModel.deleteMany({ transactionId: /ordtest_/ });
    await UserModel.deleteMany({ email: /ordtest_/i });
    await Product.deleteMany({ name: /ordtest_/i });
  }
});

// ─────────────────────────────────────────────

describe("POST /api/orders — Create Order", () => {
  // TC-ORD-01
  it("TC-ORD-01: authenticated user creates an order and gets 201 with status=pending", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: testUserId,
        transactionId: "ordtest_txn_new_001",
        items: [
          {
            productId: testProductId,
            productName: "ordtest_Argentina World Cup Jersey",
            size: "M",
            quantity: 2,
            price: 94.99,
          },
        ],
        totalAmount: 189.98,
      });
    expect(res.status).toBe(201);
    expect(res.body.userId.toString()).toBe(testUserId);
    expect(res.body.status).toBe("pending");
  });

  // TC-ORD-02
  it("TC-ORD-02: order always defaults to status=pending on creation", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: testUserId,
        transactionId: "ordtest_txn_default_002",
        items: [
          {
            productId: testProductId,
            productName: "ordtest_Argentina World Cup Jersey",
            size: "S",
            quantity: 1,
            price: 94.99,
          },
        ],
        totalAmount: 94.99,
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
  });

  // TC-ORD-03
  it("TC-ORD-03: returns 401 when unauthenticated user tries to create an order", async () => {
    const res = await request(app).post("/api/orders").send({
      userId: testUserId,
      transactionId: "ordtest_txn_noauth",
      items: [],
      totalAmount: 0,
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/orders/:userId — Customer Orders", () => {
  // TC-ORD-04
  it("TC-ORD-04: user retrieves only their own orders", async () => {
    const res = await request(app)
      .get(`/api/orders/${testUserId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((order: any) =>
      expect(order.userId.toString()).toBe(testUserId),
    );
  });

  // TC-ORD-05
  it("TC-ORD-05: returns empty array for a user with no orders", async () => {
    const fresh = await UserModel.create({
      email: "ordtest_noorders@test.com",
      password: "hashed",
      role: "user",
    });
    const freshToken = jwt.sign(
      { _id: fresh._id, email: fresh.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    const res = await request(app)
      .get(`/api/orders/${fresh._id}`)
      .set("Authorization", `Bearer ${freshToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("Admin Orders — GET & PATCH", () => {
  // TC-ORD-06
  it("TC-ORD-06: admin retrieves all orders successfully", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // TC-ORD-07
  it("TC-ORD-07: returns 403 when non-admin tries to access admin orders", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  // TC-ORD-08
  it("TC-ORD-08: admin updates order status from pending to processing", async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${testOrderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "processing" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processing");
  });

  // TC-ORD-09
  it("TC-ORD-09: returns 400 when status is not a valid enum value", async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${testOrderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "cancelled" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid status");
  });

  // TC-ORD-10
  it("TC-ORD-10: returns 404 when updating status of a non-existent order", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/admin/orders/${fakeId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "delivered" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });
});
