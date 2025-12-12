import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [logoExists, setLogoExists] = useState(false);
  const location = useLocation();

  // Get current section title based on pathname
  const getCurrentSectionTitle = () => {
    const pathname = location.pathname;

    if (pathname === "/murojaatlar") {
      return "Murojaatlar bo'limi boshqaruv paneli";
    } else if (pathname === "/arizalar") {
      return "Arizalar bo'limi boshqaruv paneli";
    } else if (
      pathname === "/kadrlar" ||
      pathname === "/" ||
      pathname.startsWith("/departments") ||
      pathname.startsWith("/management")
    ) {
      return "Departament boshqaruv paneli";
    } else {
      return "Markaziy Bank Administratsiyasi";
    }
  };

  // Check if logo exists
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoExists(true);
    img.onerror = () => setLogoExists(false);
    img.src = "/logo.png";
  }, []);

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Listen for applications duplicate updates from pages (e.g., Arizalar)
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      setHasDuplicates(!!detail.has);
      setDuplicateCount(detail.count || (detail.has ? 1 : 0));
    };
    window.addEventListener("apps-duplicates", handler);
    return () => window.removeEventListener("apps-duplicates", handler);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out");
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumb or title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex items-center justify-center">
              {logoExists ? (
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Markaziy Bank Administratsiyasi
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getCurrentSectionTitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {isDarkMode ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen((v) => !v)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors relative"
              title="Bildirishnomalar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" />
              </svg>
              {hasDuplicates && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {duplicateCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Bildirishnomalar
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {hasDuplicates ? (
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          window.dispatchEvent(new CustomEvent("open-duplicates-modal"));
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left"
                      >
                        <svg className="h-4 w-4 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 dark:text-gray-100">Bir xillik aniqlanmoqda</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Ism va tug'ilgan sana bir xil bo'lgan arizalar mavjud</p>
                        </div>
                      </button>
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Yangi bildirishnoma yo'q</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || "HR Manager"}
                </p>
              </div>
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />

                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.name?.charAt(0) || "A"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.name || "Admin User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.username || "admin@example.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg
                        className="h-4 w-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profil
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg
                        className="h-4 w-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Sozlamalar
                    </Link>

                    <Link
                      to="/help"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg
                        className="h-4 w-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Yordam
                    </Link>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg
                        className="h-4 w-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Chiqish
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
