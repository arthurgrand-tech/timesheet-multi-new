import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Shield, Zap } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#787dbd] to-[#f17f85] flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white">
            Multi-Tenant SaaS Platform
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Complete business management solution with customer tracking, project management, 
            timesheets, and expense reporting - all with enterprise-grade multi-tenancy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Users className="w-8 h-8 text-white mb-2" />
              <CardTitle className="text-white">Multi-Tenant Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Complete data isolation with separate databases per tenant. 
                Scalable infrastructure supporting unlimited organizations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Shield className="w-8 h-8 text-white mb-2" />
              <CardTitle className="text-white">Role-Based Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Granular permissions with User, Manager, and Admin roles. 
                Platform-level Super Admin for complete system control.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Zap className="w-8 h-8 text-white mb-2" />
              <CardTitle className="text-white">Complete Business Suite</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Customer management, project tracking, timesheet logging, 
                expense reporting, and comprehensive analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Access Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/platform/login">
            <Button 
              size="lg" 
              className="w-64 h-14 bg-white text-[#787dbd] hover:bg-white/90 font-semibold text-lg"
            >
              <Building className="w-5 h-5 mr-2" />
              Platform Admin Access
            </Button>
          </Link>
          
          <div className="text-white/80 text-sm">or</div>
          
          <Link href="/tenant-login">
            <Button 
              size="lg" 
              variant="outline"
              className="w-64 h-14 bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold text-lg backdrop-blur-sm"
            >
              <Building className="w-5 h-5 mr-2" />
              Access Your Workspace
            </Button>
          </Link>
        </div>

        {/* Demo Access */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-white font-semibold text-lg mb-4">Demo Access</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="text-left">
              <p className="text-white font-medium mb-2">Platform Admin:</p>
              <p className="text-white/80">Email: admin@platform.com</p>
              <p className="text-white/80">Password: admin123</p>
            </div>
            <div className="text-left">
              <p className="text-white font-medium mb-2">Tenant User:</p>
              <p className="text-white/80">Subdomain: demo</p>
              <p className="text-white/80">Email: user@demo.com</p>
              <p className="text-white/80">Password: user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}