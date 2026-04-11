"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Button from "@/components/ui/button"
import WalletButton from "@/components/wallet-button"
import { Scale, Menu, X } from "lucide-react"
import { useState } from "react"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/registry", label: "Registry" },
  { href: "/juror", label: "Juror Portal" },
  { href: "/cases/file", label: "File Case" },
  { href: "/precedents", label: "Precedents" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-glass-border bg-glass shadow-[0_4px_30px_rgba(0,0,0,0.2)] [backdrop-filter:blur(24px)_saturate(180%)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-cyan">
            <Scale className="h-5 w-5 text-cyan" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Chain<span className="text-cyan">Justice</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-secondary text-cyan"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <WalletButton />
          <Button size="sm" className="bg-cyan text-primary-foreground hover:bg-cyan/90 glow-cyan">
            Launch App
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-glass-border bg-glass shadow-[0_8px_30px_rgba(0,0,0,0.3)] [backdrop-filter:blur(24px)_saturate(180%)] md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-secondary text-cyan"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4">
              <WalletButton fullWidth />
              <Button size="sm" className="bg-cyan text-primary-foreground hover:bg-cyan/90">
                Launch App
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
