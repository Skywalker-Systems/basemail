"use client"

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {
  WalletAdvancedDefault
} from '@coinbase/onchainkit/wallet';

export default function Nav() {
  return (
    <>
      <nav className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-10">
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