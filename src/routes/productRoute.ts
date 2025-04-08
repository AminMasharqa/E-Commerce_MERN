import express from "express";
import { getAllProducts } from "../services/productService";

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.status(200).send(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ message: "Error fetching products", error: (error as Error).message });
  }
});

export default router;