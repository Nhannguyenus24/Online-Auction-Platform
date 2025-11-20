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
        { path: "about", element: <AboutUs /> },
        { path: "maintenance", element: <Maintenance /> },
        { path: "500", element: <Page500 /> },
        { path: "404", element: <Page404 /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
  ]);
}


// AUTHENTICATION
const Login = Loadable(lazy(() => import("../pages/authentication/Login.jsx")));
const ForgotPassword = Loadable(lazy(() => import("../pages/authentication/ForgotPassword.jsx")));
const ResetPassword = Loadable(lazy(() => import("../pages/authentication/ResetPassword.jsx")));
const Register = Loadable(lazy(() => import("../pages/authentication/Register.jsx")));

// MAINLAYOUT
// const MainLayout = Loadable(lazy(() => import("../layout/MainLayout")));

// OTHERS
const Page500 = Loadable(lazy(() => import("../pages/Page500")));
const Page404 = Loadable(lazy(() => import("../pages/Page404")));
const AboutUs = Loadable(lazy(() => import("../pages/AboutUs")));
const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));