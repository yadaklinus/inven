"use client";

import { getWareHouseId } from "@/hooks/get-werehouseId";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import axios from "axios";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function Upload() {
  const [data, setData] = useState<any>([]);

  const warehousesId = getWareHouseId()

  async function handleSubmit() {
    if (!data.length) {
      alert("No data to upload");
      return;
    }
  
    const mapped = data.map((item: any) => ({
        name: item["item name"] || "",
        description: item["item description"] || "",
        cost: Number(item["average unit cost"]) || 0,
        retailPrice: Number(item["regular price"]) || 0,
        wholeSalePrice: Number(item["custom price 1"]) || 0,
        barcode: item["upc"] || "",
        quantity: Number(item["qty 1"]) || 0,
        taxRate: 0,
        unit: "piece",
        sync: false,
        isDeleted: false,
        warehousesId: warehousesId
      }));
      
  
    console.log("Mapped products:", mapped);
  
    try {
      const res = await axios.post("/api/product/upload-bel", { products: mapped });
      console.log("Upload success:", res.data);
    } catch (err: any) {
      console.error("Upload failed:", err.response?.data || err.message);
    }
  }
  

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (evt: any) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
      // Convert to JSON with row 0 as headers
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  
      // Normalize headers (lowercase)
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
  

  return (
    <>
      <Input type="file" onChange={handleFileUpload} />
      <Button onClick={handleSubmit}>Submit</Button>
    </>
  );
}
