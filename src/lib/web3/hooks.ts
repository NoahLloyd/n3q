"use client";

import { useAccount, useReadContract } from "wagmi";
import { N3Q_MEMBERSHIP_ADDRESS, N3Q_MEMBERSHIP_ABI } from "./contract";

export function useMembership() {
  const { address, isConnected } = useAccount();

  const { data: isMember, isLoading: isMemberLoading, refetch: refetchMember } = useReadContract({
    address: N3Q_MEMBERSHIP_ADDRESS,
    abi: N3Q_MEMBERSHIP_ABI,
    functionName: "isMember",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: tokenId, isLoading: tokenIdLoading } = useReadContract({
    address: N3Q_MEMBERSHIP_ADDRESS,
    abi: N3Q_MEMBERSHIP_ABI,
    functionName: "tokenOfOwner",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isMember === true,
    },
  });

  const { data: tokenURI, isLoading: tokenURILoading } = useReadContract({
    address: N3Q_MEMBERSHIP_ADDRESS,
    abi: N3Q_MEMBERSHIP_ABI,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    address,
    isConnected,
    isMember: isMember ?? false,
    isLoading: isMemberLoading || (isMember && tokenIdLoading),
    tokenId: tokenId !== undefined ? Number(tokenId) : undefined,
    tokenURI,
    refetch: refetchMember,
  };
}

export function useAllMembers() {
  const { data: members, isLoading, refetch } = useReadContract({
    address: N3Q_MEMBERSHIP_ADDRESS,
    abi: N3Q_MEMBERSHIP_ABI,
    functionName: "getAllMembers",
  });

  const { data: totalSupply } = useReadContract({
    address: N3Q_MEMBERSHIP_ADDRESS,
    abi: N3Q_MEMBERSHIP_ABI,
    functionName: "totalSupply",
  });

  return {
    members: members as `0x${string}`[] | undefined,
    totalSupply: totalSupply !== undefined ? Number(totalSupply) : undefined,
    isLoading,
    refetch,
  };
}

