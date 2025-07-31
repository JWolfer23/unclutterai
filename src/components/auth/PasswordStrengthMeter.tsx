import { getPasswordStrength } from "@/lib/security";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export const PasswordStrengthMeter = ({ password, className }: PasswordStrengthMeterProps) => {
  if (!password) return null;

  const { score, feedback } = getPasswordStrength(password);
  
  const getStrengthLabel = (score: number) => {
    if (score < 25) return { label: "Very Weak", color: "hsl(var(--destructive))" };
    if (score < 50) return { label: "Weak", color: "hsl(var(--warning))" };
    if (score < 75) return { label: "Good", color: "hsl(var(--secondary))" };
    if (score < 90) return { label: "Strong", color: "hsl(var(--success))" };
    return { label: "Very Strong", color: "hsl(var(--success))" };
  };

  const strength = getStrengthLabel(score);
  const isStrong = score >= 75;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password Strength</span>
          <span 
            className="font-medium"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
        <Progress 
          value={score} 
          className="h-2"
        />
      </div>
      
      {feedback.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Suggestions:</span>
          </div>
          <ul className="space-y-1">
            {feedback.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isStrong && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle className="w-4 h-4" />
          <span>Password meets security requirements</span>
        </div>
      )}
    </div>
  );
};