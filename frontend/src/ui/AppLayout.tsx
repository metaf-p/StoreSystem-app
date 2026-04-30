import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Building2, LogOut, Menu, MessageSquare, Package, ShieldCheck, ShoppingCart, Users, Warehouse, X } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { RoleGuard } from "./RoleGuard";
import { Button } from "./Button";
import { cn } from "../lib/utils";

const navItemBase =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    cn(navItemBase, isActive ? "bg-primary/10 text-primary" : "text-muted-foreground");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/products" className="flex items-center gap-3 rounded-xl px-2 py-1 text-base font-semibold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Package className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div>Личный кабинет</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.name || "StoreSystem"}</div>
            </div>
          </NavLink>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <NavLink to="/products" className={navClassName}>
              <Package className="h-4 w-4" />
              Продукты
            </NavLink>
            <NavLink to="/suppliers" className={navClassName}>
              <Building2 className="h-4 w-4" />
              Поставщики
            </NavLink>
            <NavLink to="/warehouses" className={navClassName}>
              <Warehouse className="h-4 w-4" />
              Склады
            </NavLink>
            <NavLink to="/orders" className={navClassName}>
              <ShoppingCart className="h-4 w-4" />
              Заказы
            </NavLink>
            <NavLink to="/chat" className={navClassName}>
              <MessageSquare className="h-4 w-4" />
              Чаты
            </NavLink>
            <RoleGuard minRole="admin">
              <NavLink to="/user-list" className={navClassName}>
                <Users className="h-4 w-4" />
                Пользователи
              </NavLink>
            </RoleGuard>
            <RoleGuard minRole="operator">
              <NavLink to="/pending-approval" className={navClassName}>
                <ShieldCheck className="h-4 w-4" />
                На согласование
              </NavLink>
            </RoleGuard>
            <Button variant="outline-secondary" data-testid="logout" onClick={onLogout} className="ml-2">
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Button
              variant="outline-secondary"
              size="sm"
              className="h-10 w-10 p-0"
              aria-label={menuOpen ? "Закрыть навигацию" : "Открыть навигацию"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-navigation" className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <NavLink to="/products" className={navClassName} onClick={() => setMenuOpen(false)}>
                <Package className="h-4 w-4" />
                Продукты
              </NavLink>
              <NavLink to="/suppliers" className={navClassName} onClick={() => setMenuOpen(false)}>
                <Building2 className="h-4 w-4" />
                Поставщики
              </NavLink>
              <NavLink to="/warehouses" className={navClassName} onClick={() => setMenuOpen(false)}>
                <Warehouse className="h-4 w-4" />
                Склады
              </NavLink>
              <NavLink to="/orders" className={navClassName} onClick={() => setMenuOpen(false)}>
                <ShoppingCart className="h-4 w-4" />
                Заказы
              </NavLink>
              <NavLink to="/chat" className={navClassName} onClick={() => setMenuOpen(false)}>
                <MessageSquare className="h-4 w-4" />
                Чаты
              </NavLink>
              <RoleGuard minRole="admin">
                <NavLink to="/user-list" className={navClassName} onClick={() => setMenuOpen(false)}>
                  <Users className="h-4 w-4" />
                  Пользователи
                </NavLink>
              </RoleGuard>
              <RoleGuard minRole="operator">
                <NavLink to="/pending-approval" className={navClassName} onClick={() => setMenuOpen(false)}>
                  <ShieldCheck className="h-4 w-4" />
                  На согласование
                </NavLink>
              </RoleGuard>
              <Button
                variant="outline-secondary"
                data-testid="logout"
                className="mt-2 justify-start"
                onClick={async () => {
                  setMenuOpen(false);
                  await onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
