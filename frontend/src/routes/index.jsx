import { Suspense, lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";
// components
import LoadingScreen from "../components/LoadingScreen";
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
// ----------------------------------------------------------------------

const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );

export default function Router() {
  return useRoutes([
    // Main Routes
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "category", element: <CategoryPage /> },
        { path: "category/:parentCategory", element: <CategoryPage /> },
        {
          path: "category/:parentCategory/:childCategory",
          element: <CategoryPage />,
        },
        { path: "cookie-policy", element: <CookiePolicyPage /> },
        { path: "careers", element: <CareersPage /> },
        { path: "help", element: <HelpCenterPage /> },
        { path: "how-to-bid", element: <HowToBidPage /> },
        { path: "seller-guide", element: <SellerGuidePage /> },
        { path: "privacy-policy", element: <PrivacyPage /> },
        { path: "terms-of-service", element: <TermOfServicePage /> },
        { path: "about-us", element: <AboutUs /> },
        { path: "maintenance", element: <Maintenance /> },
        { path: "product/:id", element: <ProductDetailPage /> },
        { path: "500", element: <Page500 /> },
        { path: "404", element: <Page404 /> },
      ],
    },
    {
      path: "auth",
      children: [
        { 
          path: "login", 
          element: (
            <GuestGuard>
              <Login />
            </GuestGuard>
          )
        },
        { 
          path: "forgot-password", 
          element: (
            <GuestGuard>
              <ForgotPassword />
            </GuestGuard>
          )
        },
        { 
          path: "register", 
          element: (
            <GuestGuard>
              <Register />
            </GuestGuard>
          )
        },
        { 
          path: "reset-password", 
          element: (
            <GuestGuard>
              <ResetPassword />
            </GuestGuard>
          )
        },
      ],
    },
    {
      path: "admin",
      element: (
        <AuthGuard>
          <AdminLayout />
        </AuthGuard>
      ),
      children: [
        { path: "dashboard", element: <DashboardAdmin /> },
        { path: "users", element: <UserManagementPage /> },
        { path: "categories", element: <CategoryManagementPage /> },
        { path: "products", element: <ProductManagementPage /> },
        { path: "", element: <Navigate to="/admin/dashboard" replace /> },
      ],
    },
    {
      path: "bidder",
      element: <BidderLayout />,
      children: [
        { path: "", element: <Navigate to="/bidder/home" replace /> },
        { path: "home", element: <BidderHomePage /> },
        { path: "profile", element: <BidderProfilePage /> },
        { path: "watchlist", element: <BidderWatchListPage /> },
        { path: "auction-history", element: <BidderAuctionHistoryPage /> },
        { path: "checkout", element: <BidderCheckoutPage /> },
        { path: "checkout/:id", element: <BidderCheckoutPage /> },
        { path: "order-completion/:orderId", element: <BidderOrderCompletionPage /> },
        { path: "chat", element: <BidderChatPage /> },
        { path: "chat/:orderId", element: <BidderChatPage /> },
      ],
    },
    {
      path: "seller",
      element: <SellerLayout />,
      children: [
        { path: "", element: <Navigate to="/seller/home" replace /> },
        { path: "home", element: <SellerHomePage /> },
        { path: "profile", element: <SellerProfilePage /> },
        { path: "create-auction", element: <SellerCreateAuctionPage /> },
        { path: "products", element: <SellerProductsPage /> },
        { path: "orders", element: <SellerOrdersPage /> },
        { path: "chat", element: <SellerChatPage /> },
        { path: "chat/:orderId", element: <SellerChatPage /> },
      ],
    },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);
}

// AUTHENTICATION
const Login = Loadable(lazy(() => import("../pages/authentication/Login.jsx")));
const ForgotPassword = Loadable(
  lazy(() => import("../pages/authentication/ForgotPassword.jsx"))
);
const ResetPassword = Loadable(
  lazy(() => import("../pages/authentication/ResetPassword.jsx"))
);
const Register = Loadable(
  lazy(() => import("../pages/authentication/Register.jsx"))
);

