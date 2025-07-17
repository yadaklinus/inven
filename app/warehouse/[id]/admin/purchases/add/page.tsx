"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { Truck, Plus, Trash2, Calculator, Check, Printer, ChevronsUpDown, ShoppingCart } from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"

// Sample data
const suppliers = [
  {
    id: "SUP-001",
    name: "Tech Distributors Inc",
    email: "sales@techdist.com",
    phone: "+1234567892",
    address: "123 Tech Street, Silicon Valley",
  },
  {
    id: "SUP-002",
    name: "Electronics Supply Co",
    email: "orders@elecsupply.com",
    phone: "+1234567893",
    address: "456 Electronics Ave, Tech City",
  },
  {
    id: "SUP-003",
    name: "Mobile Solutions Ltd",
    email: "info@mobilesol.com",
    phone: "+1234567894",
    address: "789 Mobile Blvd, Phone Town",
  },
  {
    id: "SUP-004",
    name: "Computer World",
    email: "sales@compworld.com",
    phone: "+1234567895",
    address: "321 Computer St, Hardware City",
  },
  {
    id: "SUP-005",
    name: "Audio Plus",
    email: "contact@audioplus.com",
    phone: "+1234567896",
    address: "654 Audio Lane, Sound City",
  },
]

const warehouses = [
  { id: "WH-001", name: "Main Warehouse", code: "MAIN", address: "100 Storage St, Warehouse District" },
  { id: "WH-002", name: "Branch Warehouse", code: "BRANCH", address: "200 Branch Ave, Secondary Location" },
  { id: "WH-003", name: "Storage Facility", code: "STORAGE", address: "300 Storage Rd, Remote Area" },
]

const products = [
  {
    id: "PRD-001",
    name: "iPhone 15 Pro",
    code: "IPH15PRO",
    barcode: "123456789012",
    costPrice: 750.0,
    wholesalePrice: 850.0,
    retailPrice: 999.0,
    stock: 25,
    unit: "PCS",
    description: "Latest iPhone with advanced features",
  },
  {
    id: "PRD-002",
    name: "Samsung Galaxy S24",
    code: "SGS24",
    barcode: "123456789013",
    costPrice: 650.0,
    wholesalePrice: 750.0,
    retailPrice: 899.0,
    stock: 15,
    unit: "PCS",
    description: "Samsung flagship smartphone",
  },
  {
    id: "PRD-003",
    name: "MacBook Air M3",
    code: "MBAM3",
    barcode: "123456789014",
    costPrice: 1000.0,
    wholesalePrice: 1150.0,
    retailPrice: 1299.0,
    stock: 8,
    unit: "PCS",
    description: "Apple MacBook Air with M3 chip",
  },
  {
    id: "PRD-004",
    name: "iPad Pro 12.9",
    code: "IPADPRO129",
    barcode: "123456789015",
    costPrice: 850.0,
    wholesalePrice: 950.0,
    retailPrice: 1099.0,
    stock: 3,
    unit: "PCS",
    description: "iPad Pro with 12.9 inch display",
  },
  {
    id: "PRD-005",
    name: "AirPods Pro",
    code: "AIRPODSPRO",
    barcode: "123456789016",
    costPrice: 180.0,
    wholesalePrice: 220.0,
    retailPrice: 249.0,
    stock: 0,
    unit: "PCS",
    description: "Apple AirPods Pro with noise cancellation",
  },
  {
    id: "PRD-006",
    name: "Dell XPS 13",
    code: "DELLXPS13",
    barcode: "123456789017",
    costPrice: 900.0,
    wholesalePrice: 1000.0,
    retailPrice: 1199.0,
    stock: 12,
    unit: "PCS",
    description: "Dell XPS 13 laptop",
  },
  {
    id: "PRD-007",
    name: "Sony WH-1000XM5",
    code: "SONYWH1000",
    barcode: "123456789018",
    costPrice: 280.0,
    wholesalePrice: 320.0,
    retailPrice: 399.0,
    stock: 18,
    unit: "PCS",
    description: "Sony noise-cancelling headphones",
  },
]

