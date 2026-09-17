"use client";
import { useMemo } from "react";
import { createTransactionKit, type TransactionKit } from "@genlayer/transaction-kit";
import {
  createClient,
  deriveExternalMessageCallKey,
  encodeExternalMessageFeeParams,
  MESSAGE_ALLOCATION_ROOT_PARENT_INDEX,
  MessageType,
} from "genlayer-js";
import type { MessageFeeAllocationInput, TransactionFeeEstimate } from "genlayer-js/types";
import { GENLAYER_CHAIN } from "./network";
import { provider } from "./client";

const INTERNAL_MESSAGE_METHODS = new Set(["submit_work", "retry_inconclusive"]);
const EXTERNAL_MESSAGE_BUDGET = 120_000_000_000_000n;

function quoteFromEstimate(base:any, estimate:TransactionFeeEstimate, userValue:bigint){
  const d:any=estimate.distribution;
  const rounds=(d.rotations||[]).reduce((sum:bigint,r:bigint)=>sum+BigInt(r)+1n,BigInt(d.appealRounds||0));
  const messageFees=BigInt(d.totalMessageFees||0);
  const executionBudget=BigInt(d.executionBudgetPerRound||0)*rounds;
  const feeValue=BigInt(estimate.feeValue||0);
  const timeUnitFees=feeValue>messageFees+executionBudget?feeValue-messageFees-executionBudget:0n;
  return {
    ...base,
    distribution:d,
    feeValue,
    userValue,
    total:feeValue+userValue,
    source:"developer" as const,
    ...(estimate.policy?.enabled===false?{gasless:true}:{}),
    breakdown:{timeUnitFees,executionBudget,messageFees},
    caps:{
      genPerTimeUnit:BigInt(d.maxPriceGenPerTimeUnit||0),
      storagePrice:BigInt(d.storageFeeMaxGasPrice||0),
      receiptPrice:BigInt(d.receiptFeeMaxGasPrice||0),
    },
    refundable:true as const,
  };
}

function externalAllocations(recipients:string[]):MessageFeeAllocationInput[]{
  const params=encodeExternalMessageFeeParams({gasLimit:500_000,maxGasPrice:300_000_000});
  return recipients.map(recipient=>({
    messageType:MessageType.External,
    onAcceptance:false,
    parentIndex:MESSAGE_ALLOCATION_ROOT_PARENT_INDEX,
    recipient:recipient as `0x${string}`,
    callKey:deriveExternalMessageCallKey(),
    budget:EXTERNAL_MESSAGE_BUDGET,
    feeParams:params,
  }));
}

export function useTransactionKit(address:string|null, externalRecipients:string[]=[]):TransactionKit|null{
  const recipientKey=externalRecipients.map(x=>x.toLowerCase()).join(",");
  return useMemo(()=>{
    const injected=provider();
    if(!injected||!address)return null;

    const base=createTransactionKit({
      chain:GENLAYER_CHAIN,
      provider:injected,
      account:address as `0x${string}`,
    } as never);
    const client=createClient({
      chain:GENLAYER_CHAIN,
      provider:injected,
      account:address as `0x${string}`,
    } as never) as any;
    const allocationsByQuote=new WeakMap<object,MessageFeeAllocationInput[]>();
    const recipients=recipientKey?recipientKey.split(","):[];

    const estimate:TransactionKit["estimate"]=async(input,tx)=>{
      const baseQuote=await base.estimate(input,tx);
      if(!tx||tx.kind!=="write")return baseQuote;
      const userValue=input.userValue??0n;

      if(recipients.length){
        const allocations=externalAllocations(recipients);
        const recommended=await client.estimateTransactionFees({
          leaderTimeunitsAllocation:100,
          validatorTimeunitsAllocation:200,
          rotations:[3],
          totalMessageFees:EXTERNAL_MESSAGE_BUDGET*BigInt(allocations.length),
          messageAllocations:allocations,
        });
        const quote=quoteFromEstimate(baseQuote,recommended,userValue);
        allocationsByQuote.set(quote,allocations);
        return quote;
      }

      if(INTERNAL_MESSAGE_METHODS.has(tx.method)){
        const recommended=await client.estimateTransactionFeesForWrite({
          address:tx.address,
          functionName:tx.method,
          args:tx.args||[],
          value:userValue,
          executionHeadroomBps:12000,
          messageHeadroomBps:12000,
        });
        const allocations=(recommended.messageAllocations||[]) as MessageFeeAllocationInput[];
        if(!allocations.length)throw new Error(`Fee estimation for ${tx.method} returned no message allocation. Refusing to submit an underfunded child transaction.`);
        const quote=quoteFromEstimate(baseQuote,recommended,userValue);
        allocationsByQuote.set(quote,allocations);
        return quote;
      }

      return baseQuote;
    };

    const submit:TransactionKit["submit"]=async(quote,tx)=>{
      const allocations=allocationsByQuote.get(quote as object);
      if(!allocations||tx.kind!=="write")return base.submit(quote,tx);
      const genlayerTxId=await client.writeContract({
        ...(quote.gasless?{}:{fees:{distribution:quote.distribution,feeValue:quote.feeValue,messageAllocations:allocations}}),
        value:quote.userValue,
        address:tx.address,
        functionName:tx.method,
        args:tx.args||[],
      });
      return {genlayerTxId};
    };

    return {
      estimate,
      submit,
      track:base.track,
      verification:base.verification,
    } as TransactionKit;
  },[address,recipientKey]);
}
