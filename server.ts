import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload size for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const UPLOADS_FILE = path.join(process.cwd(), 'uploads.json');
const STATUS_FILE = path.join(process.cwd(), 'status.json');
const SHIPMENT_FILE = path.join(process.cwd(), 'shipment.json');

const DEFAULT_SHIPMENT = {
  trackingNumber: "6635471299413458",
  name: "Nicola Tella",
  postalCode: "50001, Zaragoza",
  address: "Ps. Independencia 33, 50001, Zaragoza",
  contact: "+34 614 11 39 38",
  packageVerified: "Cable USB",
  beneficiary: "5728",
  concept: "Pago 5728",
  ibanLabel: "IBAN BANCO (BBVA)",
  ibanValue: "ES74 0182 2647 5902 0168 2392",
  shippingCost: "14,58€ (PAGADO)",
  packageCost: "4,00€",
  totalAmount: "4,00€"
};

// Initialize uploads file if it doesn't exist
if (!fs.existsSync(UPLOADS_FILE)) {
  fs.writeFileSync(UPLOADS_FILE, JSON.stringify([]));
}

// Initialize status file if it doesn't exist
if (!fs.existsSync(STATUS_FILE)) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: 'pending' }));
}

// Initialize shipment file if it doesn't exist
if (!fs.existsSync(SHIPMENT_FILE)) {
  fs.writeFileSync(SHIPMENT_FILE, JSON.stringify(DEFAULT_SHIPMENT));
}

// API Routes
app.get("/api/shipment", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SHIPMENT_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.json(DEFAULT_SHIPMENT);
  }
});

app.post("/api/admin/shipment", (req, res) => {
  const token = req.headers.authorization;
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const newShipment = req.body;
    console.log("Saving new shipment data:", JSON.stringify(newShipment).substring(0, 100) + "...");
    if (!newShipment || Object.keys(newShipment).length === 0) {
      console.error("Received empty shipment data");
      return res.status(400).json({ error: "Empty shipment data" });
    }
    fs.writeFileSync(SHIPMENT_FILE, JSON.stringify(newShipment, null, 2));
    console.log("Shipment data saved successfully to", SHIPMENT_FILE);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving shipment:", error);
    res.status(500).json({ error: "Failed to update shipment" });
  }
});

app.post("/api/admin/shipment/reset", (req, res) => {
  const token = req.headers.authorization;
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    fs.writeFileSync(SHIPMENT_FILE, JSON.stringify(DEFAULT_SHIPMENT));
    res.json({ success: true, data: DEFAULT_SHIPMENT });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset shipment" });
  }
});

app.get("/api/status", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.json({ status: 'pending' });
  }
});

app.post("/api/admin/status", (req, res) => {
  const token = req.headers.authorization;
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const { status } = req.body;
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status }));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.post("/api/uploads", (req, res) => {
  try {
    const { image, trackingNumber, date } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    let uploads = [];
    try {
      const fileContent = fs.readFileSync(UPLOADS_FILE, 'utf-8');
      if (fileContent) {
        uploads = JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Error parsing uploads.json for write:", e);
      uploads = [];
    }
    
    if (!Array.isArray(uploads)) {
      uploads = [];
    }

    const newUpload = {
      id: Date.now().toString(),
      image,
      trackingNumber: trackingNumber || "N/A",
      date: date || new Date().toISOString()
    };
    
    uploads.push(newUpload);
    fs.writeFileSync(UPLOADS_FILE, JSON.stringify(uploads));
    
    res.json({ success: true, id: newUpload.id });
  } catch (error) {
    console.error("Error saving upload:", error);
    res.status(500).json({ error: "Failed to save upload" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === "192021") {
    res.json({ success: true, token: "admin-token-123" });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta" });
  }
});

app.get("/api/admin/uploads", (req, res) => {
  const token = req.headers.authorization;
  console.log("Received token for uploads:", token);
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let uploads = [];
    const fileContent = fs.readFileSync(UPLOADS_FILE, 'utf-8');
    if (fileContent) {
      try {
        uploads = JSON.parse(fileContent);
      } catch (e) {
        console.error("Error parsing uploads.json:", e);
        uploads = [];
      }
    }
    
    if (!Array.isArray(uploads)) {
      uploads = [];
    }
    
    // Sort by newest first
    uploads.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(uploads);
  } catch (error) {
    console.error("Error reading uploads:", error);
    res.status(500).json({ error: "Failed to read uploads" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
