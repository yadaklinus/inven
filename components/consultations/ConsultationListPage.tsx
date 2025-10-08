"use client"

import { useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Plus, Search, Edit, Eye, Printer, Calendar, DollarSign, User, Trash2, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"

export default function ConsultationListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [endpoint, setEndPoint] = useState("")
  const { data: session } = useSession()

  const router = useRouter()
  const warehouseId = getWareHouseId()
  const { data: consultationData, loading, error } = fetchWareHouseData("/api/consultation/list", { warehouseId })
  
  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])
  
  if (!consultationData) return <Loading/>

  const filteredConsultations = consultationData.filter((consultation: any) => {
    const matchesSearch =
      consultation.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.selectedStudent?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.selectedStudent?.matricNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || 
      (consultation.balance === 0 ? "completed" : 
       consultation.balance > 0 && consultation.amountPaid > 0 ? "partial" : "pending")

    const matchesDate = dateFilter === "all" || consultation.createdAt === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (consultation: any) => {
    if (consultation.balance === 0) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
    } else if (consultation.balance > 0 && consultation.amountPaid > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial Payment</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
    }
  }

  const handleView = (consultationId: string) => {
    router.push(`${endpoint}/sales/consultations/${consultationId}`)
  }

  const handleEdit = (consultationId: string) => {
    router.push(`${endpoint}/sales/consultations/${consultationId}/edit`)
  }

  const handleDelete = async (consultationId: string) => {
    if (!confirm("Are you sure you want to delete this consultation? This will return the products back to stock.")) {
      return
    }

    try {
      const response = await fetch("/api/consultation", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consultationId }),
      })

      if (response.ok) {
        alert("Consultation deleted successfully and products returned to stock!")
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Error: ${error}`)
      }
    } catch (error) {
      alert("Error deleting consultation")
      console.error(error)
    }
  }

  const totalConsultations = filteredConsultations.length
  const completedConsultations = filteredConsultations.filter((consultation: any) => consultation.balance === 0).length
  const pendingPayments = filteredConsultations
    .filter((consultation: any) => consultation.balance > 0)
    .reduce((sum: any, consultation: any) => sum + consultation.balance, 0)

  const totalRevenue = filteredConsultations.reduce((sum: any, consultation: any) => sum + consultation.grandTotal, 0)

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
                <BreadcrumbPage>Consultations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">Consultations</h1>
          </div>
          <Link href={`${endpoint}/sales/add`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Consultation
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConsultations}</div>
              <p className="text-xs text-muted-foreground">All consultations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedConsultations}</div>
              <p className="text-xs text-muted-foreground">Fully paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pendingPayments)}</div>
              <p className="text-xs text-muted-foreground">Outstanding balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From consultations</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice, student name or matric number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Consultations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Consultations List ({filteredConsultations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations?.map((consultation: any) => (
                  <TableRow key={consultation.invoiceNo}>
                    <TableCell className="font-medium">{consultation.invoiceNo}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(consultation.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(consultation.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{consultation.selectedStudent?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {consultation.selectedStudent?.matricNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {consultation.diagnosis || 'No diagnosis'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {consultation.consultationItems?.length || 0} item{(consultation.consultationItems?.length || 0) > 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(consultation.grandTotal)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(consultation.amountPaid)}</TableCell>
                    <TableCell className={consultation.balance > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(consultation.balance)}
                    </TableCell>
                    <TableCell>{getStatusBadge(consultation)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(consultation.invoiceNo)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(consultation.invoiceNo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(consultation.invoiceNo)} 
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredConsultations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="mx-auto h-12 w-12 mb-4" />
                <p>No consultations found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}