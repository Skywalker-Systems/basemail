import '@/app/globals.css'
import Nav from '@/components/navigation'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { WalletProvider } from '@/lib/wallet-provider'
import { ClerkProvider } from '@clerk/nextjs'
import '@coinbase/onchainkit/styles.css'
import { Metadata } from 'next'
import { Plus_Jakarta_Sans } from "next/font/google"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'Basemail',
  description: 'Basemail',
  icons: {
    icon: '/b_trasnparent.png',
  },
  openGraph: {
    images: '/b_trasnparent.png',
  },
  twitter: {
    card: 'summary_large_image',
    images: '/b_trasnparent.png',
  },
  metadataBase: new URL('https://basemail.me'),
}

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
            <Toaster />
          </body>
        </html>
      </WalletProvider>
    </ClerkProvider>
  )
}