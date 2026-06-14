"use client";

import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/authContext";
import { logoutUser } from "@/features/auth/services/authApi";

const PROFILE_STORAGE_KEY = "hangwat-profile";
const DEFAULT_PROFILE = {
  username: "ユーザー",
  color: "#d4d4d8",
};
const PROFILE_COLORS = [
  { name: "グレー", value: "#d4d4d8" },
  { name: "イエロー", value: "#e3bd49" },
  { name: "オレンジ", value: "#f3a55b" },
  { name: "ピンク", value: "#e8a0a8" },
  { name: "パープル", value: "#b7a0d8" },
  { name: "ブルー", value: "#8dbbd3" },
  { name: "グリーン", value: "#8fc995" },
  { name: "ブラウン", value: "#b58b72" },
] as const;

type Profile = {
  username: string;
  color: string;
};

function getInitial(username: string) {
  return Array.from(username.trim())[0]?.toUpperCase() ?? "ユ";
}

function loadProfile(): Profile {
  const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!storedProfile) {
    return DEFAULT_PROFILE;
  }

  try {
    const profile = JSON.parse(storedProfile) as Partial<Profile>;
    const isKnownColor = PROFILE_COLORS.some(
      (profileColor) => profileColor.value === profile.color,
    );

    return {
      username:
        typeof profile.username === "string" && profile.username.trim()
          ? profile.username.trim()
          : DEFAULT_PROFILE.username,
      color: isKnownColor ? profile.color! : DEFAULT_PROFILE.color,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfileMenu() {
  const router = useRouter();
  const { user, clearUser } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [draftColor, setDraftColor] = useState(DEFAULT_PROFILE.color);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutErrorMessage, setLogoutErrorMessage] = useState<string | null>(
    null,
  );

  const displayName = user?.name ?? profile.username;

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const storedProfile = loadProfile();
      setProfile(storedProfile);
      setDraftColor(storedProfile.color);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const openSettings = () => {
    setDraftColor(profile.color);
    dialogRef.current?.showModal();
  };

  const closeSettings = () => {
    setLogoutErrorMessage(null);
    dialogRef.current?.close();
  };

  const handleSave = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const nextProfile = { username: displayName, color: draftColor };
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(nextProfile),
    );
    setProfile(nextProfile);
    closeSettings();
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setLogoutErrorMessage(null);
    setIsLoggingOut(true);

    try {
      const result = await logoutUser();

      if (!result.ok) {
        setLogoutErrorMessage(result.message);
        return;
      }

      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfile(DEFAULT_PROFILE);
      clearUser();
      closeSettings();
      router.push("/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={`${displayName}のプロフィール設定を開く`}
        onClick={openSettings}
        className="flex size-8 items-center justify-center justify-self-end rounded-full text-sm font-semibold text-foreground shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{ backgroundColor: profile.color }}
      >
        {getInitial(displayName)}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="profile-settings-title"
        className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-[16px] border-2 border-primary bg-background p-0 text-foreground shadow-xl backdrop:bg-black/45"
        onClick={(mouseEvent) => {
          if (mouseEvent.target === dialogRef.current) {
            closeSettings();
          }
        }}
      >
        <form onSubmit={handleSave} className="relative px-7 pb-6 pt-7">
          <button
            type="button"
            aria-label="プロフィール設定を閉じる"
            onClick={closeSettings}
            className="absolute right-3 top-3 rounded-full p-1 text-foreground transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-foreground"
          >
            <X aria-hidden="true" size={20} />
          </button>

          <h2
            id="profile-settings-title"
            className="text-center text-xl text-primary"
          >
            プロフィール設定
          </h2>

          <div className="mt-6 flex flex-col items-center">
            <span
              aria-hidden="true"
              className="flex size-20 items-center justify-center rounded-full text-3xl font-semibold text-foreground shadow-md"
              style={{ backgroundColor: draftColor }}
            >
              {getInitial(displayName)}
            </span>
            <p
              title={displayName}
              className="mt-3 max-w-full truncate text-center text-lg font-medium text-foreground"
            >
              {displayName}
            </p>
          </div>

          <fieldset className="mt-7">
            <legend className="text-primary">アイコンカラー</legend>
            <div className="mt-3 grid grid-cols-4 gap-4">
              {PROFILE_COLORS.map((profileColor) => {
                const isSelected = draftColor === profileColor.value;

                return (
                  <label
                    key={profileColor.value}
                    title={profileColor.name}
                    className="flex cursor-pointer justify-center"
                  >
                    <input
                      type="radio"
                      name="profile-color"
                      value={profileColor.value}
                      checked={isSelected}
                      onChange={() => setDraftColor(profileColor.value)}
                      className="sr-only"
                    />
                    <span
                      aria-label={profileColor.name}
                      className={`size-10 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
                        isSelected
                          ? "scale-110 border-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: profileColor.value }}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          {logoutErrorMessage && (
            <p
              role="alert"
              className="mt-6 whitespace-pre-line rounded-base border-2 border-danger bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {logoutErrorMessage}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-base border-2 border-danger px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut aria-hidden="true" size={17} />
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </button>
            <button
              type="submit"
              className="rounded-base bg-primary px-7 py-2 text-lg text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              完了
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
