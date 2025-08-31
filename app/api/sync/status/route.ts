import { NextResponse } from "next/server";
import { getUnsyncedCounts } from "@/lib/sync-helpers";

export async function GET() {
  try {
    const unsyncedCounts = await getUnsyncedCounts();
    
    return NextResponse.json({
      success: true,
      totalUnsynced: unsyncedCounts.total,
      unsyncedTables: {
        products: unsyncedCounts.products,
        customers: unsyncedCounts.customers,
        suppliers: unsyncedCounts.suppliers,
        sales: unsyncedCounts.sales,
        purchases: unsyncedCounts.purchases,
        saleItems: unsyncedCounts.saleItems,
        purchaseItems: unsyncedCounts.purchaseItems,
        paymentMethods: unsyncedCounts.paymentMethods,
        users: unsyncedCounts.users,
        receiptSettings: unsyncedCounts.receiptSettings
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to get sync status:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}