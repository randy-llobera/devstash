import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { getDashboardStats, getSidebarItemTypes } from "@/lib/db/items";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ChangePasswordModal } from "@/components/profile/change-password-modal";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";
import { ProfileInfo } from "@/components/profile/profile-info";
import { ProfileStats } from "@/components/profile/profile-stats";

const ProfilePage = async () => {
  const [user, stats, itemTypes, sidebarCollections, collections] =
    await Promise.all([
      getDashboardUser(),
      getDashboardStats(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
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
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and usage.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.9fr)]">
        <ProfileInfo user={user} />
        <div className="grid gap-6">
          <ChangePasswordModal enabled={user.hasPassword} />
          <DeleteAccountModal />
        </div>
      </div>

      <ProfileStats itemTypes={itemTypes} stats={stats} />
    </DashboardShell>
  );
};

export default ProfilePage;
