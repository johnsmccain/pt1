'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import React, { type ReactNode } from 'react'
import { WagmiProvider, type Config } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/config/wagmi'
import '@rainbow-me/rainbowkit/styles.css';


// Set up queryClient
const queryClient = new QueryClient()

// if (!projectId) {
//     throw new Error('Project ID is not defined')
// }



function ContextProvider({ children }: { children: ReactNode }) {
    // const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
{/* <WagmiProvider config={config}>
<QueryClientProvider client={queryClient}>
  <RainbowKitProvider> */}
export default ContextProvider