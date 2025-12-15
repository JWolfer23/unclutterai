import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export const PrivyProvider = ({ children }: Props) => {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;

  // If no Privy app ID is configured, just render children without the provider
  if (!appId) {
    console.warn('VITE_PRIVY_APP_ID is not configured. Wallet connection will be unavailable.');
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
          logo: '/lovable-uploads/064ee60b-3850-4faa-abe4-7aefeedf9961.png',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: {
          id: 84532,
          name: 'Base Sepolia',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://sepolia.base.org'] },
          },
          blockExplorers: {
            default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
          },
          testnet: true,
        },
        supportedChains: [
          {
            id: 84532,
            name: 'Base Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://sepolia.base.org'] },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
            },
            testnet: true,
          },
          {
            id: 8453,
            name: 'Base',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: ['https://mainnet.base.org'] },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://basescan.org' },
            },
            testnet: false,
          },
        ],
      }}
    >
      {children}
    </PrivyProviderBase>
  );
};
