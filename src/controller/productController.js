import pool from "../db.js"
import {S3Client , PutObjectCommand} from "@aws-sdk/client-s3"


const s3Client = new S3Client({
    region : process.env.BUCKET_REGION,
    credentials : {
        accessKeyId : process.env.BUCKET_Access_key,
        secretAccessKey: process.env.bucket_secret_key,
    }
})

export const createProduct = async (req , res) => {
 try {
    // console.log(req.body);
    const {name , price , category , description} = req.body;

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            message : "BAD REQUEST"
        })
    }

    if (!name || !price) {
        return res.status(400).json({
            message : "BAD REQUEST"
        })
    }

    const fileName = `products/${Date.now()}-${file.originalname}`;

    const uploadCommand = new PutObjectCommand({
        Bucket : process.env.BUCKET_NAME,
        Key : fileName,
        Body : file.buffer,
        ContentType : file.mimetype
    })

    await s3Client.send(uploadCommand);

    const imgURl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${fileName}`;

    const result = await pool.query(`
        INSERT INTO productList (name , price , category , description , image_url)
        values ($1 , $2 , $3 , $4 , $5) RETURNING *`,
        [name , price , category , description , imgURl]
    );

    return res.status(201).json({
        message : "Product Created",
        data : result.rows[0],
    })
 } catch (error) {
    console.log("Reason of destruction : ",error)
 }   

}

export const updateProduct = async (req , res) => {
 try {
    const {id} = req.params;
    const {name , price , category , description} = req.body;

    const file = req.file;

    const isExisting = await pool.query(`select * from productList where id = $1`, [id]);

    if (isExisting.rows.length === 0) {
        return res.status(404).json({
            message : "Product not found"
        })
    }

    let imgUrl = isExisting.rows[0].image_url;

    if (file) {
        const fileName = `products/${Date.now()}-${file.originalname}`;

        const uploadCommand = new PutObjectCommand({
            Bucket : process.env.BUCKET_NAME,
            Key : fileName,
            Body : file.buffer,
            ContentType : file.mimetype
        })

        await s3Client.send(uploadCommand);

        imgUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${fileName}`
    }

    const result = await pool.query(`
        update productList set
        name = $1,
        price = $2,
        category = $3,
        description = $4,
        image_url = $5
        where id = $6
        RETURNING *
        `,
        [name , price , category , description , imgUrl , id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
        message : "Product updated",
        data : result.rows[0],
    })
 } catch (error) {
    console.log("Reason of destruction : ",error)
 }   
}

export const getAllProducts = async(req , res)=>{
    try {
        const result = await pool.query("SELECT * FROM productList");

        return res.status(201).json({
            message : "OK",
            data : result.rows,
        })
        
    } catch (error) {
        console.log("Reason of Error : " , error)
        return res.status(500).json({
            message : "Internal Server Error"
        })
    }
}

export const getProductById = async (req , res) => {
    try {
        const {id} = req.params;

        const result = await pool.query(`
            select * from productList where id = $1`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message : "Product not found"
            })
        }

        return res.status(201).json({
            message : "Product",
            data : result.rows[0]
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : "Internal server error"
        })
    }
}

export const deleteProduct = async (req , res) => {
    try {
        const {id} = req.params;

        if (!id) {
            return res.status(400).json({
                message : "Bas Request"
            })
        }

        const result = await pool.query(`
            delete from productList where id = $1 returning *
            `,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        return res.status(201).json({
            message : "Product deleted",
            data : result.rows[0]
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : "Internal server error"
        })
        
    }
}

