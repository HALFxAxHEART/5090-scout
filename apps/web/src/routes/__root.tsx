import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../lib/auth-client";
import { usePendingCount } from "../features/sync/usePendingCount";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const { user, isLoading } = useCurrentUser();
  const pendingCount = usePendingCount();

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <Link to="/" className="brand">
          🛠️ 5090 Scout
        </Link>
        <Link to="/events">Events</Link>
        <Link to="/sync">
          Sync
          {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
        </Link>
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user?.role === "admin" && <Link to="/admin/scout-progress">Scout Progress</Link>}
        <div className="nav-spacer" />
        {isLoading ? null : user ? (
          <span className="nav-user muted">{user.displayName}</span>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="button-link">
              Sign up
            </Link>
          </>
        )}
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
