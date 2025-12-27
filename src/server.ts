import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

var app = express();

app.use(cors());

app.use("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("Hello World");
})

app.listen(8000, function () {
  console.log("App listening on port 8000!");
});

export default app;