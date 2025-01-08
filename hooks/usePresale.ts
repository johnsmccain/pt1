import { useState, useCallback } from 'react';
import { ethers, formatUnits } from 'ethers';
import { ADDRESSES } from '@/lib/contracts/addresses';
import { PRESALE_ABI, ERC20_ABI } from '@/lib/contracts/abis';
import { getWeb3Provider } from '@/lib/web3/provider';
import { toast } from '@/components/ui/use-toast';
import { UCCInfo, UserUCCInfo } from '@/lib/types';
import { connect, getAccount, readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { config } from '@/lib/config';
import { parseEther } from 'viem';
import { useConnectors } from 'wagmi';

export enum PurchaseStatus {
  IDLE = 'IDLE',
  APPROVING = 'APPROVING',
  APPROVED = 'APPROVED',
  PURCHASING = 'PURCHASING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR'
}

export function usePresale() {
  const [status, setStatus] = useState<PurchaseStatus>(PurchaseStatus.IDLE);
  const [userAddress, setUserAddress] = useState<string>("");
  const [curPage, setCurPage] = useState<number>(1);
  const [totalTokens, setTotalToken] = useState<number>(0);
  const [uccInfo, setUCCInfo] = useState<UCCInfo>({
    totalInvestmentsUSDT: 0, totalInvestmentsBNB: 0, totalUsers: 0, priceUSDT: 0, priceBNB: 0, totalTokensToBEDistributed: 0
  });

  const [userUCCInfo, setUserUCCInfo] = useState<UserUCCInfo>({
    userId: 0, usersInfo: null, recentActivities: [], activityLength: 0
  });

  async function initWallet() {
    try {
      // const result = await connect(config, { connector: injected() })

      const result = await connect(config, { connector: injected() })
      // console.log(result.accounts[0])
      // Presale Contract
      // const ps = new ethers.Contract(
      //   ADDRESSES.PRESALE,
      //   PRESALE_ABI,
      //   _signer
      // );

      setUserAddress(result.accounts[0]);
      // console.log(account?.address || "");
      // console.log(_userAddress);
      const ucci = await getUCCInfo();
      const useri = await getUserInfo( result.accounts[0], curPage);
      setUCCInfo(ucci);
      setUserUCCInfo(useri);
    } catch (error) {
      console.error(error);
    }

  };

  const buyWithUSDT = async (amount: string) => {
    try {
      // Approve USDT
      const account = getAccount(config)
      const _userAddress = account.address || "";
      

      setStatus(PurchaseStatus.APPROVING);
      const parsedAmount = parseEther(amount);
      const urlParams = new URLSearchParams(window.location.search);
      const ref = parseInt(urlParams.get('ref') || '0') || 0;
      const approveTx = await writeContract(config, {
        abi: ERC20_ABI,
        address: ADDRESSES.USDT,
        functionName: 'approve',
        args: [
          ADDRESSES.PRESALE,
          parsedAmount,
        ],
      })

      const approveTxTransactionReceipt = waitForTransactionReceipt(config, {
        hash: approveTx,
      })
      approveTxTransactionReceipt.then(() => {
        setStatus(PurchaseStatus.APPROVED);
      })
      setStatus(PurchaseStatus.PURCHASING);

      // Buy tokens
      
      // const buyTx = await ps.buy(
      //   _userAddress,
      //   ref, // ref
      //   parsedAmount
      // );
      const buyTx = await writeContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'buy',
        args: [
          _userAddress,
          ref, // ref
          parsedAmount
        ],
        // value: parsedAmount
      })

      const buyTxTransactionReceipt = waitForTransactionReceipt(config, {
        hash: buyTx,
      })
      
      // Fetch and update only the necessary data
      const ucci = await getUCCInfo();
      const useri = await getUserInfo( _userAddress, 1);
      buyTxTransactionReceipt.then(() => {
        setUCCInfo(ucci);
        setUserUCCInfo(useri);
  
        setStatus(PurchaseStatus.CONFIRMED);
        toast.success(
          "Purchase completed successfully!",
          {
            duration: 3000,
            position: "top-right",
          }
        );
        setStatus(PurchaseStatus.IDLE);
      })


    } catch (error: any) {
      console.log(error.reason);
      setStatus(PurchaseStatus.ERROR);
      toast.error(
        error.reason,
        {
          duration: 3000,
          position: "top-right",
        }
      );
    }
  };

  const buyWithBNB = async (amount: string) => {
    try {

      const account = getAccount(config)
      const _userAddress = account.address || "";


      setStatus(PurchaseStatus.PURCHASING);
      const parsedAmount = parseEther(amount);
      console.log(parsedAmount);
      const urlParams = new URLSearchParams(window.location.search);
      const ref = parseInt(urlParams.get('ref') || '0') || 0;
      const buyTx = await writeContract(config, {
        abi:PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'buy',
        args: [
          _userAddress,
          ref, // ref
          0,
        ],
        // value: parsedAmount
      })
     
      // Fetch and update only the necessary data
      const ucci = await getUCCInfo();
      const useri = await getUserInfo( _userAddress, 1);

      const buyTxTransactionReceipt = waitForTransactionReceipt(config, {
        hash: buyTx,
      })
      buyTxTransactionReceipt.then(() => {
        setUCCInfo(ucci);
        setUserUCCInfo(useri);
        setStatus(PurchaseStatus.CONFIRMED);
        toast.success(
          "Purchase completed successfully!",
          {
            duration: 3000,
            position: "top-right",
          }
        );
        setStatus(PurchaseStatus.IDLE);
      })


    } catch (error: any) {
      console.log(error.reason);
      setStatus(PurchaseStatus.ERROR);
      toast.error(
        error.reason,
        {
          duration: 3000,
          position: "top-right",
        }
      );
    }
  };

  async function getUCCInfo(): Promise<UCCInfo> {
    try {
      const totalInvestmentsUSDT= await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'totalInvestmentsUSDT',
      })
      const totalInvestmentsBNB= await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'totalInvestmentsBNB',
      })
      const totalUsers: any = await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'totalUsers',
      })
      const priceUSDT= await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'price',
      })
      const priceBNB= await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'priceBNB',
      })
      const totalTokensToBEDistributed= await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'totalTokensToBEDistributed',
      })
  

      setTotalToken(b2i(totalTokensToBEDistributed));

      return {
        totalInvestmentsUSDT: b2i(totalInvestmentsUSDT),
        totalInvestmentsBNB: b2f(totalInvestmentsBNB),
        totalUsers,
        priceUSDT: b2f(priceUSDT),
        priceBNB: b2f(priceBNB),
        totalTokensToBEDistributed: b2i(totalTokensToBEDistributed)
      }

    } catch (error: any) {
      console.error(error);
      return {
        totalInvestmentsUSDT: 0, totalInvestmentsBNB: 0, totalUsers: 0, priceUSDT: 0, priceBNB: 0, totalTokensToBEDistributed: 0
      };
    }
  }

  async function getUserInfo( ua: string, cpage: number): Promise<UserUCCInfo> {
    try {

      const userId:any = await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'id',
        args: [ua]
      })
      const usersInfo = await readContract(config, {
        abi: PRESALE_ABI,
        address: ADDRESSES.PRESALE,
        functionName: 'usersInfo',
        args: [userId]
      })
      let activityLength: any = 0;
      let recentActivities: any = [];
      try {
        if (parseInt(userId?.toString()) == 0) {
          recentActivities = [];
          activityLength = 0;
        } else {
          activityLength = await readContract(config, {
            abi: PRESALE_ABI,
            address: ADDRESSES.PRESALE,
            functionName: 'getUserActivitiesLength',
            args: [userId]
          })
          recentActivities = await readContract(config, {
            abi: PRESALE_ABI,
            address: ADDRESSES.PRESALE,
            functionName: 'getRecentActivities',
            args: [userId, cpage]
          })
          // console.log(recentActivities);
        }
      } catch (error) {
        recentActivities = [];
        activityLength = 0;
      }


      return {
        userId: (userId),
        usersInfo: userId == 0 ? null : usersInfo,
        recentActivities, activityLength: parseInt(activityLength.toString())
      }

    } catch (error: any) {
      console.error(error);
      return {
        userId: 0, usersInfo: null, recentActivities: [], activityLength: 0
      }
    }
  }

  const resetStatus = () => setStatus(PurchaseStatus.IDLE);

  return {
    status,
    uccInfo,
    userUCCInfo,
    userAddress,
    totalTokens,
    curPage,
    setCurPage,
    buyWithUSDT,
    buyWithBNB,
    resetStatus,
    initWallet
  };
}

export function b2i(amt: any): number {
  return parseInt(formatUnits(amt, 18));
}

export function b2f(amt: any): number {
  return parseFloat(formatUnits(amt, 18));
}