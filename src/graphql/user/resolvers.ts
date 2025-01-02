import { prismaClient } from "../../lib/db";

const queries = {};
const mutation = {
  createUser: async (
    _: any,
    {
      firstName,
      lastName,
      email,
      password
    }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }
  ) => {
    await prismaClient.user.create({
      data: { email, firstName, lastName, password, salt: "random__salt" }
    });
    return true;
  }
};
export const resolvers = { queries, mutation };
