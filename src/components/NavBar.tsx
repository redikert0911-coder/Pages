import type { ReactNode } from "react";
import { getUserInfo, clearToken, clearUserInfo } from "~/lib/client-auth";

interface NavBarProps {
  showBackToDashboard?: boolean;
  rightContent?: ReactNode;
}

export function NavBar({ showBackToDashboard, rightContent }: NavBarProps) {
  const userInfo = getUserInfo();

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Page<span className="text-indigo-600">Pulse</span>
            </span>
          </a>
          {showBackToDashboard && (
            <>
              <span className="text-gray-300 mx-1">/</span>
              <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Dashboard
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {rightContent}
          {userInfo && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-500 sm:inline">
                {userInfo.email}
              </span>
              <button
                onClick={() => {
                  clearToken();
                  clearUserInfo();
                  window.location.href = "/login";
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
