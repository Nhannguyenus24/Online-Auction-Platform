// App.jsx
import { BrowserRouter } from "react-router-dom";
import MainRouter from "./routes/index.jsx";
import { HelmetProvider } from "react-helmet-async";
import { SnackbarProvider } from "notistack";
// import ThemeProvider from './theme';
// components
import ThemeProvider from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/JWTContext";

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={3000}
        >
          <AuthProvider>
            <BrowserRouter>
              <MainRouter />
            </BrowserRouter>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
