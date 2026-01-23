# Frontend Connection Test Guide - Task 12.2

This document provides step-by-step instructions to test the frontend connection to Cronos testnet.

## Prerequisites

- MetaMask browser extension installed
- TCRO tokens from https://cronos.org/faucet
- Frontend application running (`npm run dev` in vite-project directory)

## Test Cases

### Test 1: Network Detection on Load
**Requirement: 2.1 - Check if MetaMask is connected to Chain ID 338**

**Steps:**
1. Open MetaMask and ensure you're connected to a network OTHER than Cronos Testnet (e.g., Ethereum Mainnet)
2. Navigate to http://localhost:5173 (or your frontend URL)
3. Click "Connect Wallet" button

**Expected Results:**
- ✅ Application should detect wrong network
- ✅ Should prompt to switch to Cronos Testnet
- ✅ Console should show current chain ID check

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Notes: _______________________________________________

---

### Test 2: Network Switching Prompt
**Requirement: 2.2 - Prompt to switch to Cronos testnet if on wrong network**

**Steps:**
1. With MetaMask on wrong network, connect wallet
2. Observe the MetaMask popup requesting network switch
3. Click "Switch Network" in MetaMask

**Expected Results:**
- ✅ MetaMask should show "Switch Network" popup
- ✅ Popup should request switch to Cronos Testnet (Chain ID 338)
- ✅ After approval, wallet should connect to Cronos Testnet

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Notes: _______________________________________________

---

### Test 3: Add Network Flow (Error 4902)
**Requirement: 2.3 - Add Cronos testnet if not already added**

**Steps:**
1. Remove Cronos Testnet from MetaMask networks (if present)
   - Open MetaMask → Settings → Networks
   - Find Cronos Testnet and delete it
2. Refresh the frontend application
3. Click "Connect Wallet"
4. When prompted to switch networks, approve

**Expected Results:**
- ✅ MetaMask should show "Add Network" popup (error code 4902)
- ✅ Network details should be correct:
  - Network Name: Cronos Testnet
  - RPC URL: https://evm-t3.cronos.org
  - Chain ID: 338
  - Currency Symbol: TCRO
  - Block Explorer: https://explorer.cronos.org/testnet
- ✅ After approval, network should be added and selected

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Network Details Verified:
  - [ ] Network Name correct
  - [ ] RPC URL correct
  - [ ] Chain ID correct
  - [ ] Currency Symbol correct
  - [ ] Block Explorer correct
- Notes: _______________________________________________

---

### Test 4: Network Indicator Display
**Requirement: 2.4 - Display "Cronos Testnet" when connected to Chain ID 338**

**Steps:**
1. Ensure MetaMask is connected to Cronos Testnet
2. Connect wallet to the application
3. Observe the network indicator in the header

**Expected Results:**
- ✅ Network indicator should display "Cronos Testnet"
- ✅ Chain icon should show Hexagon icon (Cronos icon)
- ✅ Green pulse indicator should be visible (connected status)
- ✅ Network indicator should be in the header (desktop view)

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Network Name Displayed: _______________________________________________
- Icon Type: _______________________________________________
- Notes: _______________________________________________

---

### Test 5: Successful Connection Flow
**Requirement: 2.1, 2.2, 2.3, 2.4 - Complete connection flow**

**Steps:**
1. Start with MetaMask on Cronos Testnet
2. Navigate to frontend application
3. Click "Connect Wallet"
4. Approve connection in MetaMask

**Expected Results:**
- ✅ No network switch prompt (already on correct network)
- ✅ Wallet connects immediately
- ✅ Wallet address displayed in header (0x1234...5678 format)
- ✅ Network indicator shows "Cronos Testnet"
- ✅ Status bar shows "Connected"
- ✅ Success toast notification appears

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Wallet Address Displayed: _______________________________________________
- Status Message: _______________________________________________
- Notes: _______________________________________________

---

