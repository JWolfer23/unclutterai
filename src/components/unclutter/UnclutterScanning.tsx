import { Loader2 } from "lucide-react";

const UnclutterScanning = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      {/* Pulsing loader */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      </div>
      
      {/* Text */}
      <p className="text-white/60 text-lg">
        Scanning your inbox...
      </p>
    </div>
  );
};

export default UnclutterScanning;
