import express from "express";
import productRoutes from "./routes/productRoutes.js";
import morgan from "morgan";

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/products" , productRoutes);

app.listen(port , ()=>console.log(`App is listening to ${port}`))