### Test 6: Network Change Detection
**Requirement: 2.1 - Detect network changes after connection**

**Steps:**
1. Connect wallet to application on Cronos Testnet
2. In MetaMask, manually switch to a different network (e.g., Ethereum Mainnet)
3. Observe application behavior

**Expected Results:**
- ✅ Application should detect network change
- ✅ Chain ID state should update
- ✅ Network indicator should update to show new network
- ✅ Application should prompt to switch back to Cronos Testnet

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Notes: _______________________________________________

---

### Test 7: Mobile Responsive Network Indicator
**Requirement: 2.4 - Network indicator displays correctly on mobile**

**Steps:**
1. Open browser DevTools and switch to mobile view (iPhone/Android)
2. Connect wallet
3. Observe network indicator visibility

**Expected Results:**
- ✅ Network indicator should be hidden on small screens (sm breakpoint)
- ✅ Wallet address should still be visible
- ✅ Connect button should be accessible
- ✅ Mobile menu should work correctly

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Notes: _______________________________________________

---

### Test 8: Error Handling - MetaMask Not Installed
**Requirement: 2.1 - Handle missing MetaMask gracefully**

**Steps:**
1. Disable MetaMask extension or use browser without MetaMask
2. Navigate to frontend application
3. Click "Connect Wallet"

**Expected Results:**
- ✅ Error message: "Please install MetaMask."
- ✅ Error toast notification appears
- ✅ Status bar shows error message
- ✅ No console errors or crashes

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Error Message: _______________________________________________
- Notes: _______________________________________________

---

### Test 9: Error Handling - User Rejects Connection
**Requirement: 2.2 - Handle rejected wallet connection**

**Steps:**
1. Click "Connect Wallet"
2. In MetaMask popup, click "Cancel" or "Reject"

**Expected Results:**
- ✅ Error message displayed
- ✅ Status shows "Connection failed."
- ✅ Error toast notification appears
- ✅ Application remains functional

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Error Message: _______________________________________________
- Notes: _______________________________________________

---

### Test 10: Error Handling - User Rejects Network Switch
**Requirement: 2.2 - Handle rejected network switch**

**Steps:**
1. Connect wallet on wrong network
2. When prompted to switch networks, click "Cancel" in MetaMask

**Expected Results:**
- ✅ Error message displayed
- ✅ Application shows wrong network warning
- ✅ User can retry connection
- ✅ No application crash

**Actual Results:**
- [ ] Pass
- [ ] Fail
- Error Message: _______________________________________________
- Notes: _______________________________________________

---

## Summary

### Test Results
- Total Tests: 10
- Passed: _____ / 10
- Failed: _____ / 10

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Requirements Validation

#### Requirement 2.1: Network Detection ✅ / ❌
- [ ] App checks for Chain ID 338 on load
- [ ] Detects network changes after connection
- [ ] Handles missing MetaMask gracefully

#### Requirement 2.2: Network Switching ✅ / ❌
- [ ] Prompts to switch when on wrong network
- [ ] Handles user rejection gracefully
- [ ] Switches successfully when approved

#### Requirement 2.3: Add Network Parameters ✅ / ❌
- [ ] Provides correct Cronos testnet parameters
- [ ] Network Name: Cronos Testnet
- [ ] RPC URL: https://evm-t3.cronos.org
- [ ] Chain ID: 338
- [ ] Currency: TCRO
- [ ] Explorer: https://explorer.cronos.org/testnet

#### Requirement 2.4: Network Indicator ✅ / ❌
- [ ] Displays "Cronos Testnet" when connected
- [ ] Shows correct chain icon (Hexagon)
- [ ] Shows connection status indicator
- [ ] Responsive on mobile devices

### Tester Information
- Tester Name: _______________________________________________
- Date: _______________________________________________
- Browser: _______________________________________________
- MetaMask Version: _______________________________________________
- Frontend URL: _______________________________________________

### Additional Notes
_______________________________________________
_______________________________________________
_______________________________________________
