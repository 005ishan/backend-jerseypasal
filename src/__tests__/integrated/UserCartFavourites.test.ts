import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { Product } from "../../models/product.model";
import { JWT_SECRET } from "../../config";

let userToken: string;
let testUserId: string;
let testProductId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve),
    );
  }
  await UserModel.deleteMany({ email: /carttest_/i });
  await Product.deleteMany({ name: /carttest_/i });

  const user = await UserModel.create({
    email: "carttest_user@test.com",
    password: "hashed_irrelevant",
    role: "user",
    cart: [],
    favourites: [],
  });
  testUserId = user._id.toString();
  userToken = jwt.sign(
    { _id: user._id, email: user.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  const product = await Product.create({
    name: "carttest_Man United Home Jersey",
    price: 84.99,
    category: "club",
    sizes: ["S", "M", "L", "XL", "XXL"],
  });
  testProductId = product._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await UserModel.deleteMany({ email: /carttest_/i });
    await Product.deleteMany({ name: /carttest_/i });
  }
});

// ─────────────────────────────────────────────

describe("POST /api/users/:userId/cart — Add to Cart", () => {
  // TC-CART-01
  it("TC-CART-01: user adds a product to cart and gets back updated cart array", async () => {
    const res = await request(app)
      .post(`/api/users/${testUserId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId: testProductId, quantity: 2, size: "M" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const item = res.body.find(
      (i: any) => i.product?.toString() === testProductId && i.size === "M",
    );
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
  });

  // TC-CART-02
  it("TC-CART-02: adding same product+size increments quantity, does not duplicate", async () => {
    // Add 3 more units of the same product+size that TC-CART-01 already added (qty 2)
    const addRes = await request(app)
      .post(`/api/users/${testUserId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId: testProductId, quantity: 3, size: "M" });

    expect(addRes.status).toBe(200);

    // The response from addToCart is the raw cart array (product as ObjectId string)
    const items = addRes.body.filter((i: any) => {
      const productField = i.product?._id ?? i.product; // handle populated or plain
      return productField?.toString() === testProductId && i.size === "M";
    });
    expect(items.length).toBe(1); // no duplicate row
    expect(items[0].quantity).toBe(5); // 2 (from TC-01) + 3
  });

  // TC-CART-03
  // UserController uses addToCartDTO.parse() (throws, not safeParse) — unhandled = 500
  it("TC-CART-03: returns 4xx or 5xx when size is not a valid enum (e.g. XXXL)", async () => {
    const res = await request(app)
      .post(`/api/users/${testUserId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId: testProductId, quantity: 1, size: "XXXL" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // TC-CART-04
  // UserController uses addToCartDTO.parse() (throws, not safeParse) — unhandled = 500
  it("TC-CART-04: returns 4xx or 5xx when quantity is less than 1", async () => {
    const res = await request(app)
      .post(`/api/users/${testUserId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId: testProductId, quantity: 0, size: "S" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("GET, PUT, DELETE /api/users/:userId/cart — Manage Cart", () => {
  // TC-CART-05
  it("TC-CART-05: GET cart returns array with current items", async () => {
    const res = await request(app).get(`/api/users/${testUserId}/cart`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // TC-CART-06
  it("TC-CART-06: PUT cart updates quantity of an existing item", async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}/cart`)
      .send({ productId: testProductId, size: "M", quantity: 10 });
    expect(res.status).toBe(200);
    const updated = res.body.find(
      (i: any) => i.product?.toString() === testProductId && i.size === "M",
    );
    expect(updated?.quantity).toBe(10);
  });

  // TC-CART-07
  it("TC-CART-07: DELETE cart item removes only the matching product+size", async () => {
    // Add a separate item to remove
    await request(app)
      .post(`/api/users/${testUserId}/cart`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId: testProductId, quantity: 1, size: "XL" });

    const res = await request(app)
      .delete(`/api/users/${testUserId}/cart`)
      .send({ productId: testProductId, size: "XL" });
    expect(res.status).toBe(200);

    const removed = res.body.find(
      (i: any) => i.product?.toString() === testProductId && i.size === "XL",
    );
    expect(removed).toBeUndefined();
  });

  // TC-CART-08
  it("TC-CART-08: DELETE /cart/clear empties the entire cart", async () => {
    const res = await request(app)
      .delete(`/api/users/${testUserId}/cart/clear`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await UserModel.findById(testUserId);
    expect(user?.cart.length).toBe(0);
  });
});

describe("Favourites /api/users/:userId/favourite", () => {
  // TC-FAV-09
  it("TC-FAV-09: POST toggle adds product to favourites", async () => {
    const res = await request(app)
      .post(`/api/users/${testUserId}/favourite`)
      .send({ productId: testProductId });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const fav = res.body.find(
      (f: any) => f.product?.toString() === testProductId,
    );
    expect(fav).toBeDefined();
  });

  // TC-FAV-10
  it("TC-FAV-10: POST toggle again removes product from favourites", async () => {
    const res = await request(app)
      .post(`/api/users/${testUserId}/favourite`)
      .send({ productId: testProductId });
    expect(res.status).toBe(200);
    const fav = res.body.find(
      (f: any) => f.product?.toString() === testProductId,
    );
    expect(fav).toBeUndefined();
  });
});
