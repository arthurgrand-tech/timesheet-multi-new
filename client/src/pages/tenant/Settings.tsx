import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Sidebar } from "@/components/layout/Sidebar";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTenantAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Crown, 
  Check, 
  X, 
  CreditCard, 
  Users, 
  Building, 
  Mail, 
  Calendar,
  Zap
} from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Up to 5 users",
      "Basic project management", 
      "Simple timesheet tracking",
      "Email support"
    ],
    limitations: [
      "Limited reports",
      "No custom fields",
      "Basic integrations"
    ]
  },
  {
    name: "Standard", 
    price: 15,
    description: "For growing teams",
    features: [
      "Up to 25 users",
      "Advanced project management",
      "Detailed timesheet tracking",
      "Priority email support",
      "Custom fields",
      "Advanced reports",
      "API access"
    ],
    limitations: [
      "Limited integrations"
    ]
  },
  {
    name: "Enterprise",
    price: 5, // As requested by user
    description: "For large organizations", 
    features: [
      "Unlimited users",
      "Full project management suite",
      "Advanced timesheet & expense tracking",
      "24/7 phone & email support",
      "Custom fields & workflows",
      "Advanced analytics & reports",
      "Full API access",
      "SSO integration",
      "Custom integrations"
    ],
    limitations: []
  }
];

export default function Settings() {
  const params = useParams();
  const subdomain = params.subdomain;
  const { isAuthenticated, isLoading, user, tenant } = useTenantAuth(subdomain);
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: subscriptionData, refetch: refetchSubscription } = useQuery({
    queryKey: [`/api/tenant/${subdomain}/subscription`],
    enabled: isAuthenticated && !!subdomain,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", `/api/tenant/${subdomain}/subscription/upgrade`, { plan });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // Redirect to Stripe payment
        setIsUpgrading(true);
        window.location.href = data.url || `/tenant/${subdomain}/payment?client_secret=${data.clientSecret}`;
      } else {
        toast({
          title: "Plan Updated",
          description: "Your subscription plan has been updated successfully.",
        });
        refetchSubscription();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription plan.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tenant/${subdomain}/subscription/cancel`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      refetchSubscription();
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed", 
        description: error.message || "Failed to cancel subscription.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const currentPlan = (tenant as any)?.subscriptionPlan || "free";
  const currentPlanData = plans.find(p => p.name.toLowerCase() === currentPlan);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="tenant" subdomain={subdomain} userRole={user?.role} />
      
      <TenantHeader
        icon={<div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
          <SettingsIcon className="w-4 h-4 text-white" />
        </div>}
        title="Settings"
        description="Manage your organization settings and subscription"
        onCreateClick={() => {}}
        createLabel=""
      />

      <main className="ml-[114px] bg-gray-50 pt-20">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="subscription" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="space-y-6">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Current Plan
                    </CardTitle>
                    <CardDescription>
                      You are currently on the {currentPlanData?.name} plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{currentPlanData?.name}</h3>
                        <p className="text-gray-600">{currentPlanData?.description}</p>
                        <p className="text-lg font-semibold mt-2">
                          ${currentPlanData?.price || 0}/month
                        </p>
                      </div>
                      <Badge variant={currentPlan === "enterprise" ? "default" : "secondary"}>
                        {currentPlan.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.name} 
                      className={`relative ${
                        plan.name.toLowerCase() === currentPlan 
                          ? "ring-2 ring-blue-500 bg-blue-50" 
                          : "hover:shadow-lg transition-shadow"
                      }`}
                    >
                      {plan.name.toLowerCase() === currentPlan && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-500">Current Plan</Badge>
                        </div>
                      )}
                      
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {plan.name}
                          {plan.name === "Enterprise" && (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          )}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="text-3xl font-bold">
                          ${plan.price}
                          <span className="text-lg font-normal text-gray-600">/month</span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                          {plan.limitations.map((limitation, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <X className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-gray-500">{limitation}</span>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {plan.name.toLowerCase() === currentPlan ? (
                          <Button disabled className="w-full">
                            Current Plan
                          </Button>
                        ) : plan.name.toLowerCase() === "free" ? (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => upgradeMutation.mutate("free")}
                            disabled={upgradeMutation.isPending}
                          >
                            Downgrade to Free
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => upgradeMutation.mutate(plan.name.toLowerCase())}
                            disabled={upgradeMutation.isPending}
                          >
                            {upgradeMutation.isPending ? "Upgrading..." : `Upgrade to ${plan.name}`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Cancel Subscription */}
                {currentPlan !== "free" && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-600">Danger Zone</CardTitle>
                      <CardDescription>
                        Cancel your subscription and downgrade to the free plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel your subscription?")) {
                            cancelMutation.mutate();
                          }
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="organization" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input 
                          id="orgName" 
                          defaultValue={(tenant as any)?.name} 
                          readOnly 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subdomain">Subdomain</Label>
                        <Input 
                          id="subdomain" 
                          defaultValue={subdomain} 
                          readOnly 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="userCount">Total Users</Label>
                        <Input 
                          id="userCount" 
                          defaultValue="3" 
                          readOnly 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Input 
                          id="status" 
                          defaultValue={(tenant as any)?.status || "Active"} 
                          readOnly 
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Current Plan</h4>
                          <p className="text-gray-600">{currentPlanData?.name} - ${currentPlanData?.price || 0}/month</p>
                        </div>
                        <Badge variant={currentPlan === "enterprise" ? "default" : "secondary"}>
                          {currentPlan.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {(subscriptionData as any)?.nextBilling && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Next Billing Date</h4>
                            <p className="text-gray-600">
                              {new Date((subscriptionData as any).nextBilling).toLocaleDateString()}
                            </p>
                          </div>
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                      )}

                      {(subscriptionData as any)?.stripeCustomerId && (
                        <Button variant="outline" className="w-full">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Manage Payment Methods
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}