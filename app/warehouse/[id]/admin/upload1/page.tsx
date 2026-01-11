"use client";

import { getWareHouseId } from "@/hooks/get-werehouseId";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import axios from "axios";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function Upload() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const warehousesId = getWareHouseId();

  // 1. File Upload & Normalization
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt: any) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // Normalize headers: "Item Name " -> "item name"
      const normalizedData = rawData.map((row: any) => {
        const obj: any = {};
        Object.keys(row).forEach((key) => {
          obj[key.toLowerCase().trim()] = row[key];
        });
        return obj;
      });

      setData(normalizedData);
    };

    reader.readAsBinaryString(file);
  };

  // 2. Data Mapping & Submission
  async function handleSubmit() {
    if (!data.length) {
      alert("No data to upload. Please select a file.");
      return;
    }

    if (!warehousesId) {
      alert("Warehouse ID not found. Cannot proceed.");
      return;
    }

    setLoading(true);

    const mapped = data
      .map((item: any) => {
        // Capture the raw barcode value
        const rawBarcode = item["code"] || item["barcode"] || item["upc"];

        return {
          name: String(item["name"] || item["item name"] || "").trim(),
          description: String(item["item description"] || item["description"] || ""),
          
          // Ensure prices are numbers
          cost: parseFloat(item["cost"]) || 0,
          retailPrice: parseFloat(item["price"]) || 0,
          wholeSalePrice: parseFloat(item["price"]) || 0, 
          
          // FIX: Ensure barcode is always a string even if Excel sends it as a number
          barcode: rawBarcode ? String(rawBarcode).trim() : "",
          
          // Ensure quantity is an integer
          quantity: parseInt(item["quantity"]) || 0,
          
          taxRate: 0,
          unit: "piece",
          sync: false,
          isDeleted: false,
          warehousesId: warehousesId,
        };
      })
      .filter((product) => product.name !== "");

    try {
      console.log("Sending to API:", mapped);
      const res = await axios.post("/api/product/upload-bel", { products: mapped });
      alert(`Successfully uploaded ${mapped.length} products.`);
      setData([]); 
    } catch (err: any) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Internal Server Error during upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md border rounded-xl shadow-sm bg-white">
      <h2 className="text-xl font-bold">Bulk Product Upload</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Select Excel or CSV File</label>
        <Input 
          type="file" 
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload} 
          disabled={loading}
        />
      </div>

      <Button 
        color="primary" 
        onClick={handleSubmit} 
        isLoading={loading}
        className="font-semibold"
      >
        {loading ? "Processing..." : `Upload ${data.length > 0 ? data.length : ""} Items`}
      </Button>

      {data.length > 0 && (
        <p className="text-xs text-green-600">
          File loaded successfully. Ready to sync {data.length} rows.
        </p>
      )}
    </div>
  );
}