import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './database.js';

var app = express();
dotenv.config();

app.use(cors());

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello World");
})

const startServer = async () => {
  try {
    await connectDB();

    app.listen(8000, function () {
      console.log("App listening on port 8000!");
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();