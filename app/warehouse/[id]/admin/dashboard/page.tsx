"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import {
  Stethoscope,
  Package,
  Users,
  Warehouse,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChartIcon,
  Activity,
  Settings,
  UserCheck,
  Loader2,
  Heart,
  Droplets,
} from "lucide-react"
import { SystemStatus } from "@/components/system-status"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import Link from "next/link"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"
import { SalesCalendar } from "@/components/sales-calendar"
import { DailySalesModal } from "@/components/daily-sales-modal"

interface DashboardData {
  warehouse: {
    id: string
    name: string
    code: string
    address: string
    email: string
    phone: string
  }
  metrics: {
    totalUsers: number
    totalProducts: number
    totalConsultations: number
    totalStudents: number
    totalSuppliers: number
    totalRevenue: number
    avgConsultationValue: number
  }
  recentConsultations: Array<{
    id: string
    invoiceNo: string
    studentName: string
    studentMatric: string
    diagnosis: string
    grandTotal: number
    createdAt: string
    paymentMethod: string
    itemsCount: number
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    barcode: string
    quantity: number
    unit: string
  }>
  topMedicines: Array<{
    productId: string
    name: string
    prescriptions: number
    revenue: number
  }>
  consultationsByMonth: Array<{
    month: string
    consultations: number
    revenue: number
  }>
  userRoles: Array<{
    name: string
    value: number
    color: string
  }>
  studentDepartments: Array<{
    name: string
    value: number
    color: string
  }>
}

export default function DashboardPage() {
  const [endPoint, setEndPoint] = useState("")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDailyModal, setShowDailyModal] = useState(false)
  const {data:session} = useSession()
  
  
  const warehouseId = getWareHouseId()
 


  const {data:dashboardData,loading,error} = fetchWareHouseData("/api/warehouse/dashboard",{warehouseId})
  
  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setShowDailyModal(true)
  }

  const handleCloseModal = () => {
    setShowDailyModal(false)
    setSelectedDate(null)
  }
  
  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  },[session,warehouseId])
  
  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus/>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </>
    )
  }

  if (error || !dashboardData) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus/>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || 'Failed to load dashboard data'}</p>
            </CardContent>
          </Card>
        </div>
      </>
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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus/>
        </header>

       

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">
                {dashboardData.warehouse.name} Clinic Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your clinic.
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboardData.warehouse.address} • {dashboardData.warehouse.email}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.totalConsultations}</div>
                <p className="text-xs text-muted-foreground">
                  This clinic
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.metrics.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total revenue generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medicines</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-yellow-600">{dashboardData.lowStockProducts.length}</span> low stock items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Registered students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">Active suppliers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warehouse Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Consultation Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.metrics.avgConsultationValue)}
                </div>
                <p className="text-xs text-muted-foreground">Per consultation</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          {dashboardData.consultationsByMonth.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-1">
              {/* Monthly Consultations Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Consultations Trend
                  </CardTitle>
                  <CardDescription>Consultations volume and revenue over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.consultationsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "revenue" ? `${Number(value).toLocaleString()}` : value,
                          name === "revenue" ? "Revenue" : "Consultations",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="consultations"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Distribution Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Student Departments */}
            {dashboardData.studentDepartments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Student Department Distribution
                  </CardTitle>
                  <CardDescription>Breakdown by student department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={dashboardData.studentDepartments}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dashboardData.studentDepartments.map((entry:any, index:any) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {dashboardData.studentDepartments.map((item:any, index:any) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Roles */}
            {dashboardData.userRoles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Roles Distribution
                  </CardTitle>
                  <CardDescription>System users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.userRoles.map((role:any, index:any) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                          <span className="text-sm font-medium capitalize">{role.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={dashboardData.metrics.totalUsers > 0 ? (role.value / dashboardData.metrics.totalUsers) * 100 : 0} 
                            className="w-20 h-2" 
                          />
                          <span className="text-sm text-muted-foreground">{role.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Daily Sales Calendar */}
          <div className="grid gap-6">
            <SalesCalendar
              warehouseId={warehouseId}
              onDateClick={handleDateClick}
              apiEndpoint="/api/sale/daily-analytics"
              className="w-full"
            />
          </div>

          {/* Data Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Consultations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Consultations
                </CardTitle>
                <CardDescription>Latest consultations in this clinic</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.recentConsultations.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentConsultations.map((consultation:any) => (
                      <div key={consultation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{consultation.invoiceNo}</div>
                          <div className="text-sm text-muted-foreground">{consultation.studentName}</div>
                          <div className="text-xs text-muted-foreground">{consultation.studentMatric}</div>
                          <div className="text-xs text-blue-600 font-medium">{consultation.diagnosis}</div>
                          <div className="text-xs text-muted-foreground">{consultation.itemsCount} medicines</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(consultation.grandTotal)}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {consultation.paymentMethod.replace("_", " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(consultation.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent consultations</p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>Medicines requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.lowStockProducts.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.lowStockProducts.map((product:any) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.barcode}</div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={product.quantity === 0 ? "destructive" : "secondary"}
                            className={product.quantity === 0 ? "" : "text-yellow-600 border-yellow-600"}
                          >
                            {product.quantity} {product.unit}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {product.quantity === 0 ? "Out of Stock" : "Low Stock"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">All medicines are well stocked</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Medicines Performance */}
          {dashboardData.topMedicines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Most Prescribed Medicines
                </CardTitle>
                <CardDescription>Most prescribed medicines by revenue and volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.topMedicines}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" ? `${formatCurrency(Number(value))}` : value,
                        name === "revenue" ? "Revenue" : "Prescriptions",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`${endPoint}/sales/add`}>
                  <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                    <Stethoscope className="h-6 w-6" />
                    <span>New Consultation</span>
                  </Button>
                </Link>
                <Link href={`${endPoint}/products/add`}>
                  <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                    <Package className="h-6 w-6" />
                    <span>Add Medicine</span>
                  </Button>
                </Link>
                <Link href={`${endPoint}/people/customers/add`}>
                  <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                    <Users className="h-6 w-6" />
                    <span>Add Student</span>
                  </Button>
                </Link>
                <Link href={`${endPoint}/sales/list`}>
                  <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                    <BarChart3 className="h-6 w-6" />
                    <span>View Consultations</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Consultations Modal */}
        <DailySalesModal
          isOpen={showDailyModal}
          onClose={handleCloseModal}
          date={selectedDate}
          warehouseId={warehouseId}
          warehouseName={dashboardData?.warehouse?.name || "Clinic"}
          apiEndpoint="/api/sale/daily-analytics"
        />
      </>
  )
}