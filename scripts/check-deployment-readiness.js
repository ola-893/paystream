#!/usr/bin/env node

/**
 * Deployment Readiness Check
 * Verifies that the environment is ready for Cronos testnet deployment
 */

require('dotenv').config();
const { ethers } = require('ethers');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDeploymentReadiness() {
  log('\n🔍 Checking Deployment Readiness for Cronos Testnet\n', 'cyan');

  let allChecks = true;

  // Check 1: PRIVATE_KEY exists
  log('1️⃣  Checking PRIVATE_KEY...', 'blue');
  if (!process.env.PRIVATE_KEY) {
    log('   ❌ PRIVATE_KEY not found in .env', 'red');
    log('   → Add your private key to .env file', 'yellow');
    allChecks = false;
  } else if (!process.env.PRIVATE_KEY.startsWith('0x')) {
    log('   ⚠️  PRIVATE_KEY should start with 0x', 'yellow');
    log('   → Current format may cause issues', 'yellow');
  } else {
    log('   ✅ PRIVATE_KEY is set', 'green');
  }

  // Check 2: CRONOS_RPC_URL
  log('\n2️⃣  Checking CRONOS_RPC_URL...', 'blue');
  const rpcUrl = process.env.CRONOS_RPC_URL || 'https://evm-t3.cronos.org';
  log(`   ℹ️  Using RPC: ${rpcUrl}`, 'cyan');
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) === 338) {
      log('   ✅ Connected to Cronos Testnet (Chain ID: 338)', 'green');
    } else {
      log(`   ❌ Wrong network! Chain ID: ${network.chainId}`, 'red');
      log('   → Expected Chain ID: 338 (Cronos Testnet)', 'yellow');
      allChecks = false;
    }
  } catch (error) {
    log('   ❌ Failed to connect to RPC', 'red');
    log(`   → Error: ${error.message}`, 'yellow');
    allChecks = false;
  }

  // Check 3: Wallet balance
  log('\n3️⃣  Checking wallet balance...', 'blue');
  if (process.env.PRIVATE_KEY) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      const balanceInTCRO = ethers.formatEther(balance);

      log(`   ℹ️  Deployer address: ${wallet.address}`, 'cyan');
      log(`   ℹ️  Balance: ${balanceInTCRO} TCRO`, 'cyan');

      if (parseFloat(balanceInTCRO) < 2) {
        log('   ⚠️  Low balance! Deployment needs ~2-3 TCRO', 'yellow');
        log('   → Get TCRO from: https://cronos.org/faucet', 'yellow');
        allChecks = false;
      } else {
        log('   ✅ Sufficient TCRO for deployment', 'green');
      }
    } catch (error) {
      log('   ❌ Failed to check balance', 'red');
      log(`   → Error: ${error.message}`, 'yellow');
      allChecks = false;
    }
  }

  // Check 4: Hardhat config
  log('\n4️⃣  Checking hardhat.config.js...', 'blue');
  try {
    const fs = require('fs');
    const configContent = fs.readFileSync('hardhat.config.js', 'utf8');
    
    if (configContent.includes('cronos_testnet')) {
      log('   ✅ cronos_testnet network configured', 'green');
    } else {
      log('   ❌ cronos_testnet network not found', 'red');
      allChecks = false;
    }
    
    if (configContent.includes('chainId: 338')) {
      log('   ✅ Chain ID is correct (338)', 'green');
    } else {
      log('   ⚠️  Chain ID 338 not found in config', 'yellow');
    }
  } catch (error) {
    log('   ❌ Failed to read hardhat.config.js', 'red');
    log(`   → Error: ${error.message}`, 'yellow');
    allChecks = false;
  }

  // Check 5: Deployment script
  log('\n5️⃣  Checking deployment script...', 'blue');
  const fs = require('fs');
  if (fs.existsSync('scripts/deploy.js')) {
    const deployScript = fs.readFileSync('scripts/deploy.js', 'utf8');
    if (deployScript.includes('cronos_testnet')) {
      log('   ✅ Deployment script references cronos_testnet', 'green');
    } else {
      log('   ⚠️  Deployment script may not be updated for Cronos', 'yellow');
    }
  } else {
    log('   ❌ scripts/deploy.js not found', 'red');
    allChecks = false;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  if (allChecks) {
    log('✅ All checks passed! Ready to deploy to Cronos Testnet', 'green');
    log('\nRun deployment with:', 'cyan');
    log('  npm run deploy:cronos', 'green');
  } else {
    log('❌ Some checks failed. Please fix the issues above.', 'red');
    log('\nCommon fixes:', 'yellow');
    log('  1. Get TCRO: https://cronos.org/faucet', 'yellow');
    log('  2. Set PRIVATE_KEY in .env file', 'yellow');
    log('  3. Ensure CRONOS_RPC_URL is correct', 'yellow');
  }
  log('='.repeat(60) + '\n', 'cyan');

  process.exit(allChecks ? 0 : 1);
}

checkDeploymentReadiness().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
