import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';

import cors from 'cors';
import fileUpload from 'express-fileupload';
import corsOptions from './corsOptions';
import ApolloServer from './ApolloServer';
import {
  test,
  uploadAttachments,
  getAttachments,
  refreshToken,
} from './rest';

var running: boolean = false;
const port = 4000;
export const startRest = () => {
  if (running) return;
  //Setup
  running = true;
  const server = ApolloServer;
  const app = express();
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(fileUpload({
    createParentPath: true, preserveExtension: true, limits: { fileSize: 50 * 1024 * 1024 },
  }));
  server.applyMiddleware({ app, cors: false });

  //REST stuff
  test(app);
  uploadAttachments(app);
  getAttachments(app);
  refreshToken(app);

  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);
  httpServer.listen({ port }, () => {
    console.log(`Now browse to http://localhost:${port}${server.graphqlPath}`)
  });
}
