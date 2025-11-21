// src/ui/styles.ts

// ---------- Page backgrounds ----------
export const authPageBg =
  "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4";

export const onboardingPageBg =
  "min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-white flex items-center justify-center p-4 sm:p-6";

export const dashboardPageBg =
  "min-h-screen bg-gradient-to-br from-[#050816] via-[#020617] to-[#000000]";

// ---------- Cards ----------
export const authCard =
  "w-full max-w-md bg-gradient-to-br from-[hsl(220,20%,8%)] to-[hsl(220,20%,5%)] " +
  "border border-white/10 rounded-[28px] shadow-[0_0_80px_-12px_rgba(168,85,247,0.5),0_20px_60px_-8px_rgba(0,0,0,0.4)] " +
  "backdrop-blur-xl";

export const onboardingCard =
  "bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 space-y-6";

export const connectedPlatformsCard =
  "mt-6 rounded-3xl bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-3";

export const dashboardCard =
  "bg-gradient-to-br from-[rgba(15,23,42,0.95)] to-[rgba(15,23,42,0.9)] " +
  "border border-purple-500/20 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] " +
  "backdrop-blur-2xl p-5 sm:p-6";

// Info cards
export const greenInfoCard =
  "bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200";

export const lightInfoCardPurple =
  "rounded-3xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4";

// ---------- Form elements ----------
export const primaryInput =
  "h-12 bg-white border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-xl " +
  "text-gray-900 placeholder:text-gray-400 font-medium focus-visible:ring-2 focus-visible:ring-purple-500";

export const subtleLabel =
  "text-sm font-medium text-gray-700";

// ---------- Buttons ----------
export const primaryGradientButton =
  "w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#A855F7] " +
  "hover:from-[#2563EB] hover:to-[#9333EA] text-white font-semibold rounded-xl " +
  "shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30";

export const secondaryOutlineButton =
  "px-6 h-12 rounded-xl border border-gray-300 text-gray-700 " +
  "bg-white hover:bg-gray-50 font-medium transition";

export const whiteSurfaceButton =
  "w-full h-12 bg-white hover:bg-gray-50 border-0 rounded-xl text-gray-900 font-semibold " +
  "shadow-md transition-all flex items-center justify-center";

export const pillTag =
  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium " +
  "bg-green-100 text-green-700";

// ---------- Typography ----------
export const sectionTitle =
  "text-2xl font-bold text-gray-900";

export const sectionSubtitle =
  "text-base text-gray-600";

export const onboardingStepLabel =
  "text-sm font-medium text-gray-500 text-center";

// ---------- Progress ----------
export const progressTrack =
  "h-2 w-full rounded-full bg-gray-200";

export const progressFill =
  "h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500";

// ---------- Animation tokens ----------
export const cardHover =
  "transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-2xl";

export const fadeInUp =
  "animate-[fadeInUp_0.45s_ease-out]";

export const buttonTap =
  "active:scale-[0.98] transition-transform duration-75";

/**
 * Add this keyframe in your global CSS (e.g. index.css or globals.css):
 *
 * @layer utilities {
 *   @keyframes fadeInUp {
 *     from { opacity: 0; transform: translateY(10px); }
 *     to   { opacity: 1; transform: translateY(0); }
 *   }
 * }
 */
