require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const parser = require("body-parser");
const cors = require("cors");

const productRoutes = require("./routes/products");
const inventoryRoutes = require("./routes/inventory");
const { sendSummaryReport } = require("./controllers/products.controller");

const PORT = process.env.PORT || 3001;
const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};

const MONGODB_URI = process.env.MONGO;

const app = express();
app.use(express.static(path.join(__dirname, "build")));
app.use(cors(corsOptions));
app.use(parser.json({ limit: "50mb" }));
app.use(parser.urlencoded({ extended: true, limit: "50mb" }));

// Special handling for service worker
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'build', 'service-worker.js'));
});
// No-cache for API routes only, NOT for static/PWA files
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|ico|json|woff|woff2)$/) || 
      req.path === '/manifest.json') {
    return next();
  }
  res.set("Cache-Control", "no-store");
  next();
});

app.use(productRoutes);
app.use(inventoryRoutes);

app.get("/send-summary-report", async (req, res, next) => {
  await sendSummaryReport();
  return res.json({ success: true });
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  res.status(status).json({
    title: error.title,
    msg: error.message,
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./build/index.html"));
});

mongoose
  .connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((res) => {
    console.log("Connected!");
    const server = app.listen(PORT, () => {
      console.log(`listening on PORT ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

