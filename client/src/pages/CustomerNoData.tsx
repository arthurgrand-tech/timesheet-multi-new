import {
  BarChart2Icon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  DollarSignIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const CustomerNoData = (): JSX.Element => {
  // Navigation menu items data
  const navItems = [
    {
      icon: <LayoutDashboardIcon className="w-6 h-6" />,
      label: "Dashboard",
      path: "#",
    },
    {
      icon: <CalendarIcon className="w-6 h-6" />,
      label: "Timesheet",
      path: "#",
    },
    {
      icon: <BookOpenIcon className="w-6 h-6" />,
      label: "Resource",
      path: "#",
    },
    {
      icon: <FolderOpenIcon className="w-6 h-6" />,
      label: "Projects",
      path: "#",
    },
    {
      icon: <UsersIcon className="w-6 h-6 text-white" />,
      label: "Customers",
      path: "#",
      active: true,
    },
    {
      icon: <BarChart2Icon className="w-6 h-6" />,
      label: "Reports",
      path: "#",
    },
    {
      icon: <ClipboardListIcon className="w-6 h-6" />,
      label: "Audit Logs",
      path: "#",
    },
    {
      icon: <DollarSignIcon className="w-6 h-6" />,
      label: "Expenses",
      path: "#",
    },
  ];

  // Table headers data
  const tableHeaders = [
    "Customer ID",
    "Customer Name",
    "Email ID",
    "Status",
    "Address",
    "City",
    "State",
    "Pincode",
    "Actions",
  ];

  // Customer data
  const customerData = [
    {
      id: "HC092458942",
      name: "Oliver John",
      email: "oliver@gmail.com",
      status: "Active",
      address: "Stony Meadows",
      city: "America",
      state: "America",
      pincode: "10001",
    },
  ];

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-full h-screen relative">
        {/* Sidebar Navigation */}
        <aside className="fixed left-0 top-0 h-full w-[116px] z-10">
          <div className="relative w-[114px] h-full bg-[#787dbd] rounded-[0px_50px_50px_0px]">
            <div className="absolute top-[42px] left-[38px] font-extrabold text-white text-[55px]">
              L
            </div>

            {/* Navigation Items */}
            <nav className="mt-[120px] flex flex-col items-center gap-8">
              {navItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center w-full ${item.active ? "relative" : ""}`}
                >
                  {item.active && (
                    <div className="absolute left-0 w-0.5 h-[57px] bg-white" />
                  )}
                  <div className="w-[30px] h-[30px] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="mt-1 font-medium text-white text-base">
                    {item.label}
                  </span>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-[116px] p-6">
          {/* Header */}
          <header className="flex items-center mb-12">
            <UsersIcon className="w-[30px] h-[18px] mr-2" />
            <h1 className="font-medium text-3xl">Customers</h1>
          </header>

          {/* Success Alert */}
          <Alert className="absolute top-5 right-5 w-[332px] h-[90px] bg-[#2d6b59] rounded-[25px] border-none">
            <div className="absolute w-[42px] h-[42px] top-[22px] left-7 bg-[#4e8d7c] rounded-[21px] flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <AlertDescription className="ml-16 mt-5 text-white text-lg">
              Success, New entry created successfully
            </AlertDescription>
          </Alert>

          {/* Create Button */}
          <Button className="absolute top-[92px] right-[204px] w-[126px] h-[59px] bg-[#696fb3] rounded-[10px] hover:bg-[#5a5fa3]">
            <PlusIcon className="w-3.5 h-3.5 mr-2" />
            <span className="font-medium text-lg">Create</span>
          </Button>

          {/* Customer Table */}
          <Card className="mt-8 border-none shadow-none">
            <div className="w-full rounded-t-[10px] bg-gradient-to-r from-[#787dbd] to-[#f17f85] p-6">
              <div className="flex justify-between items-center">
                <div className="invisible">Placeholder</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {/* Dropdown menu items would go here */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-gradient-to-r from-[#787dbd] to-[#f17f85]">
                <TableRow>
                  {tableHeaders.map((header, index) => (
                    <TableHead
                      key={index}
                      className="text-white font-medium text-lg"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerData.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-normal text-lg">
                      {customer.id}
                    </TableCell>
                    <TableCell className="font-normal text-lg">
                      {customer.name}
                    </TableCell>
                    <TableCell className="font-normal text-lg">
                      <a
                        href={`mailto:${customer.email}`}
                        className="underline"
                      >
                        {customer.email}
                      </a>
                    </TableCell>
                    <TableCell className="font-normal text-lg text-[#1e8c5a]">
                      {customer.status}
                    </TableCell>
                    <TableCell className="font-normal text-lg">
                      {customer.address}
                    </TableCell>
                    <TableCell className="font-normal text-lg">
                      {customer.city}
                    </TableCell>
                    <TableCell className="font-normal text-lg">
                      {customer.state}
                    </TableCell>
                    <TableCell className="font-normal text-lg">
                      {customer.pincode}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-[45px] w-[137px] rounded-[10px]"
                          >
                            <MenuIcon className="w-3.5 h-4 mr-2" />
                            Actions
                            <ChevronDownIcon className="w-[9px] h-[5px] ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {/* Dropdown menu items would go here */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </main>
      </div>
    </div>
  );
};
