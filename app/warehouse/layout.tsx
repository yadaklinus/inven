"use client"
import { useOnlineStatus } from "@/hooks/check-online";


import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";


export default function SupAdminLayout({children}:{children:React.ReactNode}){
    const {data,status} = useSession()
    const router = useRouter()
    const {online} = useOnlineStatus()

      const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
      useEffect(() => {
        async function syncNow() {
          try {
            const res = await axios.post("/api/syncNew", { online });
           
            console.log("Sync result:", res.data);
          } catch (error) {
            console.error("Sync error:", error);
          }
        }
    
        // Start interval only if online
        // if (online) {
        //   syncNow(); // Run once immediately
        //   intervalRef.current = setInterval(syncNow, 1000 * 30); // every 5 minutes
        // }
    
        // Cleanup when offline or unmounted
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        };
      }, [online]);
  
      
    
    
    useEffect(()=>{

        
        if(status == "unauthenticated"){
           
                router.replace("/user/login")
                console.log("not auth")
            
        }

        const interval = setInterval(async () => {
            if (online) {
             
            }
            try {
             
              console.log("Sync success:", status);
            } catch (error) {
              console.error("Sync failed:", error);
            }
          }, 10000); 
      
          // Cleanup when component unmounts
          return () => clearInterval(interval);
    
    // if(data?.role != "supaAdmina" && status == "authenticated") router.replace("/login")
    // if(status == "unauthenticated") router.push("/login")
    },[status,data,online])
       
    // if(data?.role != "supaAdmina") return router.replace("/login")
    
    return(
        <>
                    {children}    
        </>
    )
}