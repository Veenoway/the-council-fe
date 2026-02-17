// src/abi/TheCouncilDAO.ts

export const THE_COUNCIL_DAO_ABI = [
  // ── CONSTRUCTOR ────────────────────────────────────────
  {
    inputs: [{ name: "_councilToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // ── WRITE ──────────────────────────────────────────────
  {
    name: "fundPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "createProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_type", type: "string" },
      { name: "_options", type: "string[]" },
      { name: "_durationSeconds", type: "uint256" },
      { name: "_rewardAmount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "vote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_optionIndex", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "finalize",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "claimReward",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "setMinBalances",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_toVote", type: "uint256" },
      { name: "_toCreate", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "emergencyWithdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_amount", type: "uint256" }],
    outputs: [],
  },

  // ── READ ───────────────────────────────────────────────
  {
    name: "proposalCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "councilToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "minBalanceToVote",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "minBalanceToCreate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalReserved",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "availablePool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getProposal",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "proposalType", type: "string" },
      { name: "optionCount", type: "uint256" },
      { name: "startsAt", type: "uint256" },
      { name: "endsAt", type: "uint256" },
      { name: "createdBy", type: "address" },
      { name: "cancelled", type: "bool" },
      { name: "finalized", type: "bool" },
      { name: "winningOption", type: "uint256" },
      { name: "rewardAmount", type: "uint256" },
      { name: "totalVotes", type: "uint256" },
      { name: "totalWeight", type: "uint256" },
      { name: "totalClaimed", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    name: "getOptions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [
      { name: "labels", type: "string[]" },
      { name: "voteCounts", type: "uint256[]" },
      { name: "weights", type: "uint256[]" },
    ],
  },
  {
    name: "getVote",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_voter", type: "address" },
    ],
    outputs: [
      { name: "hasVoted", type: "bool" },
      { name: "optionIndex", type: "uint256" },
      { name: "weight", type: "uint256" },
    ],
  },
  {
    name: "getClaimable",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_voter", type: "address" },
    ],
    outputs: [
      { name: "claimable", type: "uint256" },
      { name: "hasClaimed", type: "bool" },
      { name: "isWinner", type: "bool" },
    ],
  },
  {
    name: "getOptionVoters",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_optionIndex", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getWinningOption",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_proposalId", type: "uint256" }],
    outputs: [
      { name: "winningIndex", type: "uint256" },
      { name: "winningLabel", type: "string" },
      { name: "winningWeight", type: "uint256" },
      { name: "winnerCount", type: "uint256" },
    ],
  },
  {
    name: "optionWeights",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "optionVoteCounts",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ── EVENTS ─────────────────────────────────────────────
  {
    name: "ProposalCreated",
    type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "proposalType", type: "string", indexed: false },
      { name: "optionCount", type: "uint256", indexed: false },
      { name: "rewardAmount", type: "uint256", indexed: false },
      { name: "startsAt", type: "uint256", indexed: false },
      { name: "endsAt", type: "uint256", indexed: false },
      { name: "createdBy", type: "address", indexed: true },
    ],
  },
  {
    name: "Voted",
    type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "voter", type: "address", indexed: true },
      { name: "optionIndex", type: "uint256", indexed: false },
      { name: "weight", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ProposalFinalized",
    type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "winningOption", type: "uint256", indexed: false },
      { name: "winningWeight", type: "uint256", indexed: false },
      { name: "winnerCount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "RewardClaimed",
    type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "voter", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ProposalCancelled",
    type: "event",
    inputs: [{ name: "proposalId", type: "uint256", indexed: true }],
  },
  {
    name: "PoolFunded",
    type: "event",
    inputs: [
      { name: "funder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
