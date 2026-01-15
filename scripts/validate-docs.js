#!/usr/bin/env node

/**
 * Documentation Validation Script
 * Validates that all documentation has been properly updated for Cronos migration
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
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

function checkFile(filePath, checks) {
  if (!fs.existsSync(filePath)) {
    log(`  ❌ File not found: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;

  checks.forEach(check => {
    const passed = check.test(content);
    if (passed) {
      log(`  ✅ ${check.description}`, 'green');
    } else {
      log(`  ❌ ${check.description}`, 'red');
      if (check.hint) {
        log(`     Hint: ${check.hint}`, 'yellow');
      }
      allPassed = false;
    }
  });

  return allPassed;
}

function main() {
  log('\n🔍 Validating Cronos Migration Documentation\n', 'cyan');

  let totalPassed = 0;
  let totalFailed = 0;

  // Test 1: Check README.md
  log('📄 Checking README.md...', 'blue');
  const readmeChecks = [
    {
      description: 'References Cronos Testnet',
      test: (content) => content.includes('Cronos Testnet') || content.includes('Cronos testnet'),
    },
    {
      description: 'Contains Cronos faucet link',
      test: (content) => content.includes('cronos.org/faucet'),
    },
    {
      description: 'No inappropriate Sepolia references',
      test: (content) => {
        // Allow mentions of migration FROM Sepolia
        const lines = content.split('\n');
        const inappropriateLines = lines.filter(line => {
          const lower = line.toLowerCase();
          // Allow if it's talking about migration from Sepolia
          if (lower.includes('migrated from') && lower.includes('sepolia')) return false;
          if (lower.includes('migration from') && lower.includes('sepolia')) return false;
          if (lower.includes('upgrading from') && lower.includes('sepolia')) return false;
          // Otherwise, Sepolia shouldn't be mentioned
          return lower.includes('sepolia');
        });
        return inappropriateLines.length === 0;
      },
      hint: 'Found Sepolia references that are not about migration history',
    },
    {
      description: 'Contains Chain ID 338',
      test: (content) => content.includes('338'),
    },
    {
      description: 'Contains Cronos RPC URL',
      test: (content) => content.includes('evm-t3.cronos.org'),
    },
  ];
  
  if (checkFile('README.md', readmeChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 2: Check DEPLOYMENT.md
  log('\n📄 Checking DEPLOYMENT.md...', 'blue');
  const deploymentChecks = [
    {
      description: 'References Cronos Testnet',
      test: (content) => content.includes('Cronos'),
    },
    {
      description: 'Contains deploy:cronos command',
      test: (content) => content.includes('deploy:cronos'),
    },
    {
      description: 'No Sepolia references',
      test: (content) => !content.toLowerCase().includes('sepolia'),
    },
    {
      description: 'Contains Cronos Explorer link',
      test: (content) => content.includes('explorer.cronos.org'),
    },
  ];
  
  if (checkFile('DEPLOYMENT.md', deploymentChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 3: Check .env.example
  log('\n📄 Checking .env.example...', 'blue');
  const envChecks = [
    {
      description: 'Contains CRONOS_RPC_URL',
      test: (content) => content.includes('CRONOS_RPC_URL'),
    },
    {
      description: 'No SEPOLIA_RPC_URL',
      test: (content) => !content.includes('SEPOLIA_RPC_URL'),
      hint: 'SEPOLIA_RPC_URL should be renamed to CRONOS_RPC_URL',
    },
    {
      description: 'Contains Cronos faucet link',
      test: (content) => content.includes('cronos.org/faucet'),
    },
    {
      description: 'Contains Cronos RPC URL',
      test: (content) => content.includes('evm-t3.cronos.org'),
    },
  ];
  
  if (checkFile('.env.example', envChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 4: Check hardhat.config.js
  log('\n📄 Checking hardhat.config.js...', 'blue');
  const hardhatChecks = [
    {
      description: 'Contains cronos_testnet network',
      test: (content) => content.includes('cronos_testnet'),
    },
    {
      description: 'Chain ID is 338',
      test: (content) => content.includes('chainId: 338'),
    },
    {
      description: 'Uses CRONOS_RPC_URL',
      test: (content) => content.includes('CRONOS_RPC_URL'),
    },
    {
      description: 'No sepolia network',
      test: (content) => !content.toLowerCase().includes('sepolia'),
    },
  ];
  
  if (checkFile('hardhat.config.js', hardhatChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 5: Check deployment script
  log('\n📄 Checking scripts/deploy.js...', 'blue');
  const deployScriptChecks = [
    {
      description: 'References cronos_testnet',
      test: (content) => content.includes('cronos_testnet'),
    },
    {
      description: 'Contains Cronos Explorer links',
      test: (content) => content.includes('explorer.cronos.org/testnet'),
    },
    {
      description: 'No Sepolia references',
      test: (content) => !content.toLowerCase().includes('sepolia'),
    },
  ];
  
  if (checkFile('scripts/deploy.js', deployScriptChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 6: Check package.json
  log('\n📄 Checking package.json...', 'blue');
  const packageChecks = [
    {
      description: 'Contains deploy:cronos script',
      test: (content) => content.includes('deploy:cronos'),
    },
    {
      description: 'deploy:cronos uses cronos_testnet',
      test: (content) => content.includes('--network cronos_testnet'),
    },
  ];
  
  if (checkFile('package.json', packageChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 7: Check docs/deployment/cronos-testnet.md
  log('\n📄 Checking docs/deployment/cronos-testnet.md...', 'blue');
  const cronosDocsChecks = [
    {
      description: 'File exists',
      test: () => fs.existsSync('docs/deployment/cronos-testnet.md'),
    },
    {
      description: 'Contains deployment instructions',
      test: (content) => content.includes('deploy') || content.includes('Deploy'),
    },
    {
      description: 'Contains Cronos faucet link',
      test: (content) => content.includes('cronos.org/faucet'),
    },
  ];
  
  if (checkFile('docs/deployment/cronos-testnet.md', cronosDocsChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 8: Check that sepolia.md is removed
  log('\n📄 Checking docs/deployment/sepolia.md is removed...', 'blue');
  if (!fs.existsSync('docs/deployment/sepolia.md')) {
    log('  ✅ sepolia.md has been removed', 'green');
    totalPassed++;
  } else {
    log('  ❌ sepolia.md still exists - should be deleted', 'red');
    totalFailed++;
  }

  // Test 9: Check agent demo config
  log('\n📄 Checking demo/agent-demo/config.ts...', 'blue');
  const agentConfigChecks = [
    {
      description: 'Uses CRONOS_RPC_URL',
      test: (content) => content.includes('CRONOS_RPC_URL'),
    },
    {
      description: 'No SEPOLIA_RPC_URL',
      test: (content) => !content.includes('SEPOLIA_RPC_URL'),
    },
  ];
  
  if (checkFile('demo/agent-demo/config.ts', agentConfigChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 10: Check agent demo CLI output
  log('\n📄 Checking demo/agent-demo/CLIOutput.ts...', 'blue');
  const cliOutputChecks = [
    {
      description: 'Uses cronosExplorerLink method',
      test: (content) => content.includes('cronosExplorerLink') || content.includes('explorer.cronos.org'),
    },
    {
      description: 'No etherscanLink references',
      test: (content) => !content.includes('etherscanLink'),
    },
  ];
  
  if (checkFile('demo/agent-demo/CLIOutput.ts', cliOutputChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Test 11: Check CRONOS_MIGRATION.md exists
  log('\n📄 Checking CRONOS_MIGRATION.md...', 'blue');
  const migrationChecks = [
    {
      description: 'File exists',
      test: () => fs.existsSync('CRONOS_MIGRATION.md'),
    },
    {
      description: 'Contains migration information',
      test: (content) => content.includes('migration') || content.includes('Migration'),
    },
    {
      description: 'Lists changed files',
      test: (content) => content.includes('file') || content.includes('File'),
    },
  ];
  
  if (checkFile('CRONOS_MIGRATION.md', migrationChecks)) {
    totalPassed++;
  } else {
    totalFailed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Validation Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`✅ Passed: ${totalPassed}`, 'green');
  log(`❌ Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`, 
      totalFailed === 0 ? 'green' : 'yellow');
  log('='.repeat(60) + '\n', 'cyan');

  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
