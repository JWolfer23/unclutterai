import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const NETWORK = 'base-mainnet';
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 100;

interface MintEntry {
  user_id: string;
  wallet_address: string;
  amount: number;
}

interface BatchMintResult {
  success: boolean;
  tx_hash: string;
  wallets_processed: number;
  total_amount: number;
}

// Mock batch mint function - replace with actual contract call in production
async function executeBatchMint(entries: MintEntry[]): Promise<BatchMintResult> {
  // TODO: Replace with actual Base mainnet contract call
  // Example using ethers.js:
  // const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  // const wallet = new ethers.Wallet(MINTER_PRIVATE_KEY, provider);
  // const contract = new ethers.Contract(UCT_CONTRACT_ADDRESS, UCT_ABI, wallet);
  // const tx = await contract.batchMint(
  //   entries.map(e => e.wallet_address),
  //   entries.map(e => ethers.parseEther(e.amount.toString()))
  // );
  // await tx.wait();
  // return { success: true, tx_hash: tx.hash, ... };

  // Mock implementation for testnet/development
  const mockTxHash = `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  console.log(`[MOCK] Batch minting ${totalAmount} UCT to ${entries.length} wallets`);
  console.log(`[MOCK] Transaction hash: ${mockTxHash}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    tx_hash: mockTxHash,
    wallets_processed: entries.length,
    total_amount: totalAmount,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret or admin auth
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized batch mint request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting batch UCT mint process...');

    // STEP 1: Snapshot balances - get all users with balance > 0 and valid wallet
    const { data: eligibleUsers, error: fetchError } = await supabase
      .from('uct_balances')
      .select('user_id, balance')
      .gt('balance', 0);

    if (fetchError) {
      throw new Error(`Failed to fetch balances: ${fetchError.message}`);
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('No users with positive balance found');
      return new Response(
        JSON.stringify({ batch_size: 0, status: 'no_eligible_users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get wallet addresses for eligible users
    const userIds = eligibleUsers.map(u => u.user_id);
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('user_id, wallet_address')
      .in('user_id', userIds)
      .eq('is_primary', true);

    if (walletError) {
      throw new Error(`Failed to fetch wallets: ${walletError.message}`);
    }

    // Create wallet lookup map
    const walletMap = new Map(walletData?.map(w => [w.user_id, w.wallet_address]) || []);

    // STEP 2: Create mint batch payload
    const mintEntries: MintEntry[] = [];
    const skippedUsers: string[] = [];

    for (const user of eligibleUsers) {
      const walletAddress = walletMap.get(user.user_id);
      
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        console.log(`Skipping user ${user.user_id}: no valid wallet address`);
        skippedUsers.push(user.user_id);
        continue;
      }

      mintEntries.push({
        user_id: user.user_id,
        wallet_address: walletAddress,
        amount: user.balance,
      });

      // Respect batch size limit
      if (mintEntries.length >= MAX_BATCH_SIZE) {
        console.log(`Batch size limit (${MAX_BATCH_SIZE}) reached`);
        break;
      }
    }

    if (mintEntries.length < MIN_BATCH_SIZE) {
      console.log(`Not enough eligible users for batch (need ${MIN_BATCH_SIZE}, have ${mintEntries.length})`);
      return new Response(
        JSON.stringify({ 
          batch_size: mintEntries.length, 
          skipped: skippedUsers.length,
          status: 'insufficient_batch_size' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Preparing batch mint for ${mintEntries.length} users`);

    // STEP 3: Execute batch mint on-chain
    const mintResult = await executeBatchMint(mintEntries);

    if (!mintResult.success) {
      throw new Error('Batch mint failed on-chain');
    }

    console.log(`Batch mint successful: ${mintResult.tx_hash}`);

    // STEP 4 & 5: Log ledger entries and mark as minted
    const timestamp = new Date().toISOString();
    let processedCount = 0;

    for (const entry of mintEntries) {
      // Log to focus_ledger
      await supabase.from('focus_ledger').insert({
        user_id: entry.user_id,
        event_type: 'uct_minted_onchain',
        payload: {
          wallet_address: entry.wallet_address,
          amount: entry.amount,
          network: NETWORK,
          batch_tx: mintResult.tx_hash,
        },
        uct_reward: entry.amount,
        onchain_tx: mintResult.tx_hash,
      });

      // Mark balance as minted (set to 0)
      const { error: updateError } = await supabase
        .from('uct_balances')
        .update({
          balance: 0,
          updated_at: timestamp,
        })
        .eq('user_id', entry.user_id);

      if (updateError) {
        console.error(`Error updating balance for user ${entry.user_id}:`, updateError);
      } else {
        processedCount++;
      }

      console.log(`Processed user ${entry.user_id}: ${entry.amount} UCT minted to ${entry.wallet_address}`);
    }

    console.log(`Batch mint complete: ${processedCount}/${mintEntries.length} users processed`);

    // STEP 6: Return summary
    return new Response(
      JSON.stringify({
        batch_size: processedCount,
        total_amount: mintResult.total_amount,
        tx_hash: mintResult.tx_hash,
        network: NETWORK,
        skipped_users: skippedUsers.length,
        status: 'minted',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch mint error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
