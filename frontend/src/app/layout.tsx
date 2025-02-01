import { ClerkProvider } from '@clerk/nextjs'
import Nav from '../components/Nav'
import { Plus_Jakarta_Sans } from "next/font/google"
import './globals.css'
import { cn } from './lib/utils'
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn(plusJakartaSans.variable, "font-sans bg-background text-foreground antialiased")}>
          <header>
            <Nav />
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}