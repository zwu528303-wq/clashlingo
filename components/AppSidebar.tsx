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
      <div className="rounded-[2.8rem] border border-white/80 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-surface-container-low shadow-[0_24px_60px_rgba(149,63,77,0.08)] p-5 lg:p-6 space-y-7">
        <div className="space-y-5">
          <div>
            <p className="text-[2.4rem] font-black text-primary tracking-[-0.06em] leading-none">
              ClashLingo
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-[1.5rem] ${avatarTheme.avatarClassName} flex items-center justify-center text-2xl font-black shadow-sm shrink-0 ring-4 ring-white/80`}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="text-xl text-on-surface font-black truncate tracking-tight">
                {profile.displayName}
              </p>
              <p className="text-sm text-on-surface-variant font-medium">
                {profile.preferredLanguage} learner
              </p>
            </div>
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
                className={`flex items-center justify-center gap-3 rounded-[1.4rem] px-4 py-3.5 text-sm font-black transition-all lg:justify-start ${
                  isActive
                    ? "bg-primary text-on-primary shadow-[0_14px_30px_rgba(149,63,77,0.22)]"
                    : "text-on-surface-variant hover:text-primary hover:bg-white/80"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-[1.8rem] border border-white/80 bg-white/80 p-4 space-y-1 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            Lounge rhythm
          </p>
          <p className="text-2xl font-black tracking-tight text-on-surface">
            {profile.weeklyMatchTime}
          </p>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            Your weekly default countdown pulse. Matches can still begin early.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-[1.4rem] border border-white/80 bg-white/85 px-4 py-3.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-all"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
