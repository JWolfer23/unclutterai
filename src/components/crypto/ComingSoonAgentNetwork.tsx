import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Vote, Zap, Users, Rocket, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ComingSoonAgentNetwork = () => {
  const features = [
    {
      title: "Stake UCT to Launch AI Agents",
      description: "Deploy your own specialized AI assistants for different tasks",
      icon: Bot,
      requiredUCT: 1000,
      color: "bg-blue-500",
    },
    {
      title: "Earn from Agent Usage",
      description: "Get paid when others use your AI agents",
      icon: Zap,
      requiredUCT: 500,
      color: "bg-green-500",
    },
    {
      title: "DAO Governance Voting",
      description: "Vote on new features and protocol upgrades",
      icon: Vote,
      requiredUCT: 100,
      color: "bg-purple-500",
    },
    {
      title: "Agent Collaboration",
      description: "Let your agents work together to solve complex tasks",
      icon: Users,
      requiredUCT: 2000,
      color: "bg-orange-500",
    },
  ];

  const roadmapItems = [
    { phase: "Q2 2024", title: "Basic Agent Staking", status: "coming-soon" },
    { phase: "Q3 2024", title: "Agent Marketplace", status: "planned" },
    { phase: "Q4 2024", title: "DAO Governance Launch", status: "planned" },
    { phase: "Q1 2025", title: "Cross-Agent Communication", status: "planned" },
  ];

  const handleNotifyMe = () => {
    toast({
      title: "You're on the list!",
      description: "We'll notify you when the Agent Network launches",
    });
  };

  const handleJoinDAO = () => {
    toast({
      title: "DAO Coming Soon!",
      description: "Governance features will be available with the agent network",
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="animate-fade-in bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-purple-600" />
            Agent Network
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Coming Soon
            </Badge>
          </CardTitle>
          <CardDescription className="text-lg">
            Get ready to build your army of bots and revolutionize productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-6xl">🤖🚀</div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The future of AI is decentralized. Soon, you'll be able to stake UCT tokens to launch your own AI agents, 
            earn from their usage, and participate in governing the UnclutterAI ecosystem.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 max-w-md mx-auto">
            <Button onClick={handleNotifyMe} className="bg-purple-600 hover:bg-purple-700">
              <Bell className="h-4 w-4 mr-2" />
              Notify Me
            </Button>
            <Button variant="outline" onClick={handleJoinDAO}>
              <Vote className="h-4 w-4 mr-2" />
              Join DAO Waitlist
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Features */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-blue-500" />
            Upcoming Features
          </CardTitle>
          <CardDescription>
            What you'll be able to do with the Agent Network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${feature.color} bg-opacity-20`}>
                    <feature.icon className="h-5 w-5" style={{ color: feature.color.replace('bg-', '').replace('-500', '') }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{feature.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{feature.description}</div>
                    <Badge variant="outline" className="mt-2">
                      Requires {feature.requiredUCT} UCT
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Development Roadmap</CardTitle>
          <CardDescription>When to expect these game-changing features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roadmapItems.map((item, index) => (
              <div key={item.phase} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  item.status === 'coming-soon' 
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant={item.status === 'coming-soon' ? 'default' : 'secondary'}>
                      {item.status === 'coming-soon' ? 'Next' : 'Planned'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{item.phase}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Early Access */}
      <Card className="animate-fade-in border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Zap className="h-6 w-6" />
            Early Access Benefits
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Get exclusive perks by being an early UnclutterAI user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div>
                <div className="font-medium text-yellow-800">50% Staking Discount</div>
                <div className="text-sm text-yellow-700">Launch agents for half the required UCT</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div>
                <div className="font-medium text-yellow-800">Exclusive Agent Templates</div>
                <div className="text-sm text-yellow-700">Access to premium agent configurations</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div>
                <div className="font-medium text-yellow-800">DAO Founding Member Status</div>
                <div className="text-sm text-yellow-700">Enhanced voting power in governance decisions</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoonAgentNetwork;