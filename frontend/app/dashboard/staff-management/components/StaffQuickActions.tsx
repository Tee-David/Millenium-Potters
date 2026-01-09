"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

interface StaffQuickActionsProps {
  actions: QuickAction[];
}

export function StaffQuickActions({ actions }: StaffQuickActionsProps) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mr-3">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="text-emerald-600 border-emerald-200"
          >
            Need something else?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
