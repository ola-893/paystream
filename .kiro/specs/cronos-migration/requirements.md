# Requirements Document: Cronos Network Migration

## Introduction

This feature migrates the entire PayStream ecosystem from Ethereum Sepolia testnet to Cronos testnet. The migration encompasses smart contracts, frontend application, documentation, agent demos, and all supporting infrastructure. The goal is to leverage Cronos's lower gas fees, faster block times, and better alignment with the MNEE stablecoin ecosystem while maintaining full feature parity.

## Glossary

- **Cronos_Testnet**: The Cronos EVM-compatible testnet (Chain ID: 338) used for development and testing
- **Sepolia**: The Ethereum testnet (Chain ID: 11155111) being replaced
- **TCRO**: The native gas token on Cronos testnet
- **Cronos_Explorer**: The block explorer for Cronos network at https://explorer.cronos.org
- **PayStream_System**: The complete payment streaming platform including contracts, frontend, SDK, and demos
- **Network_Configuration**: Chain ID, RPC endpoints, block explorers, and native currency settings
- **Frontend_Dashboard**: The React-based web application for managing payment streams
- **Agent_Demo**: The CLI demonstration of AI agents making autonomous payments
- **Documentation_Suite**: All markdown files including README, deployment guides, and API docs

## Requirements

### Requirement 1: Smart Contract Network Configuration

**User Story:** As a developer, I want to deploy PayStream contracts to Cronos testnet, so that I can leverage lower gas fees and faster transactions.

#### Acceptance Criteria

1. THE Hardhat_Config SHALL define a cronos_testnet network with Chain ID 338
2. THE Hardhat_Config SHALL use https://evm-t3.cronos.org as the default RPC URL
3. THE Deployment_Script SHALL detect cronos_testnet network and deploy MockMNEE and PayStreamStream
4. THE Environment_Variables SHALL use CRONOS_RPC_URL instead of SEPOLIA_RPC_URL
5. THE .env.example SHALL document Cronos testnet configuration with correct RPC URL and chain ID

### Requirement 2: Frontend Network Detection and Switching

**User Story:** As a user, I want the dashboard to automatically detect and switch to Cronos testnet, so that I can use PayStream without manual network configuration.

#### Acceptance Criteria

1. WHEN the app loads, THE Frontend_Dashboard SHALL check if MetaMask is connected to Chain ID 338
2. IF the user is on the wrong network, THEN THE Frontend_Dashboard SHALL prompt to switch to Cronos testnet
3. WHEN adding the network, THE Frontend_Dashboard SHALL provide correct Cronos testnet parameters (name, RPC, chain ID, currency, explorer)
4. THE Network_Indicator SHALL display "Cronos Testnet" when connected to Chain ID 338
5. THE Frontend_Dashboard SHALL use TCRO as the native currency symbol in all displays

### Requirement 3: Block Explorer Integration

**User Story:** As a user, I want to view my transactions on Cronos Explorer, so that I can verify payment streams and contract interactions.

#### Acceptance Criteria

1. THE Frontend_Dashboard SHALL generate Cronos Explorer links in the format https://explorer.cronos.org/testnet/tx/{hash}
2. THE Agent_Demo SHALL display Cronos Explorer links for all blockchain transactions
3. THE Documentation SHALL reference Cronos Explorer instead of Etherscan for transaction verification
4. WHEN displaying transaction hashes, THE System SHALL make them clickable links to Cronos Explorer
5. THE Error_Messages SHALL direct users to Cronos Explorer for transaction debugging

### Requirement 4: Frontend Documentation Updates

**User Story:** As a user, I want the in-app documentation to reflect Cronos testnet, so that I have accurate setup instructions.

#### Acceptance Criteria

1. THE Docs_Page SHALL display Cronos testnet as the active network with Chain ID 338
2. THE Quick_Start_Guide SHALL provide instructions for adding Cronos testnet to MetaMask
3. THE Docs_Page SHALL reference https://cronos.org/faucet for obtaining TCRO
4. THE Network_Configuration_Section SHALL show Cronos RPC URL and chain ID
5. THE Mainnet_Migration_Section SHALL reference Cronos Mainnet (Chain ID 25) instead of Ethereum Mainnet

### Requirement 5: Agent Demo Configuration

**User Story:** As a developer, I want the agent demo to connect to Cronos testnet, so that I can test autonomous payments with lower gas costs.

#### Acceptance Criteria

1. THE Agent_Config SHALL use CRONOS_RPC_URL environment variable
2. THE Agent_Demo SHALL display "Connecting to Cronos Testnet" during initialization
3. THE CLI_Output SHALL format transaction links for Cronos Explorer
4. THE Demo_Scenarios SHALL reference Cronos testnet in all network-related messages
5. THE Agent_Demo SHALL validate that CRONOS_RPC_URL is set before starting

