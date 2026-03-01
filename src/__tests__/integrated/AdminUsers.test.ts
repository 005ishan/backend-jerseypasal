import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { JWT_SECRET } from "../../config";

let adminToken: string;
let userToken: string;
let seededUserId: string;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise<void>((resolve) =>
      mongoose.connection.once("connected", resolve)
    );
  }
  await UserModel.deleteMany({ email: /admusr_test_/i });

  const admin = await UserModel.create({
    email: "admusr_test_admin@test.com",
    password: "hashed_irrelevant",
    role: "admin",
  });
  adminToken = jwt.sign(
    { _id: admin._id, email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const user = await UserModel.create({
    email: "admusr_test_seeded@test.com",
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
    await UserModel.deleteMany({ email: /admusr_test_/i });
  }
});

// ─────────────────────────────────────────────

describe("POST /api/admin/users — Create User", () => {
  // TC-ADMUSER-01
  it("TC-ADMUSER-01: admin creates a new user and returns 201", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "admusr_test_created@test.com",
        password: "Password1!",
        confirmPassword: "Password1!",
        role: "user",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User Created");
  });

  // TC-ADMUSER-02
  it("TC-ADMUSER-02: returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "admusr_test_incomplete@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TC-ADMUSER-03
  it("TC-ADMUSER-03: returns 403 when non-admin user tries to create a user", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        email: "admusr_test_sneaky@test.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/admin/users — Retrieve Users", () => {
  // TC-ADMUSER-04
  it("TC-ADMUSER-04: returns paginated user list with pagination metadata", async () => {
    const res = await request(app)
      .get("/api/admin/users?page=1&size=5")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, size: 5 });
  });

  // TC-ADMUSER-05
  it("TC-ADMUSER-05: admin can search users by email keyword", async () => {
    const res = await request(app)
      .get("/api/admin/users?search=admusr_test_seeded")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].email).toContain("admusr_test_seeded");
  });

  // TC-ADMUSER-06
  it("TC-ADMUSER-06: admin retrieves a single user by ID", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${seededUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(seededUserId);
    expect(res.body.message).toBe("Single User Retrieved");
  });

  // TC-ADMUSER-07
  it("TC-ADMUSER-07: returns 404 for a non-existent user ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/admin/users/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // TC-ADMUSER-08
  it("TC-ADMUSER-08: returns 401 when no Authorization header is provided", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT & DELETE /api/admin/users/:id", () => {
  // TC-ADMUSER-09
  it("TC-ADMUSER-09: admin updates a user email and returns updated data", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${seededUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "admusr_test_updated@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("admusr_test_updated@test.com");
    expect(res.body.message).toBe("User Updated");
  });

  // TC-ADMUSER-10
  it("TC-ADMUSER-10: admin deletes a user and confirms removal from DB", async () => {
    const tmp = await UserModel.create({
      email: "admusr_test_deleteme@test.com",
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
  });
});