import type { Metadata } from "next";
import "@genlayer/transaction-kit-react/styles.css";
import "./globals.css";
import Providers from "./providers";
import AppHeader from "@/components/AppHeader";

export const metadata:Metadata={title:"ReferralRail - referrals that settle on verified work",description:"Referral attribution becomes enforceable economic state on GenLayer."};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><Providers><div className="top-rule"/><AppHeader/><main>{children}</main><footer className="footer"><span>ReferralRail</span><span>Future of Work · GenLayer Studio Next · 61997</span><span>Referral attribution → verified work → split payment</span></footer></Providers></body></html>
}
