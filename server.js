// server.js

const express = require("express");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const S3Service = require("./s3Service");

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Swagger config
 */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "S3 Test API",
      version: "1.0.0",
      description: "API for testing S3 connection and uploading files"
    }
  },
  apis: ["./server.js"]
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /s3/test:
 *   post:
 *     summary: Test S3 connection
 *     tags: [S3]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               S3_BUCKET:
 *                 type: string
 *               S3_REGION:
 *                 type: string
 *               S3_ACCESS_KEY_ID:
 *                 type: string
 *               S3_ACCESS_KEY_SECRET:
 *                 type: string
 *               S3_ENDPOINT:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection result
 */
app.post("/s3/test", async (req, res) => {

  const config = req.body;

  const s3 = new S3Service({
    bucket: config.S3_BUCKET,
    region: config.S3_REGION,
    accessKey: config.S3_ACCESS_KEY_ID,
    secretKey: config.S3_ACCESS_KEY_SECRET,
    endpoint: config.S3_ENDPOINT
  });

  const result = await s3.testConnection();

  res.json({
    success: result
  });

});


/**
 * @swagger
 * /s3/upload:
 *   post:
 *     summary: Upload file to S3
 *     tags: [S3]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               S3_BUCKET:
 *                 type: string
 *               S3_REGION:
 *                 type: string
 *               S3_ACCESS_KEY_ID:
 *                 type: string
 *               S3_ACCESS_KEY_SECRET:
 *                 type: string
 *               S3_ENDPOINT:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload success
 */
app.post("/s3/upload", upload.single("file"), async (req, res) => {

  try {

    const config = req.body;

    const s3 = new S3Service({
      bucket: config.S3_BUCKET,
      region: config.S3_REGION,
      accessKey: config.S3_ACCESS_KEY_ID,
      secretKey: config.S3_ACCESS_KEY_SECRET,
      endpoint: config.S3_ENDPOINT
    });

    const result = await s3.uploadFile(req.file);

    res.json({
      success: true,
      data: result
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/docs`);
});