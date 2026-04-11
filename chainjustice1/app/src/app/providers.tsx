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
  BackpackWalletAdapter,
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { appConfig, resolveRpcEndpoint } from '@/lib/config';

import '@solana/wallet-adapter-react-ui/styles.css';

const TypedConnectionProvider =
  ConnectionProvider as unknown as ComponentType<{ endpoint: string; children?: ReactNode }>;
const TypedWalletProvider =
  WalletProvider as unknown as ComponentType<{ wallets: unknown[]; autoConnect?: boolean; children?: ReactNode }>;
const TypedWalletModalProvider =
  WalletModalProvider as unknown as ComponentType<{ children?: ReactNode }>;

export function Providers({ children }: { children: ReactNode }) {
  const network =
    appConfig.solanaNetwork === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : appConfig.solanaNetwork === 'testnet'
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(
    () => resolveRpcEndpoint() || clusterApiUrl(network),
    [network]
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new BackpackWalletAdapter()],
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