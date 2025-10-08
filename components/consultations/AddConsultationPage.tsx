"use client"

import { useEffect, useRef, useState } from "react"
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
import {
  Stethoscope,
  Plus,
  Trash2,
  Calculator,
  Printer,
  Check,
  ChevronsUpDown,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react"
import { usePrintReceipt } from "@/hooks/use-print-receipt"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import axios from "axios"
import { SystemStatus } from "@/components/system-status"
import { useSession } from "next-auth/react"
import { Wallet } from "lucide-react"
import { useMemo } from "react"

interface ConsultationItem {
  id: string
  productId: string
  productName: string
  productBarcode: string
  cost: number
  wholeSalePrice: number
  retailPrice: number
  selectedPrice: number
  priceType: "wholesale" | "retail" | "cost"
  quantity: number
  dosage: string
  frequency: string
  duration: string
  instructions: string
  discount: number
  total: number
  unit: string
  taxRate: number
  limit: number
}

interface PaymentMethod {
  id: string
  method: "cash" | "card" | "bank_transfer" | "check" | "mobile_money" | "balance"
  amount: number
  reference?: string
  notes?: string
}

interface CompletedConsultation {
  consultationId: string
  invoiceNo: string
  date: string
  time: string
  student: {
    id: string
    name: string
    matricNumber: string
    email: string
    phone: string
    bloodGroup: string
    genotype: string
    allergies: string
  }
  diagnosis: string
  symptoms: string
  items: Array<{
    productId: string
    productName: string
    productCode: string
    costPrice: number
    salePrice: number
    priceType: "wholesale" | "retail" | "cost"
    quantity: number
    dosage: string
    frequency: string
    duration: string
    instructions: string
    discount: number
    total: number
    profit: number
  }>
  subtotal: number
  totalDiscount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  paymentMethods: PaymentMethod[]
  totalPaid: number
  balance: number
  notes: string
  consultant: string
  warehouseId: string
}

export default function AddConsultationPage() {
  const [consultationItems, setConsultationItems] = useState<ConsultationItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState<any>("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [duration, setDuration] = useState("")
  const [instructions, setInstructions] = useState("")
  const [discount, setDiscount] = useState(0)
  const [priceType, setPriceType] = useState<"wholesale" | "retail" | "cost">("retail")
  const [taxRate, setTaxRate] = useState(0)
  const [diagnosis, setDiagnosis] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [consultantNotes, setConsultantNotes] = useState("")
  const [notes, setNotes] = useState("")
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedConsultation, setCompletedConsultation] = useState<CompletedConsultation | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [endPoint, setEndPoint] = useState("")
  const [studentBalance, setStudentBalance] = useState(0)
  const [useBalancePayment, setUseBalancePayment] = useState(false)
  const [balancePaymentAmount, setBalancePaymentAmount] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  // Multiple payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<
    "cash" | "card" | "bank_transfer" | "check" | "mobile_money"
  >("cash")
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<any>("")
  const [currentPaymentReference, setCurrentPaymentReference] = useState("")
  const [currentPaymentNotes, setCurrentPaymentNotes] = useState("")
  const {data:session} = useSession() 

  const router = useRouter()
  const { printReceipt } = usePrintReceipt()
  const warehouseId = getWareHouseId()

  const quantityInputRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const productSearchRef = useRef<HTMLButtonElement>(null)
  const paymentAmountRef = useRef<HTMLInputElement>(null)
  const finalizeConsultationButtonRef = useRef<HTMLButtonElement>(null)
  const allButtonRef = useRef<HTMLButtonElement>(null)
  const addPaymentButtonRef = useRef<HTMLButtonElement>(null)
  const printButtonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "n") {
        event.preventDefault()
        router.push(`/warehouse/${warehouseId}/admin/sales/add`)
      }
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault()
        setQuantity("")
        productSearchRef.current?.click()
      }
      if (event.ctrlKey && event.key === "p") {
        event.preventDefault()
        printButtonRef.current?.click()
      }
      if (event.ctrlKey && event.key === "f") {
        event.preventDefault()
        finalizeConsultationButtonRef.current?.click()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [router, warehouseId])
        
  const {data:products,loading,error} = fetchWareHouseData("/api/product/list",{warehouseId})
  const {data:students,loading:loadingStudents,error:errorStudents} = fetchWareHouseData("/api/student/list",{warehouseId})

  const filteredProducts = useMemo(() => {
    if (!products) return []
    
    const query = searchQuery.toLowerCase().trim()
    if (query.length === 0) {
      return products.slice(0, 50)
    }
    
    if (query.length < 2) {
      return []
    }
    
    const filtered = products.filter((product: any) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.barcode.toLowerCase().includes(query) ||
        product.unit.toLowerCase().includes(query)
      )
    })
    
    return filtered.slice(0, 100)
  }, [products, searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setIsSearching(true)
    
    setTimeout(() => {
      setIsSearching(false)
    }, 300)
  }

  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
    if (students && students.length > 0) {
      const guestStudent = students.find(
        (s: any) => s.name?.toLowerCase().trim() === "guest"
      );
      if (guestStudent) {
        setSelectedStudent(guestStudent.id);
      }
    }
  },[session,warehouseId,students])

  if(!products && !students) return (
    <Loading/>
  )
         
  console.log(students)
  const selectedProduct = products?.find((p:any) => p.id === selectedProductId)
  const selectedStudentData = students?.find((s:any) => s.id === selectedStudent)

  const fetchStudentBalance = async (studentId: string) => {
    try {
      const response = await fetch(`/api/student/balance/${studentId}`)
      if (response.ok) {
        const balanceData = await response.json()
        setStudentBalance(balanceData.balance || 0)
      } else {
        setStudentBalance(0)
      }
    } catch (error) {
      console.error('Error fetching student balance:', error)
      setStudentBalance(0)
    }
  }

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId)
    const student = students?.find((s:any) => s.id === studentId)
    if (student) {
      setPriceType("retail")
      fetchStudentBalance(studentId)
    }
    setUseBalancePayment(false)
    setBalancePaymentAmount("")
  }

  const getCurrentPrice = (product: (typeof products)[0], type: "wholesale" | "retail" | "cost") => {
    if(type === "wholesale"){
      return product.wholeSalePrice
    }else if(type === "retail"){
      return product.retailPrice
    }else{
      return product.cost
    }
    return type === "wholesale" ? product.wholeSalePrice : product.retailPrice
  }

  const addProductToConsultation = (isBarcode = false) => {
    if (!selectedProduct) return

    const currentQuantity = isBarcode ? 1 : quantity
    const selectedPrice = getCurrentPrice(selectedProduct, priceType)

    // Check if product already exists in consultation with same price type
    const existingItemIndex = consultationItems?.findIndex(
      (item) => item.productId === selectedProduct.id && item.priceType === priceType,
    )

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...consultationItems]
      const existingItem = updatedItems[existingItemIndex]
      existingItem.quantity += currentQuantity
      existingItem.discount += discount
      existingItem.total = existingItem.selectedPrice * existingItem.quantity - existingItem.discount
      setConsultationItems(updatedItems)
    } else {
      // Add new item
      const itemTotal = selectedPrice * currentQuantity - discount
      const newItem: ConsultationItem = {
        id: `ITEM-${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productBarcode: selectedProduct.barcode,
        cost: selectedProduct.cost,
        wholeSalePrice: selectedProduct.wholeSalePrice,
        retailPrice: selectedProduct.retailPrice,
        selectedPrice,
        priceType,
        quantity: currentQuantity,
        dosage,
        frequency,
        duration,
        instructions,
        discount,
        total: itemTotal,
        unit: selectedProduct.unit,
        taxRate: selectedProduct.taxRate,
        limit: selectedProduct.quantity
      }
      setConsultationItems([...consultationItems, newItem])
    }

    // Reset form
    setSelectedProductId("")
    setQuantity("")
    setDosage("")
    setFrequency("")
    setDuration("")
    setInstructions("")
    setDiscount(0)

    setQuantity("")
    productSearchRef.current?.click()
  }

  const removeItem = (itemId: string) => {
    setConsultationItems(consultationItems?.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setConsultationItems(
      consultationItems?.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.selectedPrice * newQuantity - item.discount
          return { ...item, quantity: newQuantity, total: newTotal }
        }
        return item
      }),
    )
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-600", text: "Out of Stock" }
    if (stock <= 5) return { color: "text-yellow-600", text: "Low Stock" }
    return { color: "text-green-600", text: "In Stock" }
  }

  // Payment methods functions
  const addPaymentMethod = () => {
    const amount = Number.parseFloat(currentPaymentAmount)
    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    const totalPaid = paymentMethods?.reduce((sum, pm) => sum + pm.amount, 0)
    const remaining = grandTotal - totalPaid

    if (amount > remaining) {
      alert(`Payment amount cannot exceed remaining balance of $${remaining.toFixed(2)}`)
      return
    }

    const newPayment: PaymentMethod = {
      id: `PAY-${Date.now()}`,
      method: currentPaymentMethod,
      amount,
      reference: currentPaymentReference || undefined,
      notes: currentPaymentNotes || undefined,
    }

    setPaymentMethods([...paymentMethods, newPayment])

    // Reset payment form
    setCurrentPaymentAmount("")
    setCurrentPaymentReference("")
    setCurrentPaymentNotes("")
  }

  const removePaymentMethod = (paymentId: string) => {
    setPaymentMethods(paymentMethods.filter((pm) => pm.id !== paymentId))
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "bank_transfer":
        return <Smartphone className="h-4 w-4" />
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />
      case "balance":
        return <Wallet className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash"
      case "card":
        return "Card"
      case "bank_transfer":
        return "Bank Transfer"
      case "check":
        return "Check"
      case "mobile_money":
        return "Mobile Money"
      case "balance":
        return "Account Balance"
      default:
        return method
    }
  }

  const subtotal = consultationItems?.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = consultationItems?.reduce((sum, item) => sum + item.discount, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = subtotal + taxAmount
  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0)
  const balance = grandTotal - totalPaid

  console.log(consultationItems)
  const handleFormSubmit = async () => {
    if (consultationItems?.length === 0 || !selectedStudent) {
      alert("Please complete all required fields")
      return
    }
  
    if (paymentMethods.length === 0) {
      alert("Please add at least one payment method")
      return
    }
  
    setIsSubmitting(true)
  
    try {
      const currentDate = new Date()
      const invoiceNo = `CON-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`
      const consultationId = `CONSULT-${Date.now()}`
  
      // Check if there are balance payments
      const balancePayments = paymentMethods.filter(pm => pm.method === "balance")
      const totalBalanceUsed = balancePayments.reduce((sum, pm) => sum + pm.amount, 0)
      
      // Calculate remaining amount after balance payment
      const remainingAmount = grandTotal - totalBalanceUsed
      const otherPayments = paymentMethods.filter(pm => pm.method !== "balance")
      const otherPaymentsTotal = otherPayments.reduce((sum, pm) => sum + pm.amount, 0)
      
      // Calculate final balance (debt)
      const finalBalance = remainingAmount - otherPaymentsTotal
  
      // Prepare consultation data
      const consultationData = {
        items: consultationItems?.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          costPrice: item.cost,
          salePrice: item.selectedPrice,
          priceType: item.priceType,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          discount: item.discount,
          total: item.total,
        })),
        invoiceNo,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods: otherPayments,
        amountPaid: otherPaymentsTotal + totalBalanceUsed,
        balance: finalBalance,
        diagnosis,
        symptoms,
        consultantNotes,
        notes,
        cashier: "Clinic Consultant",
        warehouseId,
        student: {
          id: selectedStudentData?.id || "",
          name: selectedStudentData?.name || "Walk-in Student",
        }
      }
  
      // First, create the consultation
      const consultationResponse = await axios.post("/api/consultation", consultationData)
  
      if (!consultationResponse.data || consultationResponse.status !== 200) {
        throw new Error("Failed to create consultation")
      }
  
      // If there were balance payments, deduct from student balance
      if (totalBalanceUsed > 0) {
        try {
          await fetch(`/api/student/balance/${selectedStudent}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: totalBalanceUsed,
              description: `Consultation payment - Invoice ${invoiceNo}`,
              saleId: invoiceNo,
              warehouseId,
            }),
          })
        } catch (balanceError) {
          console.error("Error deducting balance:", balanceError)
          alert("Consultation completed but there was an issue updating the student balance. Please check manually.")
        }
      }
  
      // Create completed consultation data for display
      const completedConsultationData: CompletedConsultation = {
        consultationId,
        invoiceNo,
        date: currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: currentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        student: {
          id: selectedStudentData?.id || "",
          name: selectedStudentData?.name || "Walk-in Student",
          matricNumber: selectedStudentData?.matricNumber || "",
          email: selectedStudentData?.email || "",
          phone: selectedStudentData?.phone || "",
          bloodGroup: selectedStudentData?.bloodGroup || "",
          genotype: selectedStudentData?.genotype || "",
          allergies: selectedStudentData?.allergies || "",
        },
        diagnosis,
        symptoms,
        items: consultationItems?.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productBarcode,
          costPrice: item.cost,
          salePrice: item.selectedPrice,
          priceType: item.priceType,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          discount: item.discount,
          total: item.total,
          profit: item.total - item.cost * item.quantity,
        })),
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods: [...paymentMethods],
        totalPaid: totalPaid,
        balance: finalBalance,
        notes,
        consultant: "Clinic Consultant",
        warehouseId
      }
  
      // Update local student balance for UI
      if (totalBalanceUsed > 0) {
        setStudentBalance(prev => prev - totalBalanceUsed)
      }
  
      // Set completed consultation data and show success dialog
      setCompletedConsultation(completedConsultationData)
      setShowSuccessDialog(true)
  
      // Reset form
      setConsultationItems([])
      setSelectedStudent("")
      setPaymentMethods([])
      setDiagnosis("")
      setSymptoms("")
      setConsultantNotes("")
      setNotes("")
      setTaxRate(10)
      setStudentBalance(0)
      setUseBalancePayment(false)
      setBalancePaymentAmount("")
      
    } catch (error) {
      console.error("Error saving consultation:", error)
      alert("Error completing consultation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintReceipt = (paperWidth: "57mm" | "80mm" | "A4") => {
    if (!completedConsultation) return

    const receiptData = {
      invoiceNo: completedConsultation.invoiceNo,
      date: completedConsultation.date,
      time: completedConsultation.time,
      customer: completedConsultation.student.name,
      cashier: completedConsultation.consultant,
      items: completedConsultation.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.salePrice,
        total: item.total,
      })),
      subtotal: completedConsultation.subtotal,
      discount: completedConsultation.totalDiscount,
      tax: completedConsultation.taxAmount,
      total: completedConsultation.grandTotal,
      paymentMethods: completedConsultation.paymentMethods,
      totalPaid: completedConsultation.totalPaid,
      balance: completedConsultation.balance,
    }

    printReceipt(receiptData, paperWidth)
  }

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setCompletedConsultation(null)
  }

  const handleNewConsultation = () => {
    handleCloseSuccessDialog()
  }

  const addBalancePayment = async () => {
    if (!selectedStudent || !useBalancePayment) return
  
    const balanceAmount = Math.min(
      parseFloat(balancePaymentAmount) || studentBalance,
      studentBalance,
      grandTotal - totalPaid
    )
  
    if (balanceAmount <= 0) {
      alert("Invalid balance payment amount")
      return
    }
  
    // Add balance as a payment method
    const balancePayment: PaymentMethod = {
      id: `BAL-${Date.now()}`,
      method: "balance" as any,
      amount: balanceAmount,
      reference: "Account Balance",
      notes: `Paid from account balance`,
    }
  
    setPaymentMethods([...paymentMethods, balancePayment])
    setUseBalancePayment(false)
    setBalancePaymentAmount("")
  }

  const handleViewConsultations = () => {
    handleCloseSuccessDialog()
    router.push(`${endPoint}/sales/list`)
  }
  
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    const product = products.find((p: any) => p.id === productId)
    if (product) {
      const isBarcodeScan = quantity === "" || quantity === 1
      if (isBarcodeScan) {
        setQuantity(1)
        addProductToConsultation(true)
      } else {
        quantityInputRef.current?.focus()
      }
    }
    setOpen(false)
    setSearchQuery("")
    setTimeout(() => quantityInputRef.current?.focus(), 0)
  }
  
  const updateItemDiscount = (itemId: string, newDiscount: number) => {
    setConsultationItems(
      consultationItems?.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.selectedPrice * item.quantity - newDiscount
          return { ...item, discount: newDiscount, total: Math.max(0, newTotal) }
        }
        return item
      }),
    )
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
                  <BreadcrumbLink href={`${endPoint}/dashboard`}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${endPoint}/sales/list`}>Consultations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>New Consultation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus/>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">New Consultation</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Consultation Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedStudent} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student:any) => (
                        <SelectItem key={student.id} value={student.id}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.matricNumber} • {student.department || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudentData && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Blood Group:</span> {selectedStudentData.bloodGroup || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Genotype:</span> {selectedStudentData.genotype || 'N/A'}
                        </div>
                        {selectedStudentData.allergies && (
                          <div className="col-span-2">
                            <span className="font-medium text-red-600">Allergies:</span> {selectedStudentData.allergies}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Diagnosis and Symptoms */}
              <Card>
                <CardHeader>
                  <CardTitle>Diagnosis & Symptoms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis/Complaint *</Label>
                    <Textarea
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="What is wrong with the student? Describe the condition or complaint..."
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Describe any symptoms the student is experiencing..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultantNotes">Consultant Notes</Label>
                    <Textarea
                      id="consultantNotes"
                      value={consultantNotes}
                      onChange={(e) => setConsultantNotes(e.target.value)}
                      placeholder="Additional notes from the consultant..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Medicine Selection */}
              <Card>
              <CardHeader>
    <CardTitle>Prescribe Medicine</CardTitle>
    <CardDescription>Select medicines to prescribe to the student</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Optimized Product Combobox */}
    <div className="space-y-2">
      <Label>Medicine</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={productSearchRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-transparent",
              selectedProductId && "bg-blue-50 border-blue-200 text-blue-900"
            )}
          >
            {selectedProductId ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {products?.find((product: any) => product.id === selectedProductId)?.name}
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Selected
                </Badge>
              </div>
            ) : (
              "Search medicines... (Type to search)"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Type medicine name, barcode, or unit..." 
              className="h-9"
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList className="max-h-[300px] overflow-auto">
              {filteredProducts.length === 0 ? (
                <CommandEmpty>
                  {searchQuery.length === 0 
                    ? "Start typing to search medicines..." 
                    : "No medicines found"}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchQuery.length === 0 && (
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                      Showing first 50 medicines - type to search all medicines
                    </div>
                  )}
                  {filteredProducts.map((product: any) => {
                    const stockStatus = getStockStatus(product.quantity)
                    const isSelected = selectedProductId === product.id
                    
                    return (
                      <CommandItem
                        key={product.id}
                        value={`${product.name} ${product.barcode} ${product.unit}`}
                        onSelect={() => handleProductSelect(product.id)}
                        className={cn(
                          "group flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors",
                          "hover:bg-blue-600 hover:text-white",
                          "data-[selected=true]:bg-blue-600 data-[selected=true]:text-white",
                          "focus:bg-blue-600 focus:text-white",
                          "aria-selected:bg-blue-600 aria-selected:text-white",
                          isSelected && "bg-blue-50 border-l-4 border-blue-500"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium transition-colors",
                              isSelected && "text-blue-900"
                            )}>
                              {product.name}
                            </span>
                            {isSelected && (
                              <Badge variant="default" className="bg-blue-600">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm transition-colors group-hover:text-blue-100">
                              W: {formatCurrency(product.wholeSalePrice)}
                            </span>
                            <span className="font-semibold transition-colors group-hover:text-white">
                              R: {formatCurrency(product.retailPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full text-sm transition-colors group-hover:text-blue-100">
                          <span>
                            {product.barcode} • {product.unit}
                          </span>
                          <span className={cn(
                            stockStatus.color,
                            "transition-colors group-hover:text-blue-100"
                          )}>
                            {product.quantity} in stock
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="absolute right-2 top-2 h-4 w-4 text-blue-600 transition-colors group-hover:text-white" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Quick stats when dropdown is closed */}
      {!open && products && (
        <div className="text-xs text-muted-foreground">
          {products.length} total medicines available
        </div>
      )}
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
      
                        {/* Quantity, Dosage, and Prescription Details */}
                        {selectedProduct && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity *</Label>
                              <Input
                                id="quantity"
                                type="number"
                                ref={quantityInputRef}
                                max={selectedProduct.quantity}
                                value={quantity}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    addButtonRef.current?.click()
                                  }
                                }}
                                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="discount">Discount</Label>
                              <Input
                                id="discount"
                                type="number"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Dosage Information */}
                        {selectedProduct && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="dosage">Dosage *</Label>
                              <Input
                                id="dosage"
                                value={dosage}
                                onChange={(e) => setDosage(e.target.value)}
                                placeholder="e.g., 500mg, 1 tablet, 5ml"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="frequency">Frequency *</Label>
                              <Input
                                id="frequency"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                placeholder="e.g., twice daily, as needed"
                                required
                              />
                            </div>
                          </div>
                        )}

                        {/* Duration and Instructions */}
                        {selectedProduct && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="duration">Duration *</Label>
                              <Input
                                id="duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g., 5 days, until finished"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="instructions">Additional Instructions</Label>
                              <Input
                                id="instructions"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="e.g., take with food"
                              />
                            </div>
                          </div>
                        )}

                        {/* Add Medicine Button */}
                        {selectedProduct && (
                          <Button
                            ref={addButtonRef}
                            onClick={() => addProductToConsultation()}
                            className="w-full"
                            disabled={selectedProduct.quantity === 0 || quantity > selectedProduct.quantity}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Medicine to Prescription
                          </Button>
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

              {/* Prescription Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Prescription ({consultationItems?.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {consultationItems?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Stethoscope className="mx-auto h-12 w-12 mb-4" />
                      <p>No medicines prescribed yet</p>
                    </div>
                  ) : (
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultationItems?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-muted-foreground">{item.productBarcode}</div>
                              {item.instructions && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Note: {item.instructions}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{item.dosage}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{item.frequency}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{item.duration}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                max={item.limit}
                                onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                className="w-16"
                              />
                              <span className="text-xs text-muted-foreground">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(item.selectedPrice.toFixed(2))}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
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

            {/* Right Column - Summary & Payment */}
            <div className="space-y-6">
              {/* Consultation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%):</span>
                      <span>{formatCurrency(taxAmount.toFixed(2))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(grandTotal.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>{formatCurrency(totalPaid.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Balance:</span>
                      <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(Math.abs(balance).toFixed(2))}
                      </span>
                    </div>
                  </div>

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
                </CardContent>
              </Card>

              {/* Multiple Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Add multiple payment methods for this consultation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Payment Form */}
                  {selectedStudent && studentBalance > 0 && (
                        <div className="p-4 border rounded-lg border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-700">Account Balance Available</span>
                            </div>
                            <span className="font-bold text-green-700">
                              {formatCurrency(studentBalance)}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="useBalance"
                                checked={useBalancePayment}
                                onChange={(e) => setUseBalancePayment(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="useBalance">Pay with account balance</Label>
                            </div>
                            
                            {useBalancePayment && (
                              <div className="space-y-2">
                                <Label htmlFor="balanceAmount">Amount to use from balance</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="balanceAmount"
                                    type="number"
                                    placeholder="0.00"
                                    max={Math.min(studentBalance, grandTotal - totalPaid)}
                                    value={balancePaymentAmount}
                                    onChange={(e) => setBalancePaymentAmount(e.target.value)}
                                  />
                                  <Button
                                    onClick={() => setBalancePaymentAmount(
                                      Math.min(studentBalance, grandTotal - totalPaid).toString()
                                    )}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Max
                                  </Button>
                                </div>
                                <Button
                                  onClick={addBalancePayment}
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <Wallet className="mr-2 h-4 w-4" />
                                  Add Balance Payment
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select
          value={currentPaymentMethod}
          onValueChange={(value: any) => setCurrentPaymentMethod(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            ref={paymentAmountRef}
            type="number"
            placeholder="0.00"
            value={currentPaymentAmount}
            onChange={(e) => setCurrentPaymentAmount(e.target.value)}
          />
          <Button ref={allButtonRef} onClick={()=>setCurrentPaymentAmount(grandTotal)}>All</Button>&nbsp;
          <Button onClick={()=>setCurrentPaymentAmount(grandTotal/2)}>Half</Button>
        </div>
        <div className="space-y-2">
          <Label>Reference</Label>
          <Input
            placeholder="Optional"
            value={currentPaymentReference}
            onChange={(e) => setCurrentPaymentReference(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input
          placeholder="Optional notes"
          value={currentPaymentNotes}
          onChange={(e) => setCurrentPaymentNotes(e.target.value)}
        />
      </div>

      <Button ref={addPaymentButtonRef} onClick={addPaymentMethod} className="w-full" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Payment
      </Button>
    </div>

                  {/* Payment Methods List */}
                  {paymentMethods.length > 0 && (
                    <div className="space-y-2">
                      <Label>Added Payments</Label>
                      <div className="space-y-2">
                        {paymentMethods.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            {payment.method === "balance" ? (
                              <Wallet className="h-4 w-4 text-green-600" />
                            ) : (
                              getPaymentMethodIcon(payment.method)
                            )}
                            <div>
                              <div className="font-medium">
                                {payment.method === "balance" 
                                  ? "Account Balance" 
                                  : getPaymentMethodLabel(payment.method)
                                } - {formatCurrency(payment.amount)}
                              </div>
                              {payment.reference && (
                                <div className="text-sm text-muted-foreground">Ref: {payment.reference}</div>
                              )}
                              {payment.notes && <div className="text-sm text-muted-foreground">{payment.notes}</div>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaymentMethod(payment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remaining Balance Alert */}
                  {balance > 0 && paymentMethods.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Remaining Balance:</strong> ${balance.toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Additional consultation notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">

          <Button
              ref={finalizeConsultationButtonRef}
              onClick={handleFormSubmit}
              disabled={consultationItems?.length === 0 || !selectedStudent || paymentMethods.length === 0 || isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Consultation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Consultation Completed Successfully!
              </DialogTitle>
              <DialogDescription>
                {completedConsultation && (
                  <>
                    Invoice {completedConsultation.invoiceNo} has been created for {completedConsultation.student.name}.
                    <br />
                    Diagnosis: {completedConsultation.diagnosis}
                    <br />
                    Total: {formatCurrency(completedConsultation.grandTotal)}
                    <br />
                    Paid: {formatCurrency(completedConsultation.totalPaid)} via {completedConsultation.paymentMethods.length} method(s)
                    {completedConsultation.balance > 0 && (
                      <>
                        <br />
                        Balance: ${completedConsultation.balance}
                      </>
                    )}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <div className="text-sm text-muted-foreground">Would you like to print a receipt?</div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button ref={printButtonRef} className="flex-1">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePrintReceipt("57mm")}>Print 57mm (2¼")</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintReceipt("80mm")}>Print 80mm (3⅛")</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintReceipt("A4")}>Print A4 (Full Page)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={handleNewConsultation} className="flex-1 bg-transparent">
                  New Consultation
                </Button>
                <Button variant="outline" onClick={handleViewConsultations} className="flex-1 bg-transparent">
                  View Consultations
                </Button>
              </div>

              <Button variant="ghost" onClick={handleCloseSuccessDialog} className="mt-2">
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
     </>
  )
}