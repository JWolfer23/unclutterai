// src/ui/styles.ts

export const glassCard = `
  bg-[#0B0B0D]/90 
  backdrop-blur-2xl 
  border border-white/10 
  rounded-[28px]
  shadow-[0_20px_80px_rgba(0,0,0,0.65)]
`;

export const lightCard = `
  bg-white 
  rounded-[28px]
  shadow-[0_8px_30px_rgba(0,0,0,0.08)]
  border border-gray-200/50
`;

export const primaryGradientButton = `
  inline-flex items-center justify-center
  h-12 w-full
  rounded-xl font-semibold text-white
  bg-gradient-to-r from-[#3B82F6] to-[#A855F7]
  shadow-[0_12px_35px_rgba(139,92,246,0.35)]
  hover:shadow-[0_15px_45px_rgba(139,92,246,0.55)]
  transition-all duration-200
`;

export const secondaryButton = `
  inline-flex items-center justify-center
  h-12 px-6 rounded-xl
  bg-white text-gray-900 border border-gray-200
  shadow-sm hover:bg-gray-50
  transition-all
`;

export const pillTag = `
  inline-flex items-center gap-2 px-4 py-1.5
  rounded-full text-sm font-medium
  bg-green-100 text-green-700
`;

export const progressBarPurple = `
  h-2 rounded-full
  bg-purple-400
`;

export const inputField = `
  h-12 w-full rounded-xl
  bg-white text-gray-900 
  placeholder:text-gray-400
  shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]
  border-0 font-medium
`;
