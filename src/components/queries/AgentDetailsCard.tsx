
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Agent } from "@/types/agent";
import { useAgentData } from "@/hooks/useAgentData";

interface AgentDetailsCardProps {
  agentId: number;
  agentName: string;
}

export const AgentDetailsCard: React.FC<AgentDetailsCardProps> = ({
  agentId,
  agentName,
}) => {
  const { getAgentById } = useAgentData();
  const agent = getAgentById(agentId);

  if (!agent) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Agent not found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Agent ID: {agentId} - {agentName}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "company" ? (
      <Building className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getTypeIcon(agent.type)}
            Agent Details
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/management/agents/${agent.id}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              View Profile
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {agent.profileImage ? (
                <img
                  src={agent.profileImage}
                  alt={agent.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {agent.type}
                </p>
              </div>
            </div>
            {getStatusBadge(agent.status)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{agent.contact.email}</span>
            </div>
            
            {agent.contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{agent.contact.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{agent.city}, {agent.country}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(agent.joinDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="pt-3 border-t">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Overview
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Queries</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {agent.stats.totalQueries}
              </p>
            </div>
            
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-green-800">Bookings</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {agent.stats.totalBookings}
              </p>
            </div>
            
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-800">Conv. Rate</span>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {agent.stats.conversionRate}%
              </p>
            </div>
            
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-800">Revenue</span>
              </div>
              <p className="text-sm font-bold text-amber-600">
                ${(agent.stats.revenueGenerated / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="pt-3 border-t">
          <h4 className="font-medium mb-2">Commission Structure</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline" className="capitalize">
              {agent.commissionType}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">
              {agent.commissionValue}
              {agent.commissionType === "percentage" ? "%" : ""}
            </span>
          </div>
        </div>

        {/* Staff Assignments */}
        {agent.staffAssignments && agent.staffAssignments.length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="font-medium mb-2">Staff Assignments</h4>
            <div className="space-y-1">
              {agent.staffAssignments.slice(0, 2).map((assignment, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{assignment.staffName}</span>
                  <Badge variant="outline" className="text-xs">
                    {assignment.role}
                  </Badge>
                </div>
              ))}
              {agent.staffAssignments.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{agent.staffAssignments.length - 2} more staff members
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
