'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SalesVsPurchasesChart } from "@/components/sales-vs-purchases-chart"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, Users, DollarSign, Warehouse } from "lucide-react"
import { DashboardCard } from "./components/DashboardCard"
import { RecentSalesTable } from "./components/RecentSalesTable"
import { UserTable } from "./components/UserTable"

interface DashboardStats {
  totalUsers: number
  totalWarehouses: number
  totalProducts: number
  totalSales: number
  totalCustomers: number
  totalRevenue: number
  recentSales: Array<{
    id: string
    customer: string
    amount: number
    date: string
    items: number
    products: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Dashboard stats error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
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
                  <BreadcrumbPage>Super Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <DashboardCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              description="registered users"
              icon={Users}
            />
            <DashboardCard
              title="Total Warehouses"
              value={stats?.totalWarehouses || 0}
              description="active warehouses"
              icon={Warehouse}
            />
            <DashboardCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              description="in inventory"
              icon={Package}
            />
            <DashboardCard
              title="Total Sales"
              value={stats?.totalSales || 0}
              description="completed transactions"
              icon={ShoppingCart}
            />
            <DashboardCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              description="registered customers"
              icon={Users}
            />
            <DashboardCard
              title="Total Revenue"
              value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
              description="all-time revenue"
              icon={DollarSign}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 lg:grid-cols-7">
            {/* Recent Sales Table */}
            <RecentSalesTable sales={stats?.recentSales || []} />

            {/* Right Column */}
            <div className="col-span-3 space-y-4">
              {/* Sales vs Purchases Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales vs Purchases</CardTitle>
                  <CardDescription>Comparison of total sales and purchases</CardDescription>
                </CardHeader>
                              <CardContent>
                <SalesVsPurchasesChart />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <QuickActions />

            {/* System Overview */}
            <SystemOverview />
            </div>
          </div>

          {/* User Management Section */}
          <div className="grid gap-4">
            <UserTable className="w-full" />
          </div>
        </div>
     </>
  )
}
