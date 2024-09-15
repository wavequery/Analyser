// src/server.ts

import express from "express";
import path from "path";
import fs from "fs/promises";
import { AddressInfo } from "net";

console.log("Server script started");

const app = express();

const schemaFilePath = process.env.SCHEMA_FILE_PATH || "database-schema.json";
console.log(`Using schema file: ${schemaFilePath}`);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/schema", async (req, res) => {
  try {
    const schemaData = await fs.readFile(schemaFilePath, "utf-8");
    const parsedData = JSON.parse(schemaData);
    console.log("Sending schema data:", parsedData);
    res.json(parsedData);
  } catch (error) {
    console.error("Error reading schema file:", error);
    res.status(500).json({ error: "Error loading schema data" });
  }
});

// Start the server on a random available port
const server = app.listen(0, () => {
  const address = server.address() as AddressInfo;
  const port = address.port;
  console.log(`Server running at http://localhost:${port}`);
  if (process.send) {
    console.log("Sending server_start message to parent process");
    process.send({ type: "server_start", port: port });
  } else {
    console.log("process.send is not available");
  }
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

console.log("Server setup complete");
