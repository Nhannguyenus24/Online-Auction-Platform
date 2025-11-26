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
        { path: "product/:id", element: <ProductDetailPage /> },
        { path: "category", element: <MainLayout><CategoryPage /></MainLayout> },
        { path: "cookie-policy", element: <MainLayout><CookiePolicyPage /></MainLayout> },
        { path: "careers", element: <MainLayout><CareersPage /></MainLayout> },
        { path: "help", element: <MainLayout><HelpCenterPage /></MainLayout> },
        { path: "how-to-bid", element: <MainLayout><HowToBidPage /></MainLayout> },
        { path: "seller-guide", element: <MainLayout><SellerGuidePage /></MainLayout> },
        { path: "privacy-policy", element: <MainLayout><PrivacyPage /></MainLayout> },
        { path: "terms-of-service", element: <MainLayout><TermOfServicePage /></MainLayout> },
        { path: "", element: <MainLayout><HomePage /></MainLayout> },
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
const MainLayout = Loadable(lazy(() => import("../layouts/MainLayout.jsx")));

//ADMIN
const DashboardAdmin = Loadable(lazy(() => import("../pages/admin/DashBoardPage.jsx")));
const UserManagementPage = Loadable(lazy(() => import("../pages/admin/UserManagementPage.jsx")));
const CategoryManagementPage = Loadable(lazy(() => import("../pages/admin/CategoryManagementPage.jsx")));
const ProductManagementPage = Loadable(lazy(() => import("../pages/admin/ProductManagementPage.jsx")));

//SELLER


//BIDDER

// OTHERS
const Page500 = Loadable(lazy(() => import("../pages/Page500")));
const Page404 = Loadable(lazy(() => import("../pages/Page404")));
const AboutUs = Loadable(lazy(() => import("../pages/AboutUs")));
const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));
const ProductDetailPage = Loadable(lazy(() => import("../pages/ProductDetailPage.jsx")));
const CategoryPage = Loadable(lazy(() => import("../pages/CategoryPage.jsx")));
const CareersPage = Loadable(lazy(() => import("../pages/CareersPage.jsx")));
const CookiePolicyPage = Loadable(lazy(() => import("../pages/CookiePolicyPage.jsx")));
const HelpCenterPage = Loadable(lazy(() => import("../pages/HelpCenterPage.jsx")));
const HowToBidPage = Loadable(lazy(() => import("../pages/HowToBidPage.jsx")));
const SellerGuidePage = Loadable(lazy(() => import("../pages/SellerGuidePage.jsx")));
const PrivacyPage = Loadable(lazy(() => import("../pages/PrivacyPage.jsx")));
const TermOfServicePage = Loadable(lazy(() => import("../pages/TermOfServicePage.jsx")));
const HomePage = Loadable(lazy(() => import("../pages/HomePage.jsx")));