// SPDX-License-Identifier: MIT
// ComplicesConecta v3.8.0 - DemoWallet
// Fecha: 10 Ene 2026 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Componente de wallet para perfiles demo

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons/Button";
import { Wallet, Coins, Image as ImageIcon, Crown, Sparkles, TrendingUp, Lock, ExternalLink, X } from "lucide-react";

/**
 * Interfaz para NFT mock
 */
interface DemoNFT {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  image: string;
  value: number;
  isCouple: boolean;
}

/**
 * Interfaz para Token mock
 */
interface DemoToken {
  symbol: string;
  balance: number;
  value: number;
  type: "cmpx" | "gtk";
  isPremium: boolean;
}

/**
 * Componente de Wallet para perfiles demo
 */
export function DemoWallet() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("0x1234...5678");
  const [balance, setBalance] = useState("0.00");
  const [showPolygonModal, setShowPolygonModal] = useState(false);

  // NFTs mock para demo
  const demoNFTs: DemoNFT[] = [
    {
      id: "nft-1",
      name: "Cómplice Legendario",
      rarity: "legendary",
      image: "/assets/nfts/imagen4.gif",
      value: 5000,
      isCouple: false,
    },
    {
      id: "nft-2",
      name: "Cómplice Épico",
      rarity: "epic",
      image: "/assets/nfts/imagen3.jpg",
      value: 2000,
      isCouple: true,
    },
    {
      id: "nft-3",
      name: "Cómplice Raro",
      rarity: "rare",
      image: "/assets/nfts/imagen1.jpg",
      value: 750,
      isCouple: false,
    },
    {
      id: "nft-4",
      name: "Cómplice Común",
      rarity: "common",
      image: "/assets/nfts/imagen2.jpg",
      value: 100,
      isCouple: true,
    },
  ];

  // Tokens mock para demo
  const demoTokens: DemoToken[] = [
    {
      symbol: "CMPX",
      balance: 1250,
      value: 250,
      type: "cmpx",
      isPremium: false,
    },
    {
      symbol: "GTK",
      balance: 500,
      value: 5000,
      type: "gtk",
      isPremium: true,
    },
  ];

  const rarityColors = {
    common: "from-gray-500 to-gray-600",
    rare: "from-blue-500 to-blue-600",
    epic: "from-purple-500 to-purple-600",
    legendary: "from-yellow-500 to-orange-500",
  };

  const rarityBadges = {
    common: "bg-gray-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-yellow-500",
  };

  const handleConnectWallet = () => {
    setWalletConnected(true);
    setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    setBalance("1.25");
  };

  return (
    <div className="space-y-6">
      {/* Header de Wallet */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            Wallet Demo
            <Badge className="ml-2 bg-yellow-500/20 text-yellow-200 border-yellow-400/40">
              DEMO MODE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletConnected ? (
            <Button
              onClick={handleConnectWallet}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Conectar Wallet Demo
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/80">Conectado</span>
                </div>
                <Badge className="bg-green-500/20 text-green-200 border-green-400/40">
                  {walletAddress}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white/80">Balance MATIC</span>
                </div>
                <span className="text-sm font-semibold text-white">{balance} MATIC</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tokens */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Coins className="h-6 w-6 text-white" />
            </div>
            Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoTokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{token.symbol}</span>
                    {token.isPremium && (
                      <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/40 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        PREMIUM
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    {token.type === "cmpx" ? "Token de consumo" : "Token de inversión"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">{token.balance.toLocaleString()}</div>
                <div className="text-xs text-white/60">${token.value.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* NFTs */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            NFTs
            <Badge className="ml-2 bg-purple-500/20 text-purple-200 border-purple-400/40">
              {demoNFTs.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {demoNFTs.map((nft) => (
              <div
                key={nft.id}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-white/20 hover:border-white/40 transition-all duration-300 group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[nft.rarity]} opacity-20`} />
                <div className="relative p-4 space-y-3">
                  <div className="aspect-square rounded-lg bg-white/10 overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`${rarityBadges[nft.rarity]} text-white text-xs`}>
                        {nft.rarity.toUpperCase()}
                      </Badge>
                      {nft.isCouple && (
                        <Badge className="bg-pink-500/20 text-pink-200 border-pink-400/40 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          PAREJA
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-white text-sm">{nft.name}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs text-white/80">{nft.value} CMPX</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span>+{Math.floor(Math.random() * 20) + 5}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staking Info */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            Staking Activo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white/80">GTK Staking</span>
              </div>
              <Badge className="bg-green-500/20 text-green-200 border-green-400/40">
                35% APY
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Tokens bloqueados</span>
                <span className="font-semibold text-white">500 GTK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Duración</span>
                <span className="font-semibold text-white">365 días</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Rewards acumulados</span>
                <span className="font-semibold text-green-400">175 GTK</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Fecha de liberación</span>
                <span className="font-semibold text-white">Ene 2027</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setShowPolygonModal(true)}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver en PolygonScan
          </Button>
        </CardContent>
      </Card>

      {/* Modal PolygonScan Demo */}
      {showPolygonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-green-400" />
                PolygonScan Demo
              </h3>
              <button
                onClick={() => setShowPolygonModal(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
                <p className="text-yellow-200 text-sm font-medium">
                  ⚠️ Modo Demo Activado
                </p>
                <p className="text-yellow-100/80 text-xs mt-2">
                  Esta es una wallet demo con datos simulados. Para ver transacciones reales en PolygonScan, necesitas:
                </p>
                <ul className="text-yellow-100/80 text-xs mt-2 space-y-1 list-disc list-inside">
                  <li>Conectar tu wallet real de MetaMask</li>
                  <li>Estar en modo producción (no demo)</li>
                  <li>Haber realizado transacciones reales en Polygon</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPolygonModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Entendido
                </Button>
                <Button
                  onClick={() => {
                    window.open('https://polygonscan.com', '_blank');
                    setShowPolygonModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Visitar PolygonScan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center space-y-2">
        <p className="text-xs text-white/80 font-medium">
          Esta es una wallet demo con datos mock para familiarizarte con el ecosistema.
        </p>
        <p className="text-xs text-white/70">
          En producción, podrás conectar tu wallet real de MetaMask para interactuar con contratos inteligentes en Polygon.
        </p>
      </div>
    </div>
  );
}
