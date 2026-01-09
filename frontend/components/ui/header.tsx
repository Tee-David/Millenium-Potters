// "use client";

// import { useState } from "react";
// import { cn } from "@/lib/utils";

// interface HeaderProps {
//   onSidebarToggle: () => void;
// }

// export function Header({ onSidebarToggle }: HeaderProps) {
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);

//   return (
//     <header className="bg-white border-b border-gray-200 px-6 py-4">
//       <div className="flex items-center justify-between">
//         {/* Left side - Menu toggle */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={onSidebarToggle}
//             className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
//           >
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Right side - Actions */}
//         <div className="flex items-center gap-3">
//           {/* Language Selector */}
//           <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
//             <div className="w-5 h-5 flex items-center justify-center">
//               <span className="text-sm font-medium">🌐</span>
//             </div>
//           </button>

//           {/* Settings */}
//           <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//               />
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//               />
//             </svg>
//           </button>

//           {/* User Profile */}
//           <div className="relative">
//             <button
//               onClick={() => setShowUserMenu(!showUserMenu)}
//               className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
//             >
//               <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
//                 <span className="text-sm font-medium text-gray-600">👤</span>
//               </div>
//               <svg
//                 className="w-4 h-4 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 9l-7 7-7-7"
//                 />
//               </svg>
//             </button>

//             {/* User Menu Dropdown */}
//             {showUserMenu && (
//               <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                 <a
//                   href="#"
//                   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                 >
//                   Profile
//                 </a>
//                 <a
//                   href="#"
//                   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                 >
//                   Account Settings
//                 </a>
//                 <hr className="my-2" />
//                 <a
//                   href="#"
//                   className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                 >
//                   Sign Out
//                 </a>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onSidebarToggle}
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 transition-colors",
              "min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]",
              "flex items-center justify-center",
              "cursor-pointer"
            )}
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* <button
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 transition-colors relative",
              "min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]",
              "flex items-center justify-center"
            )}
            aria-label="Change language"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-sm font-medium">🌐</span>
            </div>
          </button> */}

          {/* <button
            className={cn(
              "p-2 rounded-lg hover:bg-gray-100 transition-colors",
              "min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]",
              "flex items-center justify-center",
              "cursor-pointer"
            )}
            aria-label="Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
          </button> */}

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors",
                "min-h-[44px] sm:min-h-[36px]",
                "cursor-pointer"
              )}
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">👤</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 hidden xs:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showUserMenu && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="fixed inset-0 z-40 sm:hidden"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50",
                    "sm:w-48 w-40 max-w-[90vw]"
                  )}
                >
                  <a
                    href="/dashboard/settings"
                    className="block px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </a>
                  {/* <a
                    href="#"
                    className="block px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Account Settings
                  </a> */}
                  <hr className="my-2" />
                  <a
                    href="#"
                    className="block px-4 py-3 sm:py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    Sign Out
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
