import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import broadcastRoutes from "./routes.js";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';
import { db } from './firebase-config.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import requestRoutes from './src/routes/requestRoutes.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Middleware
// app.use(cors({
//     origin: 'http://localhost:5173', // Your frontend URL
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//     exposedHeaders: ['Cross-Origin-Opener-Policy', 'Cross-Origin-Embedder-Policy']
//   }));
app.use(cors());
  app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API is running 🚀"));
app.use("/api", broadcastRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requests', requestRoutes);

// Start Server
app.listen(port, () => console.log(`Server running on port ${port}`));
