import { presentableDemoAccounts } from "@/app/_landing/content";
import type { DemoLoginInfo } from "@/app/_panel/DemoAccountsDialog";
import { displayName } from "@/app/_panel/format";
import { LoginScreen } from "@/app/_panel/LoginScreen";
import { DEMO_LOGIN_CODE } from "@/lib/contract/demo-accounts";

// /login (D-08): the two-step login form, rendered on the client. This server component passes the
// demo accounts for the informational "Konta demo" dialog as props, so they reach the page as
// rendered data (the same list the landing page shows) and never sit in a client JavaScript chunk.
export default function LoginPage() {
  const demo: DemoLoginInfo = {
    code: DEMO_LOGIN_CODE,
    accounts: presentableDemoAccounts().map((account) => ({
      email: account.email,
      role: account.role,
      name: displayName(account.display_name),
    })),
  };
  return <LoginScreen demo={demo} />;
}