### Requirement 6: Comprehensive Documentation Migration

**User Story:** As a developer, I want all documentation to reference Cronos testnet, so that I have consistent and accurate information.

#### Acceptance Criteria

1. THE README.md SHALL describe PayStream as deployed on Cronos testnet
2. THE DEPLOYMENT.md SHALL provide Cronos-specific deployment instructions
3. THE docs/deployment/ folder SHALL contain cronos-testnet.md instead of sepolia.md
4. THE Getting_Started_Guides SHALL reference Cronos faucet and RPC endpoints
5. THE Architecture_Diagrams SHALL show Cronos as the blockchain layer

### Requirement 7: Environment Variable Consistency

**User Story:** As a developer, I want consistent environment variable naming, so that configuration is clear and maintainable.

#### Acceptance Criteria

1. ALL configuration files SHALL use CRONOS_RPC_URL instead of SEPOLIA_RPC_URL
2. THE .env.example SHALL document all Cronos-related variables with examples
3. THE Config_Loaders SHALL validate CRONOS_RPC_URL is present
4. THE Error_Messages SHALL reference CRONOS_RPC_URL when configuration is missing
5. THE Documentation SHALL show CRONOS_RPC_URL in all code examples

### Requirement 8: Contract Address Placeholders

**User Story:** As a developer, I want clear placeholders for contract addresses, so that I know to deploy contracts before using the system.

#### Acceptance Criteria

1. THE .env.example SHALL use "TBD - Deploy yourself" for contract address comments
2. THE Documentation SHALL instruct users to deploy contracts and update addresses
3. THE Frontend_Config SHALL use placeholder addresses that trigger clear error messages
4. THE README SHALL provide step-by-step contract deployment instructions for Cronos
5. THE Deployment_Guides SHALL show expected output from Cronos testnet deployment

### Requirement 9: Rust Agent Backend Updates

**User Story:** As a developer, I want the Rust agent backend to reference Cronos, so that all components are consistent.

#### Acceptance Criteria

1. THE Rust_Agent SHALL use "cronos_testnet" as the network identifier in x402 headers
2. THE Payment_Requirements SHALL specify Cronos testnet in network field
3. THE Agent_Configuration SHALL document Cronos RPC endpoints
4. THE Error_Handling SHALL reference Cronos-specific issues (faucet, explorer)
5. THE Rust_Tests SHALL mock Cronos testnet responses

### Requirement 10: Spec Documentation Updates

**User Story:** As a developer, I want the spec files to reflect Cronos testnet, so that implementation guidance is accurate.

#### Acceptance Criteria

1. THE agent-first-demo specs SHALL reference Cronos testnet in all requirements
2. THE Design_Documents SHALL show Cronos in architecture diagrams
3. THE Task_Lists SHALL use CRONOS_RPC_URL in implementation steps
4. THE Property_Definitions SHALL reference Cronos Explorer for verification
5. THE Glossary_Terms SHALL define Cronos_Testnet and related concepts

### Requirement 11: Migration Documentation

**User Story:** As a developer, I want comprehensive migration documentation, so that I understand all changes and required actions.

#### Acceptance Criteria

1. THE Migration_Guide SHALL list all files changed with before/after comparisons
2. THE Migration_Guide SHALL provide a checklist of required user actions
3. THE Migration_Guide SHALL document breaking changes and their impact
4. THE Migration_Guide SHALL include MetaMask configuration instructions
5. THE Migration_Guide SHALL reference Cronos resources (docs, faucet, explorer)

### Requirement 12: Frontend UI Text Updates

**User Story:** As a user, I want all UI text to reference Cronos, so that the interface is consistent and clear.

#### Acceptance Criteria

1. THE Error_Messages SHALL say "Switch to Cronos Testnet" instead of "Switch to Sepolia"
2. THE Network_Selector SHALL display "Cronos Testnet" as the network name
3. THE Help_Text SHALL reference TCRO for gas fees instead of ETH
4. THE Status_Messages SHALL use Cronos-specific terminology
5. THE Tooltips SHALL provide Cronos-relevant information

### Requirement 13: Package Scripts and Commands

**User Story:** As a developer, I want npm scripts to reference Cronos, so that deployment commands are intuitive.

#### Acceptance Criteria

1. THE package.json SHALL include a deploy:cronos script
2. THE README SHALL document npm run deploy:cronos command
3. THE Deployment_Scripts SHALL use --network cronos_testnet flag
4. THE Test_Scripts SHALL support Cronos testnet for integration tests
5. THE Documentation SHALL show correct command syntax for Cronos deployment
