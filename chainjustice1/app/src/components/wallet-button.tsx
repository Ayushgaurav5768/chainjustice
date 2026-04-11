"use client"

import { useEffect, useState } from "react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { cn } from "@/lib/utils"

interface WalletButtonProps {
	className?: string
	fullWidth?: boolean
}

export function WalletButton({ className, fullWidth = false }: WalletButtonProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<button
				type="button"
				className={cn(
					"!h-9 !rounded-md !border !border-glass-border !bg-secondary/70 !px-3 !text-sm !font-medium !text-foreground !shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.25)] !backdrop-blur-md",
					fullWidth && "!w-full !justify-center",
					className
				)}
				disabled
			>
				Connect Wallet
			</button>
		)
	}

	return (
		<WalletMultiButton
			className={cn(
				"!h-9 !rounded-md !border !border-glass-border !bg-secondary/70 !px-3 !text-sm !font-medium !text-foreground !shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.25)] !backdrop-blur-md hover:!bg-secondary focus-visible:!ring-2 focus-visible:!ring-cyan",
				fullWidth && "!w-full !justify-center",
				className
			)}
		/>
	)
}

export default WalletButton
