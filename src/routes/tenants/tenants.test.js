const supertest = require("supertest");
const app = require("../../server");
const admin = require("../../lib/admin");

const { Db, Models } = require("../../test-utils");

const request = supertest(app);

beforeEach(async () => {
  await Db.reset();
});

afterAll(async () => {
  await Db.destroyConn();
});

const defaultLandlord = Models.createLandlord();

const testFixture = async () => {
  const users = await Db.insertUsers([defaultLandlord]);

  const properties = await Db.insertProperties([Models.createProperty()]);

  return { landlord: users[0], properties };
};

const mockVerifyId = (email = defaultLandlord.email) =>
  admin.verifyIdToken.mockResolvedValue({ email });

describe("POST /api/tenants", () => {
  const endpoint = "/api/tenants";

  it("should return a status of 201 when successfully creating a tenant", async () => {
    await testFixture();
    const fakeToken = "1234";

    const tenant = Models.createTenant({
      firstName: "peter",
      lastName: "peterton"
    });

    const input = {
      residenceId: 1,
      ...tenant
    };

    mockVerifyId();
    const results = await request
      .post(endpoint)
      .set("Authorization", "Bearer " + fakeToken)
      .send(input);

    expect(results.status).toBe(201);
  });

  it("should return the newly created user", async () => {
    let { landlord, properties } = await testFixture();
    const fakeToken = "1234";

    const tenant = Models.createTenant({
      firstName: "peter",
      lastName: "peterton"
    });

    const input = {
      residenceId: properties[0].id,
      ...tenant
    };

    mockVerifyId();
    const results = await request
      .post(endpoint)
      .set("Authorization", "Bearer " + fakeToken)
      .send(input);

    expect(results.body).toEqual({ ...input, id: 2, landlordId: landlord.id });
  });

  it.skip("should validate the users input", () => {});

  it("should return a status of 401 if logged in user is not a landlord", async () => {
    const { properties } = await testFixture();
    const user2 = Models.createTenant({
      firstName: "fake",
      email: "tenantsrouter@gmail.com"
    });

    await Db.insertUsers(user2);

    const fakeToken = "1234";

    const tenant = Models.createTenant({
      firstName: "peter",
      lastName: "peterton"
    });

    const input = {
      residenceId: properties[0].id,
      ...tenant
    };

    mockVerifyId(user2.email);

    const results = await request
      .post(endpoint)
      .set("Authorization", "Bearer " + fakeToken)
      .send(input);

    expect(results.status).toBe(401);
    expect(results.body).toEqual({
      message: "Only landlords are authorized to create tenants"
    });
  });

  it("should return 401 if the user is not authorized to associate the property with the user", async () => {
    const { properties } = await testFixture();
    const landlord2 = Models.createLandlord({
      firstName: "fake",
      email: "tenantsrouter@gmail.com"
    });

    await Db.insertUsers(landlord2);

    const fakeToken = "1234";

    const tenant = Models.createTenant({
      firstName: "peter",
      lastName: "peterton"
    });

    const input = {
      residenceId: properties[0].id,
      ...tenant
    };

    mockVerifyId(landlord2.email);

    const results = await request
      .post(endpoint)
      .set("Authorization", "Bearer " + fakeToken)
      .send(input);

    expect(results.status).toBe(401);
    expect(results.body).toEqual({
      message:
        "Not authorized to create association with another landlords property"
    });
  });

  it("should return a status of 401 if not authorized", async () => {
    const { properties } = await testFixture();
    const tenant = Models.createTenant({
      firstName: "peter",
      lastName: "peterton"
    });

    const input = {
      residenceId: properties[0].id,
      ...tenant
    };

    const results = await request.post(endpoint).send(input);

    expect(results.status).toBe(401);
  });
});