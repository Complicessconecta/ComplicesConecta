import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

export interface NFT {
  id: string;
  name: string;
  image: string;
  collection?: string;
  token_id?: string;
}

interface NFTWalletViewProps {
  nfts?: NFT[];
  loading?: boolean;
}

export const NFTWalletView = ({ nfts: propNfts, loading: propLoading }: NFTWalletViewProps = {}) => {
  const [loading, setLoading] = useState(propLoading !== undefined ? propLoading : true);
  const [nfts, setNfts] = useState<NFT[]>(propNfts || []);

  useEffect(() => {
    if (propNfts) {
      setNfts(propNfts);
      if (propLoading === undefined) setLoading(false);
      return;
    }

    // Simulate loading
    const timer = setTimeout(() => {
      setNfts([
        { id: '1', name: 'NFT 1', image: 'https://via.placeholder.com/150' },
        { id: '2', name: 'NFT 2', image: 'https://via.placeholder.com/150' },
        { id: '3', name: 'NFT 3', image: 'https://via.placeholder.com/150' },
        { id: '4', name: 'NFT 4', image: 'https://via.placeholder.com/150' },
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [propNfts, propLoading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando colección NFT...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Colección NFT</CardTitle>
      </CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            <p className="text-lg font-medium mb-2">Aún no tienes NFTs</p>
            <p className="text-sm">Explorar Colecciones para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="border rounded-lg p-2 bg-white/5 border-white/10">
                <img src={nft.image} alt={nft.name} className="w-full h-auto rounded aspect-square object-cover" />
                <p className="mt-2 text-center text-sm font-medium text-white">{nft.name}</p>
                {nft.token_id && <p className="text-xs text-center text-white/50">#{nft.token_id}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
