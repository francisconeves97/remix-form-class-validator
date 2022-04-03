import "reflect-metadata";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  ValidateNested,
} from "class-validator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseRequestParams } from ".";

describe("parseRequestParams", () => {
  const mockRequestText = vi.fn();
  const request = {
    text: mockRequestText,
  } as unknown as Request;

  const mockRequestTextValue = (value: string) =>
    mockRequestText.mockResolvedValue(value);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when parsing flat params", () => {
    class FlatParams {
      @IsEmail()
      email: string;
      @MinLength(3)
      password: string;
    }

    describe("when the params are valid", () => {
      const emailValue = "email@value.com";
      const passwordValue = "passwordValue";

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("email", emailValue);
        urlFormParameters.append("password", passwordValue);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should parse the params correctly", async () => {
        const params = await parseRequestParams(request, FlatParams);

        expect(params.data).toEqual({
          email: emailValue,
          password: passwordValue,
        });
      });

      it("should not return any errors", async () => {
        const params = await parseRequestParams(request, FlatParams);

        expect(params.errors).toBeUndefined();
      });
    });

    describe("when the params are not valid", () => {
      const emailValue = "emailvalue.com";
      const passwordValue = "pa";

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("email", emailValue);
        urlFormParameters.append("password", passwordValue);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should return the given values", async () => {
        const params = await parseRequestParams(request, FlatParams);

        expect(params.data).toEqual({
          email: emailValue,
          password: passwordValue,
        });
      });

      it("should return the errors", async () => {
        const params = await parseRequestParams(request, FlatParams);

        expect(params.errors?.email).toHaveLength(1);
        expect(params.errors?.password).toHaveLength(1);
      });
    });
  });

  describe("when parsing params primitive types", () => {
    class PersonParams {
      age: number;
      isMarried: boolean;
      points: number;
      nullable?: string;
      optional?: string;
      negative: number;
    }

    const ageValue = 25;
    const isMarriedValue = true;
    const pointsValue = 4.5;
    const negativeValue = -3;

    beforeEach(() => {
      const urlFormParameters = new URLSearchParams();
      urlFormParameters.append("age", ageValue.toString());
      urlFormParameters.append("isMarried", isMarriedValue.toString());
      urlFormParameters.append("points", pointsValue.toString());
      urlFormParameters.append("nullable", "null");
      urlFormParameters.append("optional", "undefined");
      urlFormParameters.append("negative", negativeValue.toString());

      mockRequestTextValue(urlFormParameters.toString());
    });

    it("should parse the params correctly", async () => {
      const params = await parseRequestParams(request, PersonParams);

      expect(params.data).toEqual({
        age: ageValue,
        isMarried: isMarriedValue,
        points: 4.5,
        nullable: null,
        optional: undefined,
        negative: negativeValue,
      });
    });
  });

  describe("when parsing params with repeated names", () => {
    enum Foods {
      pizza,
      sushi,
    }

    class RepeatedNameParams {
      @IsEnum(Foods, { each: true })
      favouriteFoods: string[];
    }

    describe("when the params are valid", () => {
      const favouriteFood1 = "pizza";
      const favouriteFood2 = "sushi";

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("favouriteFoods", favouriteFood1);
        urlFormParameters.append("favouriteFoods", favouriteFood2);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should parse the params to an array", async () => {
        const params = await parseRequestParams(request, RepeatedNameParams);

        expect(params.data.favouriteFoods).toHaveLength(2);
        expect(params.data.favouriteFoods?.[0]).toBe(favouriteFood1);
        expect(params.data.favouriteFoods?.[1]).toBe(favouriteFood2);
      });

      it("should not return any errors", async () => {
        const params = await parseRequestParams(request, RepeatedNameParams);

        expect(params.errors).toBeUndefined();
      });
    });

    describe("when the params are not valid", () => {
      const favouriteFood1 = "pizza";
      const favouriteFood2 = "hamburguer";

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("favouriteFoods", favouriteFood1);
        urlFormParameters.append("favouriteFoods", favouriteFood2);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should return the given values correctly parsed", async () => {
        const params = await parseRequestParams(request, RepeatedNameParams);

        expect(params.data.favouriteFoods).toHaveLength(2);
        expect(params.data.favouriteFoods?.[0]).toBe(favouriteFood1);
        expect(params.data.favouriteFoods?.[1]).toBe(favouriteFood2);
      });

      it("should return the errors", async () => {
        const params = await parseRequestParams(request, RepeatedNameParams);

        expect(params.errors?.favouriteFoods).toHaveLength(1);
      });
    });
  });

  describe("when parsing params with nested values", () => {
    class Address {
      @MinLength(3)
      street: string;
    }

    class User {
      @MinLength(3)
      name: string;
      @Type(() => Address)
      @ValidateNested()
      address: Address;
    }

    class Form {
      @Type(() => User)
      @ValidateNested()
      user: User;
      @IsNotEmpty()
      otherData: string;
    }

    describe("when the params are valid", () => {
      const name = "name";
      const streetName = "streetName";
      const otherData = "otherData";

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("user[address][street]", streetName);
        urlFormParameters.append("user[name]", name);
        urlFormParameters.append("otherData", otherData);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should parse the params to an object", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.data.user?.name).toBe(name);
        expect(params.data.user?.address?.street).toBe(streetName);
        expect(params.data.otherData).toBe(otherData);
      });

      it("should not return any errors", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.errors).toBeUndefined();
      });
    });

    describe("when the params are not valid", () => {
      const name = "na";
      const streetName = "st";

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("user[address][street]", streetName);
        urlFormParameters.append("user[name]", name);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should return the given values correctly parsed", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.data.user?.name).toBe(name);
        expect(params.data.user?.address?.street).toBe(streetName);
        expect(params.data.otherData).toBe(undefined);
      });

      it("should return the errors", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.errors?.otherData).toHaveLength(1);
        expect(params.errors?.user?.name).toHaveLength(1);
        expect(params.errors?.user?.address?.street).toHaveLength(1);
      });
    });
  });

  describe("when parsing params with arrays of objects", () => {
    class User {
      @IsNotEmpty()
      id: string;
      @MinLength(3)
      name: string;
    }

    class Form {
      @Type(() => User)
      @ValidateNested()
      users: User[];
    }

    describe("when the params are valid", () => {
      const user1 = {
        id: "user1.id",
        name: "user1.name",
      };
      const user2 = {
        id: "user2.id",
        name: "user2.name",
      };

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("users[0][id]", user1.id);
        urlFormParameters.append("users[0][name]", user1.name);
        urlFormParameters.append("users[1][id]", user2.id);
        urlFormParameters.append("users[1][name]", user2.name);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should parse the params correctly", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.data.users?.[0].id).toBe(user1.id);
        expect(params.data.users?.[0].name).toBe(user1.name);
        expect(params.data.users?.[1].id).toBe(user2.id);
        expect(params.data.users?.[1].name).toBe(user2.name);
      });

      it("should not return any errors", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.errors).toBeUndefined();
      });
    });

    describe("when the params are not valid", () => {
      const user1 = {
        name: "user1.name",
      };
      const user2 = {
        id: "user2.id",
        name: "us",
      };

      beforeEach(() => {
        const urlFormParameters = new URLSearchParams();
        urlFormParameters.append("users[0][name]", user1.name);
        urlFormParameters.append("users[1][id]", user2.id);
        urlFormParameters.append("users[1][name]", user2.name);

        mockRequestTextValue(urlFormParameters.toString());
      });

      it("should return the given values correctly parsed", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.data.users?.[0].id).toBeUndefined();
        expect(params.data.users?.[0].name).toBe(user1.name);
        expect(params.data.users?.[1].id).toBe(user2.id);
        expect(params.data.users?.[1].name).toBe(user2.name);
      });

      it("should return the errors", async () => {
        const params = await parseRequestParams(request, Form);

        expect(params.errors?.users?.[0].id).toBeDefined();
        expect(params.errors?.users?.[1].name).toBeDefined();
      });
    });
  });
});
