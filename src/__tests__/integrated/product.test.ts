// src/__tests__/integrated/product.test.ts
import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";

describe("Product Integration Tests - Minimal Real Tests", () => {
  let createdProductId: string;

  afterAll(async () => {
    // Clean up DB and close connection
    if (createdProductId) {
      await request(app).delete(`/admin/products/${createdProductId}`);
    }
    await mongoose.connection.close();
  });

  test("create a product successfully", async () => {
    const res = await request(app).post("/admin/products").send({
      name: "Test Product",
      price: 100,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe("Test Product");

    createdProductId = res.body.data._id; // save for other tests
  });

  test("get product by ID", async () => {
    const res = await request(app).get(
      `/admin/products/${createdProductId}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(createdProductId);
  });

  test("update product successfully", async () => {
    const res = await request(app)
      .put(`/admin/products/${createdProductId}`)
      .send({ price: 150 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(150);
  });

  test("get all products includes created product", async () => {
    const res = await request(app).get("/admin/products");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((p: any) => p._id === createdProductId)).toBe(
      true,
    );
  });

  test("delete product successfully", async () => {
    const res = await request(app).delete(
      `/admin/products/${createdProductId}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify product no longer exists
    const checkRes = await request(app).get(
      `/admin/products/${createdProductId}`,
    );
    expect(checkRes.status).toBe(404);
  });
});
