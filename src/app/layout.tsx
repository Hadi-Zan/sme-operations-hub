import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SME Operations Hub",
    template: "%s | SME Operations Hub",
  },
  description:
    "A simple operations workspace for small service businesses to stay on top of daily work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
