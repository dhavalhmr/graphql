import { ApolloServer } from "@apollo/server";
import { User } from "./user";

export default async () => {
  const server = new ApolloServer({
    typeDefs: `
                type Query {
                  ${User.queries}              
                }
    
                type Mutation {
                  ${User.mutation}              
                }
                
                `,
    resolvers: {
      Query: {
        ...User.resolvers.queries
      },
      Mutation: {
        ...User.resolvers.mutation
      }
    }
  });
  await server.start();

  return server;
};
