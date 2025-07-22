import {
  BarChart2Icon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardListIcon,
  DollarSignIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  UsersIcon,
  SettingsIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  type: 'platform' | 'tenant';
  subdomain?: string;
  userRole?: string;
}

export function Sidebar({ type, subdomain, userRole }: SidebarProps) {
  const [location] = useLocation();

  // Platform navigation items
  const platformNavItems = [
    {
      icon: <LayoutDashboardIcon className="w-6 h-6" />,
      label: "Dashboard",
      path: "/platform/dashboard",
    },
    {
      icon: <UsersIcon className="w-6 h-6" />,
      label: "Tenants",
      path: "/platform/tenants",
    },
    {
      icon: <BarChart2Icon className="w-6 h-6" />,
      label: "Analytics",
      path: "/platform/analytics",
    },
    {
      icon: <SettingsIcon className="w-6 h-6" />,
      label: "Settings",
      path: "/platform/settings",
    },
  ];

  // Tenant navigation items based on role
  const getTenantNavItems = () => {
    const baseItems = [
      {
        icon: <LayoutDashboardIcon className="w-5 h-5" />,
        label: "Dashboard",
        path: `/tenant/${subdomain}/dashboard`,
      },
      {
        icon: <CalendarIcon className="w-5 h-5" />,
        label: "Timesheet",
        path: `/tenant/${subdomain}/timesheet`,
      },
      {
        icon: <UsersIcon className="w-5 h-5" />,
        label: "Resources",
        path: `/tenant/${subdomain}/resources`,
      },
      {
        icon: <FolderOpenIcon className="w-5 h-5" />,
        label: "Projects",
        path: `/tenant/${subdomain}/projects`,
      },
      {
        icon: <UsersIcon className="w-5 h-5" />,
        label: "Customers",
        path: `/tenant/${subdomain}/customers`,
      },
      {
        icon: <BarChart2Icon className="w-5 h-5" />,
        label: "Reports",
        path: `/tenant/${subdomain}/reports`,
      },
      {
        icon: <ClipboardListIcon className="w-5 h-5" />,
        label: "Audit Logs",
        path: `/tenant/${subdomain}/audit`,
      },
      {
        icon: <DollarSignIcon className="w-5 h-5" />,
        label: "Expenses",
        path: `/tenant/${subdomain}/expenses`,
      },
      {
        icon: <SettingsIcon className="w-5 h-5" />,
        label: "Settings",
        path: `/tenant/${subdomain}/settings`,
      },
    ];

    // Add manager/admin only items
    if (userRole === 'admin' || userRole === 'manager') {
      baseItems.push(
        {
          icon: <BarChart2Icon className="w-6 h-6" />,
          label: "Reports",
          path: `/tenant/${subdomain}/reports`,
        },
        {
          icon: <ClipboardListIcon className="w-6 h-6" />,
          label: "Audit Logs",
          path: `/tenant/${subdomain}/audit`,
        }
      );
    }

    // Add admin only items
    if (userRole === 'admin') {
      baseItems.push({
        icon: <BookOpenIcon className="w-6 h-6" />,
        label: "User Management",
        path: `/tenant/${subdomain}/users`,
      });
    }

    return baseItems;
  };

  const navItems = type === 'platform' ? platformNavItems : getTenantNavItems();



  return (
    <div className="fixed left-0 top-0 h-screen w-[114px] z-10 bg-gradient-to-b from-[#787dbd] to-[#f17f85]">
      <div className="relative w-full h-full">
        {/* Company Domain Initial - Above Navigation */}
        <div className="flex justify-center mt-6 mb-4">
          <div className="w-[48px] h-[48px] bg-white/20 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-2xl">
              {type === 'platform' ? 'P' : (subdomain ? subdomain.charAt(0).toUpperCase() : 'L')}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-4 px-3">
          {navItems.map((item, index) => (
            <Link key={index} href={item.path}>
              <div
                className={`flex flex-col items-center w-full cursor-pointer hover:opacity-90 transition-opacity py-3 px-2 relative ${
                  location === item.path ? "bg-white/15 rounded-lg" : ""
                }`}
              >
                <div className="w-[32px] h-[32px] flex items-center justify-center mb-1">
                  <div className={location === item.path ? "text-white" : "text-white/75"}>
                    {item.icon}
                  </div>
                </div>
                <span className={`font-medium text-xs text-center leading-tight px-1 ${
                  location === item.path ? "text-white" : "text-white/75"
                }`}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </nav>


      </div>
    </div>
  );
}