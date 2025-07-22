import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft } from "lucide-react";

export default function TenantLoginPage() {
  const [, navigate] = useLocation();
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!subdomain) {
      setError("Please enter your organization subdomain");
      return;
    }
    
    // Redirect to tenant login page
    navigate(`/tenant/${subdomain.toLowerCase().trim()}/login`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#787dbd] to-[#f17f85] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home */}
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#787dbd] to-[#f17f85] rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Your Workspace
            </CardTitle>
            <p className="text-gray-600">
              Enter your organization subdomain to continue
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subdomain" className="text-sm font-medium text-gray-700">
                  Organization Subdomain
                </label>
                <div className="relative">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="your-company"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="pr-20"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    .app.com
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#787dbd] to-[#f17f85] hover:from-[#6a6fb0] hover:to-[#ef727a]"
                size="lg"
              >
                Continue to Login
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Need help accessing your workspace?
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>• Contact your system administrator</p>
                  <p>• Check your organization's welcome email</p>
                  <p>• Try: demo (for demo access)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}