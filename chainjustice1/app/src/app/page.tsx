"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import Button from "@/components/ui/button"
import Navbar from "@/components/navbar"
import GlassCard from "@/components/glass-card"
import WalletButton from "@/components/wallet-button"
import {
  Scale,
  Users,
  Zap,
  ArrowRight,
  ChevronRight,
  Database,
  FileCheck,
  Blocks,
} from "lucide-react"

const stats = [
  { label: "Cases Filed", value: "2,847" },
  { label: "Registered Models", value: "1,234" },
  { label: "Active Jurors", value: "892" },
  { label: "Verdicts Anchored", value: "6,510" },
]

const features = [
  {
    icon: Database,
    title: "Model Registry",
    description: "Provider identities, insurance reserves, and trust score history are visible by default.",
    color: "cyan" as const,
  },
  {
    icon: Users,
    title: "Juror Governance",
    description: "Staked jurors deliver final decisions independently. AI analysis is advisory-only by design.",
    color: "violet" as const,
  },
  {
    icon: FileCheck,
    title: "Evidence Integrity via IPFS",
    description: "Evidence files receive CID anchoring and gateway links for immutable public verification.",
    color: "cyan" as const,
  },
  {
    icon: Blocks,
    title: "Public Accountability via Solana",
    description: "Verdict ledger entries and trust updates are durable, auditable, and ecosystem-visible.",
    color: "violet" as const,
  },
]

const howItWorks = [
  {
    step: "01",
    title: "File a Case",
    description: "Submit complaint context and evidence. Every artifact is traceable.",
  },
  {
    step: "02",
    title: "AI Case Briefs",
    description: "Prosecution, defense, and neutral synthesis briefs are generated as non-binding analysis.",
  },
  {
    step: "03",
    title: "Juror Voting",
    description: "Human jurors review evidence and vote independently of AI recommendations.",
  },
  {
    step: "04",
    title: "Verdict Ledger",
    description: "Final outcomes, trust deltas, and insurance effects are recorded on-chain.",
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5 },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan/10 blur-[100px]" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-violet/10 blur-[80px]" />
        <div className="absolute left-0 bottom-1/4 h-[300px] w-[300px] rounded-full bg-cyan/5 blur-[60px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/15 px-4 py-1.5 text-sm text-cyan shadow-[0_0_20px_oklch(0.75_0.18_195/0.3),inset_0_1px_1px_0_oklch(1_0_0/0.1)] [backdrop-filter:blur(12px)]">
              <Zap className="h-4 w-4" />
              <span>Built on Solana</span>
            </div>

            <h1 className="text-pretty text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              ChainJustice
            </h1>

            <p className="mt-4 text-2xl font-semibold tracking-tight text-cyan sm:text-3xl">
              The Decentralized AI Accountability Court
            </p>

            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              AI argues both sides. Humans decide. Blockchain remembers.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <WalletButton className="!w-full sm:!w-auto" />
              <Button
                size="lg"
                className="w-full bg-cyan text-primary-foreground hover:bg-cyan/90 glow-cyan sm:w-auto"
                asChild
              >
                <Link href="/file-case">
                  File a Case
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-border hover:bg-secondary sm:w-auto"
                asChild
              >
                <Link href="/juror">
                  Become a Juror
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <motion.div {...fadeUp} className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, index) => (
              <GlassCard
                key={stat.label} 
                className="p-4 text-center" 
                hover
                intensity="intense"
                glow={index % 2 === 0 ? "cyan" : "violet"}
              >
                <p className="text-2xl font-bold text-cyan sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Justice, <span className="text-cyan">Decentralized</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete ecosystem for AI accountability, from case filing to verdict execution.
            </p>
          </div>

          <motion.div {...fadeUp} className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <GlassCard key={feature.title} className="p-6" hover intensity="normal" glow={feature.color}>
                <div
                  className={`inline-flex rounded-lg p-2.5 ${
                    feature.color === "cyan" 
                      ? "bg-cyan/20 text-cyan shadow-[0_0_20px_oklch(0.75_0.18_195/0.4)]" 
                      : "bg-violet/20 text-violet shadow-[0_0_20px_oklch(0.65_0.20_300/0.4)]"
                  }`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How <span className="text-violet">ChainJustice</span> Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              A transparent, four-step process from case filing to final verdict.
            </p>
          </div>

          <motion.div {...fadeUp} className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                {index < howItWorks.length - 1 && (
                  <div className="absolute left-full top-8 hidden h-px w-full bg-gradient-to-r from-border to-transparent lg:block" />
                )}
                <div className="text-4xl font-bold text-cyan/20">{item.step}</div>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <GlassCard className="relative overflow-hidden p-8 sm:p-12" glow="cyan" intensity="intense">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <Scale className="mx-auto h-12 w-12 text-cyan" />
              <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
                Build a Defensible AI Era
              </h2>
              <p className="mt-4 text-muted-foreground">
                Submit evidence, review adversarial AI briefs, and let jurors set the final record.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="w-full bg-cyan text-primary-foreground hover:bg-cyan/90 sm:w-auto"
                  asChild
                >
                  <Link href="/file-case">
                    Start a Case
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-border hover:bg-secondary sm:w-auto"
                  asChild
                >
                  <Link href="/precedents">Research Precedents</Link>
                </Button>
              </div>
            </div>
          </GlassCard>
          
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan" />
              <span className="font-semibold">ChainJustice</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/precedents" className="hover:text-foreground">
                Precedents
              </Link>
              <Link href="/registry" className="hover:text-foreground">
                Registry
              </Link>
              <Link href="/juror" className="hover:text-foreground">Jurors</Link>
            </div>
            <p className="text-sm text-muted-foreground">Built on Solana with human-first governance</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
