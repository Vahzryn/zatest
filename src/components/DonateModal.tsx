import React from 'react';
import { X, Heart, ShieldCheck, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  { 
    id: 'support_5', 
    emoji: '☕', 
    amount: '$5',
    description: 'Buy me a coffee',
    type: 'One-time support',
    url: 'https://whop.com/checkout/plan_iZf2yCdTauBIu', 
    highlight: false 
  },
  { 
    id: 'support_10', 
    emoji: '🍵', 
    amount: '$10',
    description: 'Support the project',
    type: 'One-time support',
    url: 'https://whop.com/checkout/plan_prBXyumFgOn8i', 
    highlight: false 
  },
  { 
    id: 'support_25', 
    emoji: '🚀', 
    amount: '$25',
    description: 'Help Zapixal grow',
    type: 'One-time support',
    url: 'https://whop.com/checkout/plan_RDcCBXgVQA2XL', 
    highlight: false 
  },
  { 
    id: 'ongoing_support', 
    emoji: '❤️', 
    amount: '$5/month',
    description: 'Become a monthly supporter',
    type: 'Ongoing support',
    url: 'https://whop.com/checkout/plan_tqFV2pzrukQVs', 
    highlight: true 
  },
];

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg mx-2 p-5 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>
        
        <div className="flex flex-col items-center text-center mt-1 mb-5 sm:mb-8">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mb-3 bg-pink-50 dark:bg-[#3c2a2f] text-pink-500 dark:text-[#f28b82] rounded-full">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-200 mb-1.5 sm:mb-3 tracking-tight">Support Zapixal</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-md text-xs sm:text-base leading-relaxed">
            Zapixal is free, private, and runs entirely in your browser. Donations are completely optional and help support ongoing development and updates!
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:gap-4 w-full mb-5 sm:mb-8">
          {plans.map((plan) => (
            <a 
              key={plan.id}
              href={plan.url} 
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all active:scale-[0.98]",
                plan.highlight 
                  ? "border-pink-300 dark:border-[#5c3a42] bg-pink-50/50 dark:bg-[#3c2a2f]/60 hover:bg-pink-50 dark:hover:bg-[#3c2a2f] shadow-sm" 
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-[#303134] shadow-sm"
              )}
            >
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">{plan.emoji}</span>
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-200 text-base sm:text-lg leading-tight">
                      {plan.amount}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-400">
                      ({plan.type})
                    </span>
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-semibold truncate w-full mt-0.5">
                    {plan.description}
                  </span>
                </div>
              </div>
              
              <button 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors shrink-0",
                  plan.highlight
                    ? "bg-pink-600 text-white dark:bg-[#f28b82] dark:text-[#202124] hover:bg-pink-700 shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-800"
                )}
              >
                Support <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </a>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-400 pb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure checkout provided by Whop</span>
        </div>
      </div>
    </div>
  );
}
