import '@/app/globals.css'
import Nav from '@/components/navigation'
import { cn } from '@/lib/utils'
import { WalletProvider } from '@/lib/wallet-provider'
import { ClerkProvider } from '@clerk/nextjs'
import '@coinbase/onchainkit/styles.css'
import { Plus_Jakarta_Sans } from "next/font/google"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <WalletProvider>
        <html lang="en">
          <body className={cn(plusJakartaSans.variable, 'font-sans antialiased bg-background text-foreground')}>
            <header>
              <Nav />
            </header>
            <main className="mt-20">{children}</main>
          </body>
        </html>
      </WalletProvider>
    </ClerkProvider>
  )
}