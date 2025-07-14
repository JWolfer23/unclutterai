import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Shield, Coins, Users, Eye, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DataVaultOptIn = () => {
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [dataTypes, setDataTypes] = useState({
    usagePatterns: false,
    productivityMetrics: false,
    emailCategories: false,
    focusInsights: false,
  });

  // Mock data for demonstration
  const potentialEarnings = 150; // UCT per month
  const contributorCount = 12847;
  const privacyScore = 95;

  const handleOptIn = () => {
    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the data sharing terms to continue",
        variant: "destructive",
      });
      return;
    }

    if (!Object.values(dataTypes).some(Boolean)) {
      toast({
        title: "Select Data Types",
        description: "Please select at least one data type to share",
        variant: "destructive",
      });
      return;
    }

    setIsOptedIn(true);
    toast({
      title: "Data Vault Activated!",
      description: "You're now contributing to the UnclutterAI knowledge base and earning UCT tokens",
    });
  };

  const handleOptOut = () => {
    setIsOptedIn(false);
    setDataTypes({
      usagePatterns: false,
      productivityMetrics: false,
      emailCategories: false,
      focusInsights: false,
    });
    toast({
      title: "Opted Out",
      description: "Your data is no longer being shared. You can opt back in anytime.",
    });
  };

  const dataTypeOptions = [
    {
      key: "usagePatterns",
      name: "Usage Patterns",
      description: "How you interact with the app (anonymized)",
      earnings: 25,
      icon: Eye,
    },
    {
      key: "productivityMetrics",
      name: "Productivity Metrics",
      description: "Focus session duration and interruption data",
      earnings: 40,
      icon: Users,
    },
    {
      key: "emailCategories",
      name: "Email Categories",
      description: "Types of emails you receive (no content)",
      earnings: 35,
      icon: Database,
    },
    {
      key: "focusInsights",
      name: "Focus Insights",
      description: "When and how you achieve deep focus",
      earnings: 50,
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-500" />
            Decentralized Data Vault
          </CardTitle>
          <CardDescription>
            Contribute anonymized usage data to improve UnclutterAI for everyone while earning UCT tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-green-600">+{potentialEarnings}</div>
              <div className="text-sm text-muted-foreground">UCT per month</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{contributorCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Active contributors</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{privacyScore}%</div>
              <div className="text-sm text-muted-foreground">Privacy score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Types Selection */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Choose What to Share</CardTitle>
          <CardDescription>
            Select the types of anonymized data you're comfortable sharing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataTypeOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <Checkbox
                  id={option.key}
                  checked={dataTypes[option.key as keyof typeof dataTypes]}
                  onCheckedChange={(checked) => 
                    setDataTypes(prev => ({ ...prev, [option.key]: checked as boolean }))
                  }
                  disabled={isOptedIn}
                />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <option.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                +{option.earnings} UCT/month
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-500" />
            Privacy & Security Guarantees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Zero Personal Information</div>
                <div className="text-sm text-green-700">No emails, names, or personal content is ever shared</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Smart Contract Controlled</div>
                <div className="text-sm text-blue-700">Your data sharing preferences are enforced by code, not humans</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Coins className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-800">Automatic Rewards</div>
                <div className="text-sm text-purple-700">UCT tokens are automatically distributed to your wallet</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          {!isOptedIn ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the data sharing terms and privacy policy
                </label>
              </div>
              
              <Button onClick={handleOptIn} className="w-full" size="lg">
                Activate Data Vault & Start Earning
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-800">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Data Vault Active</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  You're contributing to the UnclutterAI knowledge base and earning tokens
                </div>
              </div>
              
              <Button variant="outline" onClick={handleOptOut}>
                Opt Out of Data Sharing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataVaultOptIn;