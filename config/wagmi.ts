import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ucc',
  projectId: 'fa0ef94cc080f0a39ec5edf37bccfd85',
  chains: [ bsc],
});
