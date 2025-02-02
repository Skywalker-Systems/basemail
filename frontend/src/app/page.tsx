'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { SignedOut, SignInButton } from "@clerk/nextjs";
import { useName } from '@coinbase/onchainkit/identity';
import { LockIcon, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: name, isLoading: isLoadingName } = useName({
    address: address as `0x${string}`,
    chain: base,

  });

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Video Background - smaller and centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] overflow-hidden">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="videos/globe.webm" type="video/webm" />
        </video>
      </div>

      <section className="container relative mx-auto px-4 py-24 max-w-[1200px]">
        {/* Main Heading - centered */}
        <h1 className="text-[64px] font-bold leading-tight mb-12 text-center">
          Base Mail<br />Intelligence in your inbox
        </h1>

        {/* Add wallet connection section before features */}
        <div className="text-center mb-16">
          {!isConnected ? (
            <SignedOut>
              <SignInButton mode="modal">
                <Button>
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
          ) : isLoadingName ? (
            <div className="text-lg">Checking your Base name...</div>
          ) : name ? (
            <Link href="/mail">
              <Button size="lg" className="text-lg px-8 py-6">
                Take me to my inbox
              </Button>
            </Link>
          ) : (
            <div className="space-y-4">
              <p className="text-lg">To get started, you'll need a Base name</p>
              <Link href="https://base.org/name" target="_blank">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get a Base name
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid - with staggered layout */}
        <div className="grid gap-12 relative">
          {/* Identity Card */}
          <div className="ml-auto w-[600px]">
            <Card className="overflow-hidden rounded-[24px] border bg-white/90 backdrop-blur">
              <CardContent className="flex items-center gap-6 p-6">
                <div className="rounded-xl bg-blue-500 p-4 w-16 h-16 flex items-center justify-center">
                  <div className="text-white">
                    <User className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">Your Identity, Your Inbox</CardTitle>
                  <CardDescription className="text-gray-600">
                    Let your Base name do more. Your onchain identity unlocks a verified inbox that champions your digital presence.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Card */}
          <div className="w-[600px]">
            <Card className="overflow-hidden rounded-[24px] border bg-white/90 backdrop-blur">
              <CardContent className="flex items-center gap-6 p-6">
                <div className="rounded-xl bg-emerald-500 p-4 w-16 h-16 flex items-center justify-center">
                  <div className="text-white">
                    <LockIcon className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">Instant Trust, Instant Verify</CardTitle>
                  <CardDescription className="text-gray-600">
                    Verify official emails with a single click. With BaseMail, authenticity isn’t just promised—it’s proven.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connect Card */}
          <div className="ml-auto w-[600px]">
            <Card className="overflow-hidden rounded-[24px] border bg-white/90 backdrop-blur">
              <CardContent className="flex items-center gap-6 p-6">
                <div className="rounded-xl bg-purple-500 p-4 w-16 h-16 flex items-center justify-center">
                  <div className="text-white">
                    <Mail className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">Your Email Wallet</CardTitle>
                  <CardDescription className="text-gray-600">
                    Turn your inbox into a secure wallet. Send and receive with the simplicity you expect—and the power you deserve.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
