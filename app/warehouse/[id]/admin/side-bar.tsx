"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react" // Added useRef
import {
  BarChart3,
  Bell,
  ChevronRight,
  Home,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  FileText,
  Truck,
  ArrowLeftRight,
  Users,
  User,
  Building2,
  UserCheck,
  Eye,
  Warehouse,
  type LucideIcon,
  Receipt,
  Calculator,
  Quote,
  RefreshCw, // Added Sync Icon
} from "lucide-react"
import axios from "axios" // Added axios

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import fetchData from "@/hooks/fetch-data"
import { NavbarItem } from "@heroui/navbar"
import { Button } from "@heroui/button"
import { signOut, useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { SystemStatus } from "@/components/system-status"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalculatorCard } from "@/components/shad-cal"
import { useRouter } from "next/navigation"
// Assuming this is the correct path for your hook
import { useOnlineStatus } from "@/hooks/check-online"

// Navigation data for inventory management system
// ... (NavSection component remains unchanged) ...
function NavSection({
  title,
  items,
}: {
  title: string
  items: Array<{
    title: string
    url?: string
    icon: LucideIcon
    items?: Array<{
      title: string
      url: string
      icon?: LucideIcon
    }>
  }>
}) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items) {
            return (
              <Collapsible key={item.title} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              {subItem.icon && <subItem.icon className="w-4 h-4" />}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function SupAdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = useState(false)
  const { data, loading, error } = fetchData("/api/settings")
  const warehouseId = getWareHouseId()
  const { data: session } = useSession()
  const [endpoint, setEndPoint] = useState("")
  const router = useRouter()

  // --- Start of New/Modified Code ---

  // State for the sync button
  const [isSyncing, setIsSyncing] = useState(false)

  // Uncommented and using the connection check hook
    const {online} = useOnlineStatus()
  
  
  // The interval logic from your snippet (optional, but included as you provided it)
  // We need a ref to hold the interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual sync function
  const handleSync = async () => {
    if (isSyncing) return // Don't sync if already syncing
    setIsSyncing(true)
    console.log("Manual sync triggered...")
    try {
      // Using the logic from your snippet
      const res = await axios.post("/api/syncNew", { online: online })
      console.log("Sync result:", res.data)
      // You could add a success toast here
    } catch (error) {
      console.error("Sync error:", error)
      // You could add an error toast here
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-sync logic from your snippet
  useEffect(() => {
    async function syncNow() {
      // Don't auto-sync if a manual sync is in progress
      if (isSyncing) return; 

      console.log("Auto-sync running...")
      try {
        const res = await axios.post("/api/syncNew", { online: online })
        console.log("Auto-sync result:", res.data)
      } catch (error) {
        console.error("Auto-sync error:", error)
      }
    }

    // Start interval only if online
    if (online) {
      syncNow() // Run once immediately
      intervalRef.current = setInterval(syncNow, 1000 * 60 * 5) // every 5 minutes
    }

    // Cleanup when offline or unmounted
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [online, isSyncing]) // Added isSyncing dependency

  // --- End of New/Modified Code ---

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  if (loading) return ""

  return (
    <Sidebar className="mb-4" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{data?.companyName}</span>
                  <span className="truncate text-xs">Admin Management System</span>
                  {/* {online ? "online" : "ofline"} */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <SystemStatus />
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* --- NEW SYNC BUTTON --- */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSync} disabled={isSyncing || !online} tooltip="Sync Data">
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* --- END OF NEW SYNC BUTTON --- */}

        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="POS"
              onClick={() => router.replace(`${endpoint}/sales/add`)}
              className="bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <span>POS - Sales</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  tooltip="Calculator"
                  className="hover:bg-blue-600 transition"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>Calculator</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="start"
                className="p-0 shadow-xl border rounded-2xl w-80"
              >
                <CalculatorCard />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* ... (Rest of the NavSection components remain unchanged) ... */}
         <NavSection title="Overview" items={[
                  {
                    title: "Dashboard",
                    url: `${endpoint}/dashboard`,
                    icon: Home,
                  },
                ]} />
        <NavSection title="Inventory" items={[
    {
      title: "Sales",
      icon: ShoppingCart,
      items: [
        {
          title: "Add Sale",
          url: `${endpoint}/sales/add`,
          icon: Plus,
        },
        {
          title: "View Sales",
          url: `${endpoint}/sales/list`,
          icon: Eye,
        },
      ],
    },
    {
      title: "Quotations",
      icon: Quote,
      items: [
        {
          title: "Add Quotation",
          url: `${endpoint}/quotations/add`,
          icon: Plus,
        },
        {
          title: "View Quotations",
          url: `${endpoint}/quotations/list`,
          icon: Eye,
        },
      ],
    },
    {
      title: "Products",
      icon: Package,
      items: [
        {
          title: "Add Product",
          url: `${endpoint}/products/add`,
          icon: Plus,
        },
        {
          title: "View Products",
          url: `${endpoint}/products/list`,
          icon: Eye,
        },
        {
          title: "Update Product",
          url: `${endpoint}/products/update`,
          icon: Plus,
        },
      ],
    },
   
    {
      title: "Purchases",
      icon: Truck,
      items: [
        {
          title: "Add Purchase",
          url: `${endpoint}/purchases/add`,
          icon: Plus,
        },
        {
          title: "View Purchases",
          url: `${endpoint}/purchases/list`,
          icon: Eye,
        },
      ],
    },
   
  ]} />
        <NavSection title="People" items={[
                  {
                    title: "People",
                    icon: Users,
                    items: [
                      {
                        title: "Users",
                        url: `${endpoint}/people/users`,
                        icon: User,
                      },
                      {
                        title: "Customers",
                        url: `${endpoint}/people/customers`,
                        icon: UserCheck,
                      },
                      {
                        title: "Suppliers",
                        url: `${endpoint}/people/suppliers`,
                        icon: Building2,
                      },
                    ],
                  },
                ]} />
        <NavSection
            title="System"
            items={[
                  {
                    title: "Notifications",
                    url: "/notifications",
                    icon: Bell,
                  },
                  {
                    title: "Recpiet",
                    url: `${endpoint}/receipt`,
                    icon: Receipt,
                  },
                  {
                    title: "Settings",
                    url: "/settings",
                    icon: Settings,
                  },
                ].filter((item) => item.title !== "Notifications" && item.title !== "Settings")}
          />

        

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={() => signOut()}
              className="bg-red-500 text-white hover:bg-red-600 transition"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <span></span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}