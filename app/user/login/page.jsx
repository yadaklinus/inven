
"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { signIn, signOut, useSession } from "next-auth/react"
import { redirect } from "next/dist/server/api-utils"
import { useRouter } from "next/navigation"
import { useOnlineStatus } from "@/hooks/check-online"
import axios from "axios"

export default function LoginForm() {

  const {data} = useSession()
  const router = useRouter()

  const [userName,setUserName] = useState("")
  const [password,setPassword] = useState("")

  const {online} = useOnlineStatus()

  const [loading,setLoading] = useState(false)
  


  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials",{email:userName,password:password,redirect:false,type:"warehouse"})
    
    if(res.ok){
      toast.success("Welcome")
    }else{
      toast.error("Wrong Credentials")
    }
    setLoading(false)
    
  }
  useEffect(()=>{
    async function main(){
      if(data){
        if(data.user.role == "supaAdmina"){
          await signOut()
        }
        router.push(`/warehouse/${data.user.warehousesId}/${data.user.role}/dashboard`)
      }
      if(online){
        await axios.post("/api/syncNew")
      }
    }
   
    main()
  },[data])

  

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle>User Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">UserName</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="m@example.com"
                  value={userName}
                  onChange={(e)=>setUserName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" value={password}
                  onChange={(e)=>setPassword(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-3">
                <Button disabled={loading} type="submit" className="w-full">
                  Login
                </Button>
                
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </div>
    </div>
  )
}

