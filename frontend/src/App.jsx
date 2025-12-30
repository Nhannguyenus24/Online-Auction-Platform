// App.jsx
import { BrowserRouter } from "react-router-dom";
import MainRouter from "./routes/index.jsx";
import { HelmetProvider } from "react-helmet-async";
// import ThemeProvider from './theme';
// components
import ThemeProvider from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/JWTContext";

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <MainRouter />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
