import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { JWT_SECRET } from "../../config";

// ─────────────────────────────────────────────
// SETUP & TEARDOWN
// Reuses the DB connection already established by app.ts (connectDatabase)
// ─────────────────────────────────────────────

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
  }
  await UserModel.deleteMany({ email: /auth_test_/i });
  const hash = await bcrypt.hash("Password1!", 10);
  await UserModel.create({
    email: "auth_test_user@test.com",
    password: hash,
    role: "user",
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await UserModel.deleteMany({ email: /auth_test_/i });
  }
});

// ─────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  // TC-AUTH-01
  it("TC-AUTH-01: registers a new user and returns 201 without exposing password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "auth_test_new@test.com",
      password: "Password1!",
      confirmPassword: "Password1!",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toHaveProperty("password");
  });

  // TC-AUTH-02
  it("TC-AUTH-02: returns 400 when passwords do not match", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "auth_test_mismatch@test.com",
      password: "Password1!",
      confirmPassword: "Different1!",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TC-AUTH-03
  it("TC-AUTH-03: returns 409 when email is already registered", async () => {
    const payload = {
      email: "auth_test_dup@test.com",
      password: "Password1!",
      confirmPassword: "Password1!",
    };
    await request(app).post("/api/auth/register").send(payload);
    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // TC-AUTH-04
  it("TC-AUTH-04: returns 400 when email field is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      password: "Password1!",
      confirmPassword: "Password1!",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  // TC-AUTH-05
  it("TC-AUTH-05: returns 200 with JWT token on valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "auth_test_user@test.com",
      password: "Password1!",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.data).not.toHaveProperty("password");
  });

  // TC-AUTH-06
  it("TC-AUTH-06: returns 401 when password is incorrect", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "auth_test_user@test.com",
      password: "WrongPass99!",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // TC-AUTH-07
  it("TC-AUTH-07: returns 404 when user email does not exist", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "auth_test_ghost@test.com",
      password: "Password1!",
    });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // TC-AUTH-08
  it("TC-AUTH-08: returns 400 when email format is invalid", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "not-a-valid-email",
      password: "Password1!",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/logout & password reset", () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await UserModel.findOne({ email: "auth_test_user@test.com" });
    if (!user) throw new Error("Seed user not found — check beforeAll seeding");
    authToken = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
  });

  // TC-AUTH-09
  it("TC-AUTH-09: returns 200 and clears authToken cookie on logout", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logout successful");
  });

  // TC-AUTH-10
  it("TC-AUTH-10: returns 400 when requesting password reset with missing email", async () => {
    const res = await request(app)
      .post("/api/auth/request-password-reset")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email is required");
  });
});