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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  ArrowLeft, 
  Edit, 
  Stethoscope, 
  FileText, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  GraduationCap,
  CreditCard
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"

interface StudentData {
  id: string
  name: string
  matricNumber: string
  email: string
  phone: string
  address: string
  bloodGroup: string
  genotype: string
  allergies: string
  emergencyContact: string
  emergencyPhone: string
  department: string
  level: string
  createdAt: string
  updatedAt: string
  Consultation: Array<{
    invoiceNo: string
    createdAt: string
    diagnosis: string
    symptoms: string
    grandTotal: number
    amountPaid: number
    balance: number
    consultationItems: Array<{
      productName: string
      quantity: number
      selectedPrice: number
      dosage: string
      frequency: string
      duration: string
      instructions: string
    }>
  }>
  balanceTransaction: Array<{
    id: string
    amount: number
    type: string
    description: string
    createdAt: string
  }>
}

export default function StudentDetailPage() {
  const [student, setStudent] = useState<StudentData | null>(null)
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
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/student/${params.studentId}`)
        if (response.ok) {
          const studentData = await response.json()
          setStudent(studentData)
        } else {
          console.error("Student not found")
        }
      } catch (error) {
        console.error("Error fetching student:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.studentId) {
      fetchStudent()
    }
  }, [params.studentId])

  if (loading) return <Loading/>
  if (!student) return <div>Student not found</div>

  const totalConsultations = student.Consultation.length
  const totalSpent = student.Consultation.reduce((sum, consultation) => sum + consultation.grandTotal, 0)
  const totalPaid = student.Consultation.reduce((sum, consultation) => sum + consultation.amountPaid, 0)
  const totalBalance = student.Consultation.reduce((sum, consultation) => sum + consultation.balance, 0)

  const handleEdit = () => {
    router.push(`${endpoint}/people/students/${student.id}/edit`)
  }

  const handleViewConsultation = (consultationId: string) => {
    router.push(`${endpoint}/sales/consultations/${consultationId}`)
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
                <BreadcrumbLink href={`${endpoint}/people`}>People</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`${endpoint}/people/students`}>Students</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{student.name}</BreadcrumbPage>
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
              <User className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-600">{student.name}</h1>
            </div>
          </div>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
        </div>

        {/* Student Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConsultations}</div>
              <p className="text-xs text-muted-foreground">Medical visits</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">Paid amount</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Remaining balance</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="medical">Medical Records</TabsTrigger>
            <TabsTrigger value="consultations">Consultation History</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-lg font-semibold">{student.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Matric Number</label>
                      <p className="text-lg font-semibold">{student.matricNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="text-lg font-semibold">{student.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Level</label>
                      <p className="text-lg font-semibold">{student.level}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{student.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{student.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                    <p className="text-lg font-semibold">{student.emergencyContact}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Phone</label>
                    <p className="text-lg font-semibold">{student.emergencyPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="medical" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                      <p className="text-lg font-semibold">{student.bloodGroup}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Genotype</label>
                      <p className="text-lg font-semibold">{student.genotype}</p>
                    </div>
                  </div>
                  {student.allergies && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Allergies</label>
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {student.allergies}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="text-lg font-semibold">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-lg font-semibold">
                        {new Date(student.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Consultation History Tab */}
          <TabsContent value="consultations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Consultation History ({totalConsultations})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.Consultation.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.Consultation.map((consultation) => (
                        <TableRow key={consultation.invoiceNo}>
                          <TableCell className="font-medium">{consultation.invoiceNo}</TableCell>
                          <TableCell>
                            {new Date(consultation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {consultation.diagnosis || 'No diagnosis'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {consultation.consultationItems.length} items
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(consultation.grandTotal)}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {formatCurrency(consultation.amountPaid)}
                          </TableCell>
                          <TableCell className={consultation.balance > 0 ? "text-red-600" : "text-green-600"}>
                            {formatCurrency(consultation.balance)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewConsultation(consultation.invoiceNo)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Stethoscope className="mx-auto h-12 w-12 mb-4" />
                    <p>No consultation records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Transaction History ({student.balanceTransaction.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.balanceTransaction.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.balanceTransaction.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="mx-auto h-12 w-12 mb-4" />
                    <p>No transaction records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}