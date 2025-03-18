import React, { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

// This component is no longer directly used - functionality moved to App.tsx
// But keeping it for backward compatibility in case there are other imports
const AppShell = ({ children }: AppShellProps) => {
  return <>{children}</>;
};

export default AppShell;
