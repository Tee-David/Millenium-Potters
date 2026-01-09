"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, FileType, Folder, Activity, Shield } from "lucide-react";
import Link from "next/link";

export default function SystemConfigurationPage() {
  const configurationItems = [
    {
      title: "Loan Types",
      description: "Manage loan product types, interest rates, and terms",
      href: "/dashboard/system-configuration/loan-type",
      icon: FileType,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Document Types",
      description: "Configure required documents for loans and customers",
      href: "/dashboard/system-configuration/document-type",
      icon: Folder,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Audit Logs",
      description: "View system activity and user actions",
      href: "/dashboard/system-configuration/audit-logs",
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          System Configuration
        </h1>
        <p className="text-muted-foreground">
          Manage system settings, configurations, and administrative tools.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {configurationItems.map((item) => (
          <Card key={item.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div
                className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-3`}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full">
                <Link href={item.href}>Configure</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Overview of system configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Configuration Status</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Loan Types:</span>
                  <span className="text-green-600">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span>Document Types:</span>
                  <span className="text-green-600">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span>User Roles:</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Logging:</span>
                  <span className="text-green-600">Enabled</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">System Health</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="text-green-600">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>API Status:</span>
                  <span className="text-green-600">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span>File Storage:</span>
                  <span className="text-green-600">Available</span>
                </div>
                <div className="flex justify-between">
                  <span>Backup Status:</span>
                  <span className="text-green-600">Up to date</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
