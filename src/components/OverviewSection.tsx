import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckSquare, Clock, TrendingUp, TrendingDown } from "lucide-react";

const OverviewSection = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Unread Messages */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal" />
                <span>Unread</span>
              </div>
              <span className="text-2xl font-bold text-foreground">24</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Messages waiting for review</p>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple" />
                <span>Tasks</span>
              </div>
              <span className="text-2xl font-bold text-foreground">12</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Active tasks in progress</p>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange" />
                <span>Avg Response Time</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-green" />
                <span className="text-2xl font-bold text-foreground">2.4h</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-green">↓ 15min faster than last week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewSection;