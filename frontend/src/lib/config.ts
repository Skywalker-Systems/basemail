import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
    chains: [base],
    connectors: [
        coinbaseWallet({
            appName: 'Basemail',
            appLogoUrl: '/b_trasnparent.png',
        }),
    ],
    ssr: true,
    transports: {
        [base.id]: http(),
    },
});