export const COUPLE_NFT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "partner1",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "partner2",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "initiator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CoupleRequestCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId1",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId2",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "partner1",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "partner2",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "CoupleNFTMinted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "partner1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "partner2",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_tokenURI",
        "type": "string"
      }
    ],
    "name": "requestCoupleMint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approveCoupleMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "cancelRequest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getPendingRequests",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