// MAINLAYOUT
const AdminLayout = Loadable(lazy(() => import("../layouts/AdminLayout.jsx")));
const MainLayout = Loadable(lazy(() => import("../layouts/MainLayout.jsx")));
const BidderLayout = Loadable(
  lazy(() => import("../layouts/BidderLayout.jsx"))
);
const SellerLayout = Loadable(
  lazy(() => import("../layouts/SellerLayout.jsx"))
);

//ADMIN
const DashboardAdmin = Loadable(
  lazy(() => import("../pages/admin/DashBoardPage.jsx"))
);
const UserManagementPage = Loadable(
  lazy(() => import("../pages/admin/UserManagementPage.jsx"))
);
const CategoryManagementPage = Loadable(
  lazy(() => import("../pages/admin/CategoryManagementPage.jsx"))
);
const ProductManagementPage = Loadable(
  lazy(() => import("../pages/admin/ProductManagementPage.jsx"))
);

//SELLER
const SellerHomePage = Loadable(
  lazy(() => import("../pages/seller/HomePage.jsx"))
);
const SellerProfilePage = Loadable(
  lazy(() => import("../pages/seller/ProfilePage.jsx"))
);
const SellerCreateAuctionPage = Loadable(
  lazy(() => import("../pages/seller/CreateAuctionPage.jsx"))
);
const SellerProductsPage = Loadable(
  lazy(() => import("../pages/seller/ProductsPage.jsx"))
);
const SellerOrdersPage = Loadable(
  lazy(() => import("../pages/seller/OrdersPage.jsx"))
);
const SellerChatPage = Loadable(
  lazy(() => import("../pages/seller/ChatPage.jsx"))
);

//BIDDER
const BidderHomePage = Loadable(
  lazy(() => import("../pages/bidder/HomePage.jsx"))
);
const BidderChatPage = Loadable(
  lazy(() => import("../pages/bidder/ChatPage.jsx"))
);
const BidderProfilePage = Loadable(
  lazy(() => import("../pages/bidder/ProfilePage.jsx"))
);
const BidderWatchListPage = Loadable(
  lazy(() => import("../pages/bidder/WatchListPage.jsx"))
);
const BidderAuctionHistoryPage = Loadable(
  lazy(() => import("../pages/bidder/AuctionHistory.jsx"))
);
const BidderCheckoutPage = Loadable(
  lazy(() => import("../pages/bidder/CheckoutPage.jsx"))
);
const BidderOrderCompletionPage = Loadable(
  lazy(() => import("../pages/bidder/OrderCompletionPage.jsx"))
);

// OTHERS
const Page500 = Loadable(lazy(() => import("../pages/Page500")));
const Page404 = Loadable(lazy(() => import("../pages/Page404")));
const AboutUs = Loadable(lazy(() => import("../pages/AboutUs")));
const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));
const ProductDetailPage = Loadable(
  lazy(() => import("../pages/ProductDetailPage.jsx"))
);
const CategoryPage = Loadable(lazy(() => import("../pages/CategoryPage.jsx")));
const CareersPage = Loadable(lazy(() => import("../pages/CareersPage.jsx")));
const CookiePolicyPage = Loadable(
  lazy(() => import("../pages/CookiePolicyPage.jsx"))
);
const HelpCenterPage = Loadable(
  lazy(() => import("../pages/HelpCenterPage.jsx"))
);
const HowToBidPage = Loadable(lazy(() => import("../pages/HowToBidPage.jsx")));
const SellerGuidePage = Loadable(
  lazy(() => import("../pages/SellerGuidePage.jsx"))
);
const PrivacyPage = Loadable(lazy(() => import("../pages/PrivacyPage.jsx")));
const TermOfServicePage = Loadable(
  lazy(() => import("../pages/TermOfServicePage.jsx"))
);
const HomePage = Loadable(lazy(() => import("../pages/HomePage.jsx")));
