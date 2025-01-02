import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import server from "./graphql/index";

const bootstrap = async () => {
  const app = express();

  app.use(express.json());
  app.use(cors());

  app.use("/graphql", expressMiddleware(await server()));

  app.listen(9000, () => console.log("Server running on 9000"));
};

bootstrap();