interface PurchaseItem {
  id: string
  productId: string
  productName: string
  productBarcode: string
  cost: number
  wholeSalePrice: number
  retailPrice: number
  selectedPrice: number
  priceType: "wholesale" | "retail"
  quantity: number
  discount: number
  total: number
  unit: string
  taxRate: number
}

interface PurchaseData {
  id: string
  invoiceNumber: string
  referenceNo: string
  date: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  items: PurchaseItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  shipping: number
  grandTotal: number
  paidAmount: number
  status: "ordered" | "received" | "pending"
  paymentStatus: "paid" | "partial" | "pending"
  notes: string
  createdAt: string
}

export default function AddPurchasePage() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")

  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(10)
  const [shipping, setShipping] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [status, setStatus] = useState<"ordered" | "received" | "pending">("ordered")
  const [notes, setNotes] = useState("")
  const [priceType, setPriceType] = useState<"wholesale" | "retail">("retail")
  
  const [referenceNo, setReferenceNo] = useState(
    `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
  )
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdPurchase, setCreatedPurchase] = useState<PurchaseData | null>(null)
  const [open, setOpen] = useState(false)

   const warehouseId = getWareHouseId()
          
          const {data:products,loading,error} = fetchWareHouseData("/api/product/list",{warehouseId})
          const {data:suppliers,loading:loadingsuppliers,error:errorsuppliers} = fetchWareHouseData("/api/supplier/list",{warehouseId})
  
           if(!products && !suppliers) return (
            <Loading/>
           )

  const selectedProduct = products?.find((p:any) => p.id === selectedProductId)

  const generateInvoiceNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `INV-${timestamp}-${random}`
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-600", text: "Out of Stock", bgColor: "bg-red-50" }
    if (stock <= 5) return { color: "text-yellow-600", text: "Low Stock", bgColor: "bg-yellow-50" }
    return { color: "text-green-600", text: "In Stock", bgColor: "bg-green-50" }
  }

  const addProductToPurchase = () => {
    if (!selectedProduct) return

    const selectedPrice = getCurrentPrice(selectedProduct, priceType)

    const itemTotal = selectedProduct.cost * quantity - discount
    const newItem: PurchaseItem = {
      id: `ITEM-${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productBarcode: selectedProduct.barcode,
        cost: selectedProduct.cost,
        wholeSalePrice: selectedProduct.wholeSalePrice,
        retailPrice: selectedProduct.retailPrice,
        selectedPrice,
        priceType,
        quantity,
        discount,
        total: itemTotal,
        unit: selectedProduct.unit,
        taxRate: selectedProduct.taxRate,
    }

    setPurchaseItems([...purchaseItems, newItem])
    setSelectedProductId("")
    setQuantity(1)
    setDiscount(0)
    setOpen(false)
  }

  const removeItem = (itemId: string) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.cost * newQuantity - item.discount
          return { ...item, quantity: newQuantity, total: newTotal }
        }
        return item
      }),
    )
  }

  const getCurrentPrice = (product: (typeof products)[0], type: "wholesale" | "retail") => {
    return type === "wholesale" ? product.wholeSalePrice : product.retailPrice
  }

 

  const subtotal = purchaseItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = subtotal + taxAmount + shipping

  const getPaymentStatus = () => {
    if (paidAmount === 0) return "pending"
    if (paidAmount >= grandTotal) return "paid"
    return "partial"
  }

  const handleSubmit = async () => {
    if (purchaseItems.length === 0 || !selectedSupplier) return

    const supplier = suppliers?.find((s:any) => s.id === selectedSupplier)

    const purchaseData = {
      items: purchaseItems.map(item => ({
        productName: item.productName,
        productBarcode: item.productBarcode,
        cost: item.cost,
        selectedPrice: item.selectedPrice,
        priceType: item.priceType,
        quantity: item.quantity,
        discount: item.discount,
        total: item.total
      })),
      referenceNo,
      subtotal,
      taxRate,
      taxAmount,
      shipping,
      grandTotal,
      paidAmount,
      balance: grandTotal - paidAmount,
      notes,
      warehouseId,
      supplierId: selectedSupplier,
      status
    }

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      })

      if (response.ok) {
        const result = await response.json()
        
        const completedPurchase: PurchaseData = {
          id: result.purchase.id,
          invoiceNumber: result.purchase.referenceNo,
          referenceNo,
          date: new Date().toISOString().split("T")[0],
          supplierId: selectedSupplier,
          supplierName: supplier?.name || "",
          warehouseId: warehouseId,
          warehouseName: "",
          items: purchaseItems,
          subtotal,
          taxRate,
          taxAmount,
          shipping,
          grandTotal,
          paidAmount,
          status,
          paymentStatus: getPaymentStatus(),
          notes,
          createdAt: new Date().toISOString(),
        }

        setCreatedPurchase(completedPurchase)
        setShowSuccessDialog(true)

        // Reset form
        setPurchaseItems([])
        setSelectedSupplier("")
        setPaidAmount(0)
        setNotes("")
        setReferenceNo(`PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`)
      } else {
        console.error('Failed to create purchase order')
        alert('Failed to create purchase order. Please try again.')
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Error creating purchase order. Please try again.')
    }
  }

  const handlePrintReceipt = () => {
    if (!createdPurchase) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const supplier = suppliers.find((s:any) => s.id === createdPurchase.supplierId)
    const warehouse = warehouses.find((w:any) => w.id === createdPurchase.warehouseId)

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${createdPurchase.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PURCHASE ORDER</h1>
            <h2>Invoice: ${createdPurchase.invoiceNumber}</h2>
            <p>Reference: ${createdPurchase.referenceNo}</p>
            <p>Date: ${new Date(createdPurchase.date).toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <h3>Supplier Information:</h3>
            <p><strong>${supplier?.name}</strong></p>
            <p>${supplier?.email}</p>
            <p>${supplier?.phone}</p>
            <p>${supplier?.address}</p>
            
            <h3>Warehouse:</h3>
            <p><strong>${warehouse?.name}</strong></p>
            <p>${warehouse?.address}</p>
          </div>

          <table class="items">
            <thead>
              <tr>
                
                <th>Product</th>
                
                <th>Barcode</th>
                <th>Cost Price</th>
                <th>Quantity</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${createdPurchase.items
                .map(
                  (item) => `
                <tr>
                 
                  <td>${item.productName}</td>
                  
                  <td>${item.productBarcode}</td>
                  <td>$${item.cost.toFixed(2)}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>$${item.discount.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${createdPurchase.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${createdPurchase.taxRate}%):</span>
              <span>$${createdPurchase.taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>$${createdPurchase.shipping.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>$${createdPurchase.grandTotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Paid Amount:</span>
              <span>$${createdPurchase.paidAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Balance:</span>
              <span>$${(createdPurchase.grandTotal - createdPurchase.paidAmount).toFixed(2)}</span>
            </div>
          </div>

          ${
            createdPurchase.notes
              ? `
            <div style="margin-top: 30px;">
              <h3>Notes:</h3>
              <p>${createdPurchase.notes}</p>
            </div>
          `
              : ""
          }

          <div style="margin-top: 50px; text-align: center; color: #666;">
            <p>Status: ${createdPurchase.status.toUpperCase()} | Payment: ${createdPurchase.paymentStatus.toUpperCase()}</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  return (
    <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/purchases/list">Purchases</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Purchase</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Add New Purchase</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Purchase Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Purchase Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="reference">Reference Number *</Label>
                      <Input
                        id="reference"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="PO-2024-001"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier *</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier:any) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase-date">Purchase Date *</Label>
                    <Input id="purchase-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                </CardContent>
              </Card>

              {/* Add Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Products</CardTitle>
                  <CardDescription>Each product will get a unique invoice number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Selection with Search */}
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between bg-transparent"
                        >
                          {selectedProductId
                            ? products.find((product:any) => product.id === selectedProductId)?.name
                            : "Select product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search products..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                              {products?.map((product:any) => {
                                const stockStatus = getStockStatus(product.stock)
                                return (
                                 <CommandItem
                                                                     key={product.id}
                                                                     value={`${product.name} ${product.barcode} ${product.unit}`} // include searchable fields here
                                                                     onSelect={(currentValue) => {
                                                                       const selected = products?.find((p:any) =>
                                                                         `${p.name} ${p.barcode} ${p.unit}` === currentValue
                                                                       )?.id
                                                                       setSelectedProductId(selected || "")
                                                                       setOpen(false)
                                                                     }}
                                                                     className="flex flex-col items-start gap-1 p-3"
                                                                   >
                                                                     {/* Render actual searchable text here so the filter works */}
                                                                     <div className="sr-only">{`${product.name} ${product.barcode} ${product.unit}`}</div>
                                 
                                                                     <div className="flex items-center justify-between w-full">
                                                                       <span className="font-medium">{product.name}</span>
                                                                       <div className="flex items-center gap-2">
                                                                         <span className="text-sm text-muted-foreground">
                                                                           W: {formatCurrency(product.wholeSalePrice)}
                                                                         </span>
                                                                         <span className="font-semibold">R: {formatCurrency(product.retailPrice)}</span>
                                                                       </div>
                                                                     </div>
                                                                     <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                                                                       <span>
                                                                         {product.barcode} • {product.unit}
                                                                       </span>
                                                                       <span className={stockStatus.color}>{product.quantity} in stock</span>
                                                                     </div>
                                                                     <Check
                                                                       className={cn(
                                                                         "ml-auto h-4 w-4",
                                                                         selectedProductId === product.id ? "opacity-100" : "opacity-0",
                                                                       )}
                                                                     />
                                                                   </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Price Type Selection */}
                  {selectedProduct && (
                    <div className="space-y-2">
                      <Label>Price Type</Label>
                      <Select value={priceType} onValueChange={(value: "wholesale" | "retail") => setPriceType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wholesale">
                            Wholesale - {formatCurrency(selectedProduct.wholeSalePrice.toFixed(2))}
                          </SelectItem>
                          <SelectItem value="retail">Retail - {formatCurrency(selectedProduct.retailPrice.toFixed(2))}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quantity and Discount */}
                  {selectedProduct && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={selectedProduct.quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount </Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={addProductToPurchase}
                          className="w-full"
                          disabled={selectedProduct.quantity === 0 || quantity > selectedProduct.quantity}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Product Details */}
                  {selectedProduct && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Cost: </span> {formatCurrency(selectedProduct.cost)}
                        </div>
                        <div>
                          <span className="font-medium">Stock: </span> {selectedProduct.quantity} {selectedProduct.unit}
                        </div>
                        <div>
                          <span className="font-medium">Selected Price: </span> 
                          {formatCurrency(getCurrentPrice(selectedProduct, priceType))}
                        </div>
                        <div>
                          <span className="font-medium">Total: </span> 
                          {formatCurrency((getCurrentPrice(selectedProduct, priceType) * quantity - discount).toFixed(2))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Items ({purchaseItems?.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {purchaseItems?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems?.map((item:any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-sm text-muted-foreground">{item.productBarcode}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.priceType === "wholesale" ? "default" : "secondary"}>
                                {item.priceType}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(item.selectedPrice)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                 
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                  className="w-16"
                                />
                                <span className="text-xs text-muted-foreground">{item.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">${item.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Details */}
            <div className="space-y-6">
              {/* Purchase Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Purchase Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax ({taxRate}%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shipping:</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Grand Total:</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid Amount:</span>
                      <span>${paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Balance:</span>
                      <span>${(grandTotal - paidAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping">Shipping Cost</Label>
                      <Input
                        id="shipping"
                        type="number"
                        min="0"
                        value={shipping}
                        onChange={(e) => setShipping(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paid-amount">Paid Amount</Label>
                      <Input
                        id="paid-amount"
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value: "ordered" | "received" | "pending") => setStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <div className="p-2 bg-muted rounded-md">
                      <span className="font-medium">{getPaymentStatus().toUpperCase()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any additional notes or comments..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline">Save as Draft</Button>
            <Button
              onClick={handleSubmit}
              disabled={purchaseItems.length === 0 || !selectedSupplier}
            >
              <Check className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Purchase Order Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Your purchase order has been created with invoice number:{" "}
                <strong>{createdPurchase?.invoiceNumber}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
                Close
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Printer className="mr-2 h-4 w-4" />
                Print Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
     </>
  )
}
