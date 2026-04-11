'use client';

import { ComponentType, ReactNode, useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';

const TypedConnectionProvider =
  ConnectionProvider as unknown as ComponentType<{ endpoint: string; children?: ReactNode }>;
const TypedWalletProvider =
  WalletProvider as unknown as ComponentType<{ wallets: unknown[]; autoConnect?: boolean; children?: ReactNode }>;
const TypedWalletModalProvider =
  WalletModalProvider as unknown as ComponentType<{ children?: ReactNode }>;

export function Providers({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network),
    [network]
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <TypedConnectionProvider endpoint={endpoint}>
      <TypedWalletProvider wallets={wallets} autoConnect>
        <TypedWalletModalProvider>{children}</TypedWalletModalProvider>
      </TypedWalletProvider>
    </TypedConnectionProvider>
  );
}