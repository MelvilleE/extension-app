"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}

export default function AdminDropdownCard({ title, children, defaultOpen = false, forceOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = forceOpen || open;

  return (
    <Card className="mb-4">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between space-y-0"
        onClick={() => !forceOpen && setOpen((previous) => !previous)}
      >
        <CardTitle>{title}</CardTitle>
        <span className="text-sm text-gray-500">{expanded ? "▲" : "▼"}</span>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}
