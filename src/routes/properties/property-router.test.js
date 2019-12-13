const supertest = require("supertest");
const admin = require("../../lib/admin");
const app = require("../../server.js"); // Link to your server file
const { Db, Models } = require("../../test-utils");

const request = supertest(app);

const defaultLandlord = Models.createUser();
const newProperty = Models.createProperty();

const mockVerifyId = () =>
  admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });

beforeEach(async () => {
  await Db.reset();
  await Db.insertUsers(defaultLandlord);
});

afterAll(async () => {
  await Db.destroyConn();
});

describe("Properties Routes", () => {
  //#region - CREATE
  describe("post: '/api/properties/' endpoint", () => {
    it("should return a 401 if user is not authenticated", async () => {
      const results = await request.post("/api/properties/").send(newProperty);

      expect(results.status).toBe(401);
    });
    it("should return 201 status when successful", async () => {
      // call function

      admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });

      const results = await request
        .post("/api/properties/")
        .send(newProperty)
        .set("Authorization", "Bearer 1234");

      // expected results
      expect(results.status).toBe(201);
      expect(results.body).toEqual({ ...newProperty, id: 1 });
    });
  });

  //#endregion - CREATE

  //#region - READ
  describe("get: '/api/properties/' endpoint", () => {
    it("should return a 401 when the user is not authorized", async () => {
      const { error } = await request.get("/api/properties/");

      expect(error.status).toBe(401);
    });

    it("should return 200 status", async () => {
      admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });

      const results = await request
        .get("/api/properties/")
        .set("Authorization", "Bearer 1234");

      expect(results.status).toBe(200);
      expect(results.body.length).toBe(0);
    });

    it("should return a length of 2", async () => {
      admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });

      await Db.insertProperties([
        Models.createProperty(),
        Models.createProperty()
      ]);

      const results = await request
        .get("/api/properties/")
        .set("Authorization", "Bearer 1234");

      expect(results.body.length).toBe(2);
    });
  });

  describe("get: '/api/properties/:id' endpoint", () => {
    it("should return 200 status", async () => {
      admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });

      await Db.insertProperties([
        Models.createProperty(),
        Models.createProperty()
      ]);

      const results = await request
        .get("/api/properties/1")
        .set("Authorization", "Bearer 1234");

      expect(results.status).toBe(200);
    });

    it("should return an object that matches example", async () => {
      admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });

      const [property] = await Db.insertProperties([Models.createProperty()]);

      const results = await request
        .get("/api/properties/1")
        .set("Authorization", "Bearer 1234");
      const response = results.body;

      expect(response).toEqual(property);
    });
  });

  describe("get: '/api/properties/user/:email' endpoint", () => {
    it.skip("should return 200 status", async () => {
      const results = await request.get(
        '/api/properties/user/"landlord@email.com"'
      );
      expect(results.status).toBe(200);
    });

    it.skip("should return array", async () => {
      const results = await request.get("/api/properties/user/" + "");
      const response = await results.body;

      expect(Array.isArray(response)).toBe(true);
    });

    it.skip("should return a length of 2", async () => {
      const results = await request.get("/api/properties/user/" + "");
      const response = await results.body;

      expect(response).toHaveLength(2);
    });

    it.skip("should return objects with the users email landlord@email.com", async () => {
      const results = await request.get("/api/properties/user/" + "");
      const response = await results.body;

      expect(response[0].email).toBe("landlord@email.com");
      expect(response[1].email).toBe("landlord@email.com");
    });

    it.skip("if user does not exist should return empty array", async () => {
      const results = await request.get("/api/properties/user/test");
      const response = await results.body;

      expect(response).toEqual([]);
    });
  });

  // #endregion

  //#region - UPDATE
  describe("put: '/api/properties/' endpoint", () => {
    it("should return 200 status", async () => {
      // call function
      admin.verifyIdToken.mockResolvedValue({ email: defaultLandlord.email });
      const prop2 = Models.createProperty({ name: "some funky name" });
      const input = { name: "a new funky name" };

      const [, secondProp] = await Db.insertProperties([
        Models.createProperty(),
        prop2
      ]);

      const results = await request
        .put("/api/properties/2")
        .set("Authorization", "Bearer 1234")
        .send(input);
      // expected results
      expect(results.status).toBe(200);
      expect(results.body).toEqual({ ...secondProp, ...input });
    });

    it("should fail if id is not valid with message: Could not find property with given id", async () => {
      mockVerifyId();

      // call function
      const results = await request
        .put("/api/properties/5")
        .set("Authorization", "Bearer 1234")
        .send({ name: "Sample Property Updated" });

      // expected results
      expect(results.status).toBe(404);
      expect(results.body.message).toEqual("No property found with that id");
    });
  });

  //#endregion - UPDATE

  //#region - DELETE
  describe("delete: '/api/properties/' endpoint", () => {
    it("should return 200 status", async () => {
      mockVerifyId();

      await Db.insertProperties([
        Models.createProperty(),
        Models.createProperty(),
        Models.createProperty()
      ]);

      // call function
      const results = await request
        .delete("/api/properties/2")
        .set("Authorization", "Bearer 1234");
      // expected results
      expect(results.status).toBe(200);
    });

    it("should return property to be deleted", async () => {
      mockVerifyId();
      const prop2 = Models.createProperty({ name: "Second Prop" });

      await Db.insertProperties([Models.createProperty(), prop2]);

      const results = await request
        .delete("/api/properties/2")
        .set("Authorization", "Bearer");
      // expected results
      expect(results.body).toEqual({ ...prop2, id: 2 });
    });

    it("should fail if id is not valid with status 404", async () => {
      mockVerifyId();
      // call function
      const results = await request
        .delete("/api/properties/5")
        .set("Authorization", "Bearer 1234");
      // expected results
      expect(results.status).toBe(404);
      expect(results.body).toEqual({
        message: "No property found with that id."
      });
    });
  });

  //#endregion - DELETE
});
