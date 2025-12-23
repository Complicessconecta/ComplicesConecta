
/**
 * Application Configuration
 * Centralizes all environment variables and constant configurations.
 */

export const AppConfig = {
  env: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 15000,
  },

  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  blockchain: {
    defaultChainId: 80001, // Mumbai
    contractAddresses: {
      mumbai: {
        CMPX: import.meta.env.VITE_CONTRACT_CMPX_MUMBAI || '0x0000000000000000000000000000000000000000',
        GTK: import.meta.env.VITE_CONTRACT_GTK_MUMBAI || '0x0000000000000000000000000000000000000000',
        CoupleNFT: import.meta.env.VITE_CONTRACT_COUPLE_NFT_MUMBAI || '0x0000000000000000000000000000000000000000',
        StakingPool: import.meta.env.VITE_CONTRACT_STAKING_MUMBAI || '0x0000000000000000000000000000000000000000',
      },
      polygon: {
        CMPX: import.meta.env.VITE_CONTRACT_CMPX_POLYGON || '0x0000000000000000000000000000000000000000',
        GTK: import.meta.env.VITE_CONTRACT_GTK_POLYGON || '0x0000000000000000000000000000000000000000',
        CoupleNFT: import.meta.env.VITE_CONTRACT_COUPLE_NFT_POLYGON || '0x0000000000000000000000000000000000000000',
        StakingPool: import.meta.env.VITE_CONTRACT_STAKING_POLYGON || '0x0000000000000000000000000000000000000000',
      },
    },
  },

  features: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    enableRemoteAssets: import.meta.env.VITE_USE_REMOTE_ASSETS === 'true',
    premiumFeatures: true,
  }
};

export const CONTRACT_ADDRESSES = AppConfig.blockchain.contractAddresses;
