import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  bsc,
  mainnet,
  sepolia,
} from 'wagmi/chains';
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID


export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: projectId||'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    bsc,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});