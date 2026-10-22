import { NavLink, Outlet, Navigate, Link, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Tag,
  Settings2,
  MessageSquareQuote,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/produits", label: "Produits", icon: Package },
  { to: "/admin/categories", label: "Catégories", icon: FolderOpen },
  { to: "/admin/marques", label: "Marques", icon: Tag },
  { to: "/admin/temoignages", label: "Témoignages", icon: MessageSquareQuote },
  { to: "/admin/parametres", label: "Paramètres", icon: Settings2 },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const me = trpc.admin.me.useQuery(undefined, { retry: false });
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      toast.success("Déconnexion réussie.");
      navigate("/admin/connexion", { replace: true });
    },
    onError: (error) => toast.error(error.message),
  });

  if (me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist text-[14px] text-muted-foreground">
        Vérification de la session…
      </div>
    );
  }
  if (me.isError) return <Navigate to="/admin/connexion" replace />;

  return (
    <div className="min-h-screen bg-mist md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-white md:flex md:min-h-screen">
        <div className="border-b hairline px-5 py-5">
          <Logo />
          <p className="mt-1 text-[12px] text-muted-foreground">Administration</p>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Administration">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? "bg-brand-blue-700 text-white" : "text-muted-foreground hover:bg-mist hover:text-brand-blue-700"
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t hairline p-3">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] text-muted-foreground hover:bg-mist">
            <ExternalLink className="h-[18px] w-[18px]" />
            Voir le site
          </Link>
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] text-muted-foreground hover:bg-mist"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Barre mobile */}
        <div className="sticky top-0 z-30 border-b hairline bg-white md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Logo />
            <div className="flex items-center gap-1">
              <Link to="/" aria-label="Voir le site" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist">
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button onClick={() => logout.mutate()} aria-label="Déconnexion" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2.5" aria-label="Administration">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium ${
                    isActive ? "bg-brand-blue-700 text-white" : "text-muted-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
