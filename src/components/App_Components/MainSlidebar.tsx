import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Sun,
  Moon,
  SettingsIcon,
  Book,
  GitBranch,
  NotebookPen,
  School2,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IUser, logout } from "../../api/auth.service";
import logo from "../../assets/images/logo-invert.png";
import { cn } from "../../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DropdownMenuContent } from "@radix-ui/react-dropdown-menu";
import { useTheme } from "../theme-provider";
import { getValue } from "@/utils/electronStoreService";

const navigation = [
  { name: "Attendance", path: "/", icon: NotebookPen, forTeacher: true },
  { name: "Analytics", path: "/analytics", icon: BarChart2, forTeacher: true },
  { name: "Classes", path: "/class", icon: School2, forTeacher: false },
  { name: "Subjects", path: "/subjects", icon: Book, forTeacher: true },
  { name: "Branches", path: "/branches", icon: GitBranch, forTeacher: false },
  { name: "Teachers", path: "/teachers", icon: User, forTeacher: false },
];

const MainSlidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { setTheme } = useTheme();
  const [user, setUser] = useState<IUser>();

  useEffect(() => {
    const getUser = async () => {
      const userdata = await getValue("user");
      setUser(userdata);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => location.pathname === path;

  const filteredNavigation = navigation.filter((item) => {
    if (user?.userType === "admin") return true;

    if (user?.userType === "teacher" && item.forTeacher === false) {
      return false;
    }
    return true;
  });


  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border p-4 h-16">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm">
              <img src={logo} alt="GPKP" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                GPKolhapur
              </h1>
              <p className="text-xs text-muted-foreground">
                Attendance System
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-primary shadow-sm">
            <img src={logo} alt="GPKP" className="h-6 w-6 object-contain" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-background hover:bg-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-hidden">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <div key={item.path} className="group relative">
              <Button
                variant={active ? "default" : "ghost"}
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "w-full transition-all",
                  collapsed
                    ? "h-10 justify-center"
                    : "h-10 justify-start gap-3 px-3",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span>{item.name}</span>}
              </Button>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition">
                  <div className="rounded-md bg-popover px-3 py-1.5 text-sm border shadow-md">
                    {item.name}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="border-t border-sidebar-border p-2 relative group">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                collapsed && "justify-center px-2"
              )}
            >
              <Settings className="h-5 w-5" />
              {!collapsed && <span>Settings</span>}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="start"
            className={cn("w-48", collapsed && "ml-2")}
          >
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>

            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DropdownMenuItem className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Theme
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" className="w-40">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {collapsed && (
          <span className="absolute left-16 top-1/2 -translate-y-1/2 rounded bg-muted px-2 py-1 text-xs opacity-0 shadow group-hover:opacity-100 transition">
            Settings
          </span>
        )}
      </div>
    </div>
  );
};

export default MainSlidebar;
