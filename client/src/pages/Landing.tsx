import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, BarChart3, CheckCircle } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    company: "",
    location: "",
    employeeCount: "",
    source: "",
    additionalInfo: ""
  });

  const submitDemoRequest = useMutation({
    mutationFn: async (data: any) => {
      // For demo purposes - in real app this would go to your backend
      console.log('Demo request:', data);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your demo request has been submitted. We'll contact you soon!",
      });
      // Reset form
      setFormData({
        name: "",
        mobileNumber: "",
        email: "",
        company: "",
        location: "",
        employeeCount: "",
        source: "",
        additionalInfo: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit demo request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        title: "Required fields missing",
        description: "Please fill in Name, Email, and Company fields.",
        variant: "destructive",
      });
      return;
    }
    submitDemoRequest.mutate(formData);
  };

  const features = [
    {
      icon: <Clock className="w-6 h-6 text-green-600" />,
      title: "Seamless Time Tracking",
      description: "Effortlessly log and manage work hours with an intuitive interface designed for accuracy and ease. Whether on desktop or mobile, track time & overtime or input paid hours with just a few clicks."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      title: "Detailed Analytics",
      description: "Gain actionable insights with comprehensive reports and dashboards. Monitor team performance, track project progress, and analyze time utilization—all in one place, with data visualizations that simplify decision-making."
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-yellow-600" />,
      title: "Compliance Guaranteed",
      description: "Ensure your timesheets meet industry standards and regulatory requirements effortlessly. Our platform is designed to align with compliance protocols, reducing risks and ensuring audit-readiness."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">LOGO HERE</div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">Login</button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <a href="/platform/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Platform Admin</a>
                  <a href="/tenant/demo/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Demo Company</a>
                  <a href="/tenant-login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Other Tenant</a>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/platform/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Request Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Request a Demo Today</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
          Discover how our smartseal solution simplifies workforce management, enhances productivity, and ensures compliance with ease.
        </p>

        <div className="grid lg:grid-cols-2 gap-12 items-start mt-16">
          {/* Features Section */}
          <div className="text-left">
            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">DISCOVER OUR EDGE</p>
              <h2 className="text-3xl font-bold text-gray-900">What's Included in Our Demo?</h2>
            </div>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Request Form */}
          <Card className="bg-white shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <Input
                      placeholder="Enter Your Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <Input
                      placeholder="Enter Your Mobile Number"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter Your Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <Input
                      placeholder="Your Company Name"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input
                      placeholder="Location | Optional"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employees in count</label>
                    <Input
                      placeholder="No. of employees | Optional"
                      value={formData.employeeCount}
                      onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <Input
                    placeholder="How did you find us? | Optional"
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                  <Textarea
                    placeholder="Some Comments About | Optional"
                    rows={4}
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitDemoRequest.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-lg"
                >
                  {submitDemoRequest.isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}