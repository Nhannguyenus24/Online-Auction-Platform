import { Suspense, lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";
// components
import LoadingScreen from "../components/LoadingScreen";
// ----------------------------------------------------------------------

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);


export default function Router() {
  return useRoutes([
    // Main Routes
    {
      path: "*",
      children: [
        { path: "login", element: <Login /> },
        { path: "forgot-password", element: <ForgotPassword /> },
        { path: "register", element: <Register /> },
        { path: "reset-password", element: <ResetPassword /> },
        { path: "about-us", element: <AboutUs /> },
        { path: "maintenance", element: <Maintenance /> },
        { path: "500", element: <Page500 /> },
        { path: "404", element: <Page404 /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
    {
      path: "/admin",
      children: [
        { path: "dashboard", element: <AdminLayout><DashboardAdmin /></AdminLayout> },
        { path: "users", element: <AdminLayout><UserManagementPage /></AdminLayout> },
        { path: "categories", element: <AdminLayout><CategoryManagementPage /></AdminLayout> },
        { path: "products", element: <AdminLayout><ProductManagementPage /></AdminLayout> },
      ],
    }
  ]);
}


// AUTHENTICATION
const Login = Loadable(lazy(() => import("../pages/authentication/Login.jsx")));
const ForgotPassword = Loadable(lazy(() => import("../pages/authentication/ForgotPassword.jsx")));
const ResetPassword = Loadable(lazy(() => import("../pages/authentication/ResetPassword.jsx")));
const Register = Loadable(lazy(() => import("../pages/authentication/Register.jsx")));

// MAINLAYOUT
const AdminLayout = Loadable(lazy(() => import("../layouts/AdminLayout.jsx")));

//ADMIN

const DashboardAdmin = Loadable(lazy(() => import("../pages/admin/DashBoardPage.jsx")));
const UserManagementPage = Loadable(lazy(() => import("../pages/admin/UserManagementPage.jsx")));
const CategoryManagementPage = Loadable(lazy(() => import("../pages/admin/CategoryManagementPage.jsx")));
const ProductManagementPage = Loadable(lazy(() => import("../pages/admin/ProductManagementPage.jsx")));

// OTHERS
const Page500 = Loadable(lazy(() => import("../pages/Page500")));
const Page404 = Loadable(lazy(() => import("../pages/Page404")));
const AboutUs = Loadable(lazy(() => import("../pages/AboutUs")));
const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));