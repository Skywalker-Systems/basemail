"use client"

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {
  Address,
  Avatar,
  Identity,
  Name,
  useName,
} from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';
export default function Nav() {
  const { address } = useAccount()
  const { data: ensName } = useName({ address: address as `0x${string}`, chain: base })

  return (
    <>
      <nav className="flex justify-between items-center p-4">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
          <Wallet>
            <ConnectWallet onConnect={() => {

            }}>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address className={color.foregroundMuted} />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </SignedIn>
      </nav>
    </>
  )
}