import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Image as ImageIcon, Info } from 'lucide-react';

interface NFT {
  id: string;
  name: string;
  image: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  value: number; // in CMPX
}

const RARITY_COLORS = {
  Common: 'bg-gray-500',
  Rare: 'bg-blue-500',
  Epic: 'bg-purple-500',
  Legendary: 'bg-yellow-500'
};

const MOCK_NFT_IMAGES = [
  '/assets/people/single/privado/aprivadosingle1.jpg',
  '/assets/people/single/privado/aprivadosingle2.jpg',
  '/assets/people/single/privado/aprivadosingle3.jpg',
  '/assets/people/single/privado/aprivadosingle4.jpg',
  '/assets/people/single/privado/aprivadosingle5.jpg',
  '/assets/people/single/privado/aprivadosingle6.jpg',
  '/assets/people/single/privado/aprivadosingle7.jpg',
  '/assets/people/single/privado/aprivadosingle8.jpg',
];

export const NFTWalletView: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching/generating NFTs
    const generateNFTs = () => {
      const count = 4; // Max 4 NFTs
      const newNfts: NFT[] = [];
      const shuffledImages = [...MOCK_NFT_IMAGES].sort(() => 0.5 - Math.random());

      for (let i = 0; i < count; i++) {
        const rarityRoll = Math.random();
        let rarity: NFT['rarity'] = 'Common';
        let value = 100;

        if (rarityRoll > 0.95) { rarity = 'Legendary'; value = 5000; }
        else if (rarityRoll > 0.8) { rarity = 'Epic'; value = 1500; }
        else if (rarityRoll > 0.5) { rarity = 'Rare'; value = 500; }

        newNfts.push({
          id: `nft-${Date.now()}-${i}`,
          name: `Cómplice #${Math.floor(Math.random() * 9999)}`,
          image: shuffledImages[i % shuffledImages.length],
          rarity,
          value
        });
      }
      setNfts(newNfts);
      setLoading(false);
    };

    const timer = setTimeout(generateNFTs, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Cargando colección NFT...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ImageIcon className="h-5 w-5 text-purple-400" />
          Tu Colección NFT
          <Badge variant="outline" className="ml-auto border-purple-400/50 text-purple-300">
            {nfts.length} / 4
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {nfts.map((nft) => (
            <div key={nft.id} className="group relative bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300">
              <div className="aspect-square relative">
                <img 
                  src={nft.image} 
                  alt={nft.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={`${RARITY_COLORS[nft.rarity]} text-white text-xs border-0 shadow-lg`}>
                    {nft.rarity}
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-white font-bold text-sm truncate">{nft.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/60">Valor:</span>
                  <span className="text-xs font-mono text-green-400">{nft.value} CMPX</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full mt-2 h-7 text-xs bg-white/5 hover:bg-white/10 text-white/80"
                  onClick={() => alert(`Detalles de ${nft.name}\nID: ${nft.id}\nRareza: ${nft.rarity}`)}
                >
                  <Info className="w-3 h-3 mr-1" /> Detalles
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
