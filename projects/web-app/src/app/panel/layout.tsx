import type { ReactNode } from "react";
import { PanelShell } from "@/app/_panel/PanelShell";

// Every /panel route renders inside the session guard and the panel header (D-08).
export default function PanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PanelShell>{children}</PanelShell>;
}
