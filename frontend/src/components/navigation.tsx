"use client"

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {
  WalletAdvancedDefault
} from '@coinbase/onchainkit/wallet';

export default function Nav() {
  return (
    <>
      <nav className="flex justify-between items-center p-4">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
          <WalletAdvancedDefault />
        </SignedIn>
      </nav>
    </>
  )
}