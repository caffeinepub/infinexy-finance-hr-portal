import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { isAuthenticated } from "./lib/adminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import HomePage from "./pages/HomePage";
import InductionForm from "./pages/InductionForm";

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: InductionForm,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLogin,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: () => {
    if (!isAuthenticated()) {
      window.location.href = "/admin/login";
      return null;
    }
    return <AdminDashboard />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  registerRoute,
  adminLoginRoute,
  adminDashboardRoute,
]);

const router = createRouter({
  routeTree,
  history: createBrowserHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
