"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Stethoscope, 
  ArrowLeft, 
  Edit, 
  Printer, 
  User, 
  FileText, 
  Calendar, 
  DollarSign,
  Pill,
  Clock,
  AlertCircle
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"

interface ConsultationData {
  invoiceNo: string
  createdAt: string
  subTotal: number
  taxRate: number
  grandTotal: number
  amountPaid: number
  balance: number
  notes: string
  diagnosis: string
  symptoms: string
  consultantNotes: string
  selectedStudent: {
    id: string
    name: string
    matricNumber: string
    phone: string
    email: string
    bloodGroup: string
    genotype: string
    allergies: string
  }
  consultationItems: Array<{
    id: string
    productName: string
    quantity: number
    selectedPrice: number
    dosage: string
    frequency: string
    duration: string
    instructions: string
    discount: number
    total: number
    product: {
      name: string
      barcode: string
    }
  }>
  paymentMethod: Array<{
    method: string
    amount: number
  }>
}

export default function ConsultationDetailPage() {
  const [consultation, setConsultation] = useState<ConsultationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [endpoint, setEndPoint] = useState("")
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const warehouseId = getWareHouseId()

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const response = await fetch(`/api/consultation/${params.consultationId}`)
        const consultations = await response.json()
        const consultationData = consultations
        setConsultation(consultationData)
      } catch (error) {
        console.error("Error fetching consultation:", error)
      } finally {
        setLoading(false)
      }
    }

    if (warehouseId) {
      fetchConsultation()
    }
  }, [warehouseId, params.consultationId])

  if (loading) return <Loading/>
  if (!consultation) return <div>Consultation not found</div>

  const getStatusBadge = () => {
    if (consultation.balance === 0) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
    } else if (consultation.balance > 0 && consultation.amountPaid > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial Payment</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
    }
  }

  const handleEdit = () => {
    router.push(`${endpoint}/sales/consultations/${consultation.invoiceNo}/edit`)
  }

  const handlePrint = () => {
    // Implement print functionality
    window.print()
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
                <BreadcrumbLink href={`${endpoint}/dashboard`}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`${endpoint}/sales`}>Sales</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`${endpoint}/sales/consultations`}>Consultations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{consultation.invoiceNo}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-600">Consultation Details</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Consultation Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consultation Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <p className="text-lg font-semibold">{consultation.invoiceNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-lg font-semibold">
                    {new Date(consultation.createdAt).toLocaleDateString()} at {new Date(consultation.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(consultation.grandTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{consultation.selectedStudent.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Matric Number</label>
                  <p className="text-lg font-semibold">{consultation.selectedStudent.matricNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg font-semibold">{consultation.selectedStudent.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg font-semibold">{consultation.selectedStudent.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                  <p className="text-lg font-semibold">{consultation.selectedStudent.bloodGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Genotype</label>
                  <p className="text-lg font-semibold">{consultation.selectedStudent.genotype}</p>
                </div>
              </div>
              {consultation.selectedStudent.allergies && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Allergies</label>
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {consultation.selectedStudent.allergies}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Medical Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Diagnosis</label>
                <p className="text-lg font-semibold">{consultation.diagnosis || 'No diagnosis provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Symptoms</label>
                <p className="text-sm">{consultation.symptoms || 'No symptoms recorded'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Consultant Notes</label>
                <p className="text-sm">{consultation.consultantNotes || 'No notes provided'}</p>
              </div>
              {consultation.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Additional Notes</label>
                  <p className="text-sm">{consultation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subtotal</label>
                  <p className="text-lg font-semibold">{formatCurrency(consultation.subTotal)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax Rate</label>
                  <p className="text-lg font-semibold">{consultation.taxRate}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(consultation.amountPaid)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Balance</label>
                  <p className={`text-lg font-semibold ${consultation.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(consultation.balance)}
                  </p>
                </div>
              </div>
              {consultation.paymentMethod && consultation.paymentMethod.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Methods</label>
                  <div className="space-y-2">
                    {consultation.paymentMethod.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{payment.method}</span>
                        <span className="text-green-600">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prescribed Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescribed Items ({consultation.consultationItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultation.consultationItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">Barcode: {item.product?.barcode || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.selectedPrice)}</TableCell>
                    <TableCell>{item.dosage || 'N/A'}</TableCell>
                    <TableCell>{item.frequency || 'N/A'}</TableCell>
                    <TableCell>{item.duration || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={item.instructions}>
                        {item.instructions || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}