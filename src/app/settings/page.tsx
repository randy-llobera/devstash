import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { getDashboardStats, getSidebarItemTypes } from "@/lib/db/items";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AccountSettings } from "@/components/profile/account-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { EditorPreferencesSettings } from "@/components/settings/editor-preferences-settings";

const SettingsPage = async () => {
  const [user, itemTypes, sidebarCollections, collections, stats] = await Promise.all([
    getDashboardUser(),
    getSidebarItemTypes(),
    getSidebarCollectionsData(),
    getAvailableCollections(),
    getDashboardStats(),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage billing, editor defaults, account actions, and password recovery options.
        </p>
      </div>

      <BillingSettings
        isPro={user.isPro}
        stripeCustomerId={user.stripeCustomerId}
        itemCount={stats.itemCount}
        collectionCount={stats.collectionCount}
      />
      <EditorPreferencesSettings initialPreferences={user.editorPreferences} />
      <AccountSettings email={user.email} hasPassword={user.hasPassword} />
    </DashboardShell>
  );
};

export default SettingsPage;
