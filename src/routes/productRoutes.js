import express from "express";
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById
} from "../controller/productController.js"
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage()
});


const router = express.Router();

router.post("/create/product" , upload.single("image"),createProduct );
router.put("/update/product/:id" ,upload.single("image"), updateProduct)
router.get("/all/products" , getAllProducts);
router.get("/product/:id" , getProductById);

router.delete("/delete/product/:id" , deleteProduct);

export default router;