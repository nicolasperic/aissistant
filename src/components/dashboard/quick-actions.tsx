"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarCheck, ClipboardCheck, Target, Sparkles } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Link href="/weekly-plan">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-xs">Generate Plan</span>
          </Button>
        </Link>
        <Link href="/review">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
            <span className="text-xs">Weekly Review</span>
          </Button>
        </Link>
        <Link href="/goals">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
            <Target className="h-4 w-4 text-green-500" />
            <span className="text-xs">Add Goal</span>
          </Button>
        </Link>
        <Link href="/events">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
            <CalendarCheck className="h-4 w-4 text-orange-500" />
            <span className="text-xs">Add Event</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
