import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contactInfo.js';
import { useToast } from '../components/ui';

const WalletContext = createContext(null);

const TARGET_CHAIN_ID_DEC = 338; // Cronos Testnet
const TARGET_CHAIN_ID_HEX = '0x' + TARGET_CHAIN_ID_DEC.toString(16);

export function WalletProvider({ children }) {
  const toast = useToast();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState('Not Connected');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tcroBalance, setTcroBalance] = useState('0.0');

  // Stream state
  const [incomingStreams, setIncomingStreams] = useState([]);
  const [outgoingStreams, setOutgoingStreams] = useState([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [knownStreamIds, setKnownStreamIds] = useState(new Set());

  const contractWithProvider = useMemo(() => {
    if (!provider) return null;
    try { return new ethers.Contract(contractAddress, contractABI, provider); }
    catch { return null; }
  }, [provider]);

  const contractWithSigner = useMemo(() => {
    if (!signer) return null;
    try { return new ethers.Contract(contractAddress, contractABI, signer); }
    catch { return null; }
  }, [signer]);

  const getNetworkName = (id) => {
    if (!id) return '...';
    const mapping = { 338: 'Cronos Testnet' };
    return mapping[id] || `Chain ${id}`;
  };

  const ensureCorrectNetwork = async (eth) => {
    const currentChainIdHex = await eth.request({ method: 'eth_chainId' });
    setChainId(parseInt(currentChainIdHex, 16));
    if (currentChainIdHex !== TARGET_CHAIN_ID_HEX) {
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET_CHAIN_ID_HEX }] });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: TARGET_CHAIN_ID_HEX, chainName: 'Cronos Testnet',
              nativeCurrency: { name: 'TCRO', symbol: 'TCRO', decimals: 18 },
              rpcUrls: ['https://evm-t3.cronos.org'], blockExplorerUrls: ['https://explorer.cronos.org/testnet']
            }],
          });
        } else throw switchError;
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('Please install MetaMask.');
      toast.error('MetaMask not found', { title: 'Wallet Error' });
      return;
    }
    try {
      const eth = window.ethereum;
      await ensureCorrectNetwork(eth);
      await eth.request({ method: 'eth_requestAccounts' });
      const nextProvider = new ethers.BrowserProvider(eth);
      const nextSigner = await nextProvider.getSigner();
      const address = await nextSigner.getAddress();
      setProvider(nextProvider);
      setSigner(nextSigner);
      setWalletAddress(address);
      setStatus('Connected');
      toast.success(`Connected to ${address.slice(0, 6)}...${address.slice(-4)}`, { title: 'Wallet Connected' });
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('Connection failed.');
      toast.error(error?.message || 'Failed to connect wallet', { title: 'Connection Failed' });
    }
  };

  const fetchTcroBalance = useCallback(async () => {
    if (!provider || !walletAddress) return;
    try {
      const balance = await provider.getBalance(walletAddress);
      setTcroBalance(ethers.formatEther(balance));
    } catch (error) { 
      console.error('Failed to fetch TCRO balance:', error); 
    }
  }, [provider, walletAddress]);

  // Note: TCRO faucet functionality - no minting needed for native tokens
  const getTcroFromFaucet = async () => {
    toast.info('Get TCRO from the Cronos testnet faucet: https://cronos.org/faucet', { 
      title: 'TCRO Faucet',
      duration: 10000 
    });
  };

  const fetchStreamsFromEvents = useCallback(async (me) => {
    if (!contractWithProvider || !provider) return { incoming: [], outgoing: [] };
    try {
      const filter = contractWithProvider.filters.StreamCreated();
      const latestBlock = await provider.getBlockNumber();
      
      // Cronos Testnet has a strict 2000 block limit for eth_getLogs
      const MAX_BLOCK_RANGE = 1900; // Stay under the 2000 limit
      const TOTAL_BLOCKS_TO_SCAN = 20000; // Scan last 20k blocks in chunks
      
      let allEvents = [];
      let currentToBlock = latestBlock;
      let blocksScanned = 0;
      
      console.log(`Starting paginated event fetch from block ${latestBlock}`);
      
      // Paginate through blocks in chunks of MAX_BLOCK_RANGE
      while (blocksScanned < TOTAL_BLOCKS_TO_SCAN && currentToBlock > 0) {
        const fromBlock = Math.max(0, currentToBlock - MAX_BLOCK_RANGE);
        
        try {
          console.log(`Fetching events from blocks ${fromBlock} to ${currentToBlock}`);
          const events = await contractWithProvider.queryFilter(filter, fromBlock, currentToBlock);
          
          if (events.length > 0) {
            console.log(`Found ${events.length} events in range ${fromBlock}-${currentToBlock}`);
            allEvents.push(...events);
          }
          
          // Move to next chunk
          currentToBlock = fromBlock - 1;
          blocksScanned += MAX_BLOCK_RANGE;
          
        } catch (chunkError) {
          console.warn(`Failed to fetch chunk ${fromBlock}-${currentToBlock}:`, chunkError);
          // Try smaller chunk if this one fails
          const smallerRange = Math.floor(MAX_BLOCK_RANGE / 2);
          if (smallerRange >= 100) {
            try {
              const smallerFromBlock = Math.max(0, currentToBlock - smallerRange);
              console.log(`Retrying with smaller range: ${smallerFromBlock} to ${currentToBlock}`);
              const events = await contractWithProvider.queryFilter(filter, smallerFromBlock, currentToBlock);
              if (events.length > 0) {
                allEvents.push(...events);
              }
              currentToBlock = smallerFromBlock - 1;
              blocksScanned += smallerRange;
            } catch (smallerError) {
              console.warn(`Smaller chunk also failed, skipping range:`, smallerError);
              currentToBlock = Math.max(0, currentToBlock - MAX_BLOCK_RANGE);
              blocksScanned += MAX_BLOCK_RANGE;
            }
          } else {
            // Skip this range entirely
            currentToBlock = Math.max(0, currentToBlock - MAX_BLOCK_RANGE);
            blocksScanned += MAX_BLOCK_RANGE;
          }
        }
        
        // Add a small delay to avoid overwhelming the RPC
        if (blocksScanned % (MAX_BLOCK_RANGE * 3) === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Completed event fetch: ${allEvents.length} total events found`);
      
      if (allEvents.length === 0) {
        console.log('No StreamCreated events found in scanned blocks');
        return { incoming: [], outgoing: [] };
      }
      
      // Remove duplicates (in case of overlapping ranges)
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.transactionHash === event.transactionHash && e.logIndex === event.logIndex)
      );
      
      console.log(`Processing ${uniqueEvents.length} unique events`);
      
      const streamCards = await Promise.all(uniqueEvents.map(async (ev) => {
        try {
          const streamId = ev.args.streamId;
          const streamData = await contractWithProvider.streams(streamId);
          const [sender, recipient, totalAmount, flowRate, startTime, stopTime, amountWithdrawn, isActive] = 
            Object.values(streamData);
          
          const now = Math.floor(Date.now() / 1000);
          const elapsed = Math.max(0, Math.min(Number(stopTime), now) - Number(startTime));
          const streamedSoFar = BigInt(elapsed) * BigInt(flowRate);
          const claimable = isActive ? (streamedSoFar > BigInt(amountWithdrawn) ? streamedSoFar - BigInt(amountWithdrawn) : 0n) : 0n;
          
          return { 
            id: Number(streamId), 
            sender, 
            recipient, 
            totalAmount: BigInt(totalAmount), 
            flowRate: BigInt(flowRate),
            startTime: Number(startTime), 
            stopTime: Number(stopTime), 
            amountWithdrawn: BigInt(amountWithdrawn),
            isActive: Boolean(isActive), 
            claimableInitial: claimable 
          };
        } catch (streamError) {
          console.error(`Failed to fetch stream ${ev.args.streamId}:`, streamError);
          return null;
        }
      }));
      
      // Filter out failed stream fetches
      const validStreams = streamCards.filter(s => s !== null);
      console.log(`Successfully processed ${validStreams.length} streams`);
      
      const meLc = me?.toLowerCase();
      const result = { 
        incoming: validStreams.filter(s => s.recipient.toLowerCase() === meLc),
        outgoing: validStreams.filter(s => s.sender.toLowerCase() === meLc) 
      };
      
      console.log(`Found ${result.incoming.length} incoming and ${result.outgoing.length} outgoing streams for ${me}`);
      return result;
    } catch (err) { 
      console.error('Failed to fetch events:', err); 
      return { incoming: [], outgoing: [] }; 
    }
  }, [contractWithProvider, provider]);

  // Direct stream lookup by ID (fallback method)
  const fetchStreamById = useCallback(async (streamId) => {
    if (!contractWithProvider) return null;
    try {
      const streamData = await contractWithProvider.streams(streamId);
      const [sender, recipient, totalAmount, flowRate, startTime, stopTime, amountWithdrawn, isActive] = 
        Object.values(streamData);
      
      // Check if this is a valid stream (sender is not zero address)
      if (sender === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, Math.min(Number(stopTime), now) - Number(startTime));
      const streamedSoFar = BigInt(elapsed) * BigInt(flowRate);
      const claimable = isActive ? (streamedSoFar > BigInt(amountWithdrawn) ? streamedSoFar - BigInt(amountWithdrawn) : 0n) : 0n;
      
      return { 
        id: Number(streamId), 
        sender, 
        recipient, 
        totalAmount: BigInt(totalAmount), 
        flowRate: BigInt(flowRate),
        startTime: Number(startTime), 
        stopTime: Number(stopTime), 
        amountWithdrawn: BigInt(amountWithdrawn),
        isActive: Boolean(isActive), 
        claimableInitial: claimable 
      };
    } catch (error) {
      console.error(`Failed to fetch stream ${streamId}:`, error);
      return null;
    }
  }, [contractWithProvider]);

  // Enhanced stream fetching with direct lookup fallback
  const fetchAllStreams = useCallback(async (me) => {
    // First try event-based fetching
    const eventResult = await fetchStreamsFromEvents(me);
    
    // If we got streams from events, return them
    if (eventResult.incoming.length > 0 || eventResult.outgoing.length > 0) {
      return eventResult;
    }
    
    // Fallback: Try direct lookup of known stream IDs first
    console.log('Event fetching returned no results, trying direct stream lookup...');
    const streams = [];
    const meLc = me?.toLowerCase();
    
    // First check known stream IDs
    if (knownStreamIds.size > 0) {
      console.log(`Checking ${knownStreamIds.size} known stream IDs`);
      for (const streamId of knownStreamIds) {
        const stream = await fetchStreamById(streamId);
        if (stream) {
          streams.push(stream);
        }
      }
    }
    
    // Then try looking up recent stream IDs (last 50)
    console.log('Checking recent stream IDs...');
    for (let i = 1; i <= 50; i++) {
      if (!knownStreamIds.has(i)) { // Skip already checked IDs
        const stream = await fetchStreamById(i);
        if (stream) {
          streams.push(stream);
          // Add to known IDs for future reference
          setKnownStreamIds(prev => new Set([...prev, i]));
        }
      }
    }
    
    console.log(`Direct lookup found ${streams.length} total streams`);
    
    return {
      incoming: streams.filter(s => s.recipient.toLowerCase() === meLc),
      outgoing: streams.filter(s => s.sender.toLowerCase() === meLc)
    };
  }, [fetchStreamsFromEvents, fetchStreamById, knownStreamIds]);

  const refreshStreams = useCallback(async (force = false) => {
    if (!walletAddress) return;
    
    // Don't set loading if this is a forced refresh (like after stream creation)
    if (!force) {
      setIsLoadingStreams(true);
    }
    
    console.log(`Refreshing streams for ${walletAddress}${force ? ' (forced)' : ''}`);
    const { incoming, outgoing } = await fetchAllStreams(walletAddress);
    setIncomingStreams(incoming);
    setOutgoingStreams(outgoing);
    
    if (!force) {
      setIsLoadingStreams(false);
      setIsInitialLoad(false);
    }
    
    console.log(`Stream refresh complete: ${incoming.length} incoming, ${outgoing.length} outgoing`);
  }, [walletAddress, fetchAllStreams]);

  const withdraw = async (streamId) => {
    if (!contractWithSigner) return;
    try {
      setStatus('Withdrawing...');
      setIsProcessing(true);
      const loadingToast = toast.transaction.pending('Processing withdrawal...');
      const tx = await contractWithSigner.withdrawFromStream(streamId);
      await tx.wait();
      toast.dismiss(loadingToast);
      setStatus('Withdrawn.');
      toast.success(`Withdrawn from Stream #${streamId}`, { title: 'Withdrawal Complete' });
      await refreshStreams(true);
    } catch (e) {
      console.error(e);
      setStatus(e?.shortMessage || e?.message || 'Withdraw failed.');
      toast.error(e?.shortMessage || e?.message || 'Withdraw failed', { title: 'Withdrawal Failed' });
    } finally { setIsProcessing(false); }
  };

  const cancel = async (streamId) => {
    if (!contractWithSigner) return;
    try {
      setStatus('Cancelling stream...');
      setIsProcessing(true);
      const loadingToast = toast.transaction.pending('Cancelling stream...');
      const tx = await contractWithSigner.cancelStream(streamId);
      await tx.wait();
      toast.dismiss(loadingToast);
      setStatus('Stream cancelled.');
      toast.stream.cancelled(streamId);
      await refreshStreams(true);
    } catch (e) {
      console.error(e);
      setStatus(e?.shortMessage || e?.message || 'Cancel failed.');
      toast.error(e?.shortMessage || e?.message || 'Cancel failed', { title: 'Cancellation Failed' });
    } finally { setIsProcessing(false); }
  };

  const createStream = async (recipient, duration, amount) => {
    if (!contractWithSigner || !provider || !signer) {
      setStatus('Please connect your wallet.');
      return null;
    }
    try {
      if (!ethers.isAddress(recipient)) { 
        setStatus('Invalid recipient address.'); 
        return null; 
      }
      
      const totalAmountWei = ethers.parseEther(amount.toString());
      const dur = parseInt(duration, 10);
      
      if (totalAmountWei <= 0n || !Number.isFinite(dur) || dur <= 0) {
        setStatus('Enter a positive amount and duration.'); 
        return null;
      }

      // Check TCRO balance
      const balance = await provider.getBalance(walletAddress);
      if (balance < totalAmountWei) {
        setStatus('Insufficient TCRO balance.');
        toast.error('Insufficient TCRO balance', { title: 'Balance Error' });
        return null;
      }

      setStatus('Creating stream...');
      setIsProcessing(true);
      
      const loadingToast = toast.transaction.pending('Creating stream with TCRO...');
      
      // Create stream with native TCRO (payable function)
      const tx = await contractWithSigner.createStream(
        recipient, 
        dur, 
        "{}", 
        { value: totalAmountWei } // Send TCRO as msg.value
      );
      
      const receipt = await tx.wait();
      toast.dismiss(loadingToast);
      
      let createdId = null;
      try {
        const iface = contractWithSigner.interface;
        const topic = iface.getEventTopic('StreamCreated');
        for (const log of receipt.logs || []) {
          if (log.address?.toLowerCase() === contractAddress.toLowerCase() && log.topics?.[0] === topic) {
            const parsed = iface.parseLog({ topics: Array.from(log.topics), data: log.data });
            const sid = parsed?.args?.streamId ?? parsed?.args?.[0];
            if (sid !== undefined && sid !== null) { 
              createdId = Number(sid); 
              break; 
            }
          }
        }
      } catch {}
      
      if (createdId !== null) {
        setStatus(`Stream created. ID #${createdId}`);
        toast.stream.created(createdId);
        // Store the created stream ID for direct lookup
        setKnownStreamIds(prev => new Set([...prev, createdId]));
      } else {
        setStatus('Stream created.');
        toast.success('Stream created successfully', { title: 'Stream Created' });
      }
      
      // Force refresh streams immediately after creation
      await refreshStreams(true);
      await fetchTcroBalance(); // Refresh TCRO balance
      
      // Also do a delayed refresh to catch any delayed events
      setTimeout(() => {
        refreshStreams(true);
      }, 2000);
      
      return createdId;
    } catch (error) {
      console.error('Stream creation failed:', error);
      setStatus(error?.shortMessage || error?.message || 'Transaction failed.');
      toast.error(error?.shortMessage || error?.message || 'Transaction failed', { title: 'Stream Creation Failed' });
      return null;
    } finally { 
      setIsProcessing(false); 
    }
  };

  const getClaimableBalance = async (streamId) => {
    if (!provider) return '0.0';
    try {
      const read = new ethers.Contract(contractAddress, contractABI, provider);
      const amount = await read.getClaimableBalance(streamId);
      return ethers.formatEther(amount);
    } catch { return '0.0'; }
  };

  const formatEth = (weiBigInt) => {
    try { return Number(ethers.formatEther(weiBigInt)).toLocaleString(undefined, { maximumFractionDigits: 6 }); }
    catch { return '0'; }
  };

  useEffect(() => {
    if (!walletAddress || !contractWithProvider) return;
    refreshStreams();
    fetchTcroBalance();
    const listener = () => refreshStreams();
    contractWithProvider.on('StreamCreated', listener);
    contractWithProvider.on('StreamCancelled', listener);
    contractWithProvider.on('Withdrawn', listener);
    return () => {
      try {
        contractWithProvider.off('StreamCreated', listener);
        contractWithProvider.off('StreamCancelled', listener);
        contractWithProvider.off('Withdrawn', listener);
      } catch {}
    };
  }, [walletAddress, contractWithProvider, refreshStreams, fetchTcroBalance]);

  const value = {
    provider, signer, walletAddress, chainId, status, setStatus, isProcessing, setIsProcessing,
    tcroBalance, incomingStreams, setIncomingStreams, outgoingStreams, isLoadingStreams, isInitialLoad,
    contractWithProvider, contractWithSigner, getNetworkName, connectWallet, fetchTcroBalance,
    getTcroFromFaucet, refreshStreams, withdraw, cancel, createStream, getClaimableBalance, formatEth, toast
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
