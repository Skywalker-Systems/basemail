import {  SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Nav() {
  return (
    <>
    <nav className="flex justify-between items-center p-4">
      <SignedOut>
          <SignInButton />
           </SignedOut>
            <SignedIn>
            <UserButton />
        </SignedIn>
      </nav>
    </>
  )
}