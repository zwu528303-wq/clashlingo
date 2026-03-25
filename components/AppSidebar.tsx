"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Home, LogOut, Settings2, Swords } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  type EditableProfile,
  getAvatarTheme,
  normalizeAvatarLetter,
} from "@/lib/profile";

type SidebarKey = "lounge" | "rivalries" | "scopes" | "settings";

interface SidebarItem {
  key: SidebarKey;
  label: string;
  href: string;
  icon: typeof Home;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "lounge", label: "Lounge", href: "/lounge", icon: Home },
  { key: "rivalries", label: "Rivalries", href: "/rivalries", icon: Swords },
  { key: "scopes", label: "Scopes", href: "/scopes", icon: BookOpen },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings2 },
];

interface AppSidebarProps {
  active: SidebarKey;
  profile: EditableProfile;
}

export default function AppSidebar({ active, profile }: AppSidebarProps) {
  const router = useRouter();
  const avatarTheme = getAvatarTheme(profile.avatarColor);
  const avatarLetter = normalizeAvatarLetter(
    profile.avatarLetter,
    profile.displayName
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="lg:sticky lg:top-6 self-start">
      <div className="rounded-[2.5rem] border border-surface-container bg-surface-container-low shadow-sm p-5 lg:p-6 space-y-6">
        <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:text-left">
          <div
            className={`w-14 h-14 rounded-[1.25rem] ${avatarTheme.avatarClassName} flex items-center justify-center text-2xl font-black shadow-sm shrink-0`}
          >
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-primary tracking-tighter">
              ClashLingo
            </p>
            <p className="text-sm text-on-surface font-bold truncate">
              {profile.displayName}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {profile.preferredLanguage} learner
            </p>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              Lounge rhythm {profile.weeklyMatchTime}
            </p>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-black transition-all lg:justify-start ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-white text-on-surface-variant border border-surface-container hover:text-primary hover:border-primary/20"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-[1.2rem] border border-surface-container bg-white px-4 py-3 text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
