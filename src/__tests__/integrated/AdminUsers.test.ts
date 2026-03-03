/**
 * ADMIN USERS INTEGRATION TESTS — 12 Tests
 * File: __tests__/integration/adminUsers.test.ts
 *
 * All data created during tests is deleted immediately after each test.
 * Safe to run against your real MongoDB.
 */

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { JWT_SECRET } from "../../config";

const TAG = "admusr_";

let adminToken: string;
let userToken: string;
let seededUserId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
  }
  await UserModel.deleteMany({ email: new RegExp(TAG) });

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
    email: `${TAG}seeded@test.com`,
    password: "hashed_irrelevant",
    role: "user",
  });
  seededUserId = user._id.toString();
  userToken = jwt.sign(
    { _id: user._id, email: user.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await UserModel.deleteMany({ email: new RegExp(TAG) });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/admin/users — Create User", () => {
  // TC-ADMUSER-01
  it("TC-ADMUSER-01: admin creates a new user and returns 201", async () => {
    const email = `${TAG}created01@test.com`;
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, password: "Password1!", confirmPassword: "Password1!", role: "user" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User Created");
    await UserModel.deleteOne({ email }); // self-clean
  });

  // TC-ADMUSER-02
  it("TC-ADMUSER-02: returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: `${TAG}incomplete@test.com` });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TC-ADMUSER-03
  it("TC-ADMUSER-03: returns 403 when non-admin user tries to create a user", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        email: `${TAG}sneaky@test.com`,
        password: "Password1!",
        confirmPassword: "Password1!",
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TC-ADMUSER-04
  it("TC-ADMUSER-04: admin can create a user with role=admin", async () => {
    const email = `${TAG}newadmin@test.com`;
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, password: "Password1!", confirmPassword: "Password1!", role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    await UserModel.deleteOne({ email }); // self-clean
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/admin/users — Retrieve Users", () => {
  // TC-ADMUSER-05
  it("TC-ADMUSER-05: returns paginated user list with pagination metadata", async () => {
    const res = await request(app)
      .get("/api/admin/users?page=1&size=5")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, size: 5 });
  });

  // TC-ADMUSER-06
  it("TC-ADMUSER-06: admin can search users by email keyword", async () => {
    const res = await request(app)
      .get(`/api/admin/users?search=${TAG}seeded`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].email).toContain(`${TAG}seeded`);
  });

  // TC-ADMUSER-07
  it("TC-ADMUSER-07: admin retrieves a single user by ID", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${seededUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(seededUserId);
    expect(res.body.message).toBe("Single User Retrieved");
  });

  // TC-ADMUSER-08
  it("TC-ADMUSER-08: returns 404 for a non-existent user ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/admin/users/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // TC-ADMUSER-09
  it("TC-ADMUSER-09: returns 401 when no Authorization header is provided", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE & DELETE
// ═══════════════════════════════════════════════════════════════════════════════

describe("PUT & DELETE /api/admin/users/:id", () => {
  // TC-ADMUSER-10
  it("TC-ADMUSER-10: admin updates a user email and returns updated data", async () => {
    const tmp = await UserModel.create({
      email: `${TAG}updateme@test.com`,
      password: "hashed",
      role: "user",
    });
    const updatedEmail = `${TAG}updated@test.com`;
    const res = await request(app)
      .put(`/api/admin/users/${tmp._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: updatedEmail });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(updatedEmail);
    expect(res.body.message).toBe("User Updated");
    await UserModel.deleteOne({ _id: tmp._id }); // self-clean
  });

  // TC-ADMUSER-11
  it("TC-ADMUSER-11: admin deletes a user and confirms removal from DB", async () => {
    const tmp = await UserModel.create({
      email: `${TAG}deleteme@test.com`,
      password: "hashed",
      role: "user",
    });
    const res = await request(app)
      .delete(`/api/admin/users/${tmp._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User Deleted");
    const gone = await UserModel.findById(tmp._id);
    expect(gone).toBeNull();
    // Already deleted by the route — nothing to clean
  });

  // TC-ADMUSER-12
  it("TC-ADMUSER-12: returns 403 when non-admin tries to delete a user", async () => {
    const tmp = await UserModel.create({
      email: `${TAG}protected@test.com`,
      password: "hashed",
      role: "user",
    });
    const res = await request(app)
      .delete(`/api/admin/users/${tmp._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    await UserModel.deleteOne({ _id: tmp._id }); // self-clean
  });
});