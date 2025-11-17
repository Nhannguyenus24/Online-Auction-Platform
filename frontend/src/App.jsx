// App.jsx
import { BrowserRouter } from "react-router-dom";
import MainRouter from "./routes";
// components
import NotistackProvider from "./components/NotistackProvider";
import { AuthProvider } from "./contexts/JWTContext";

export default function App() {
  return (
        <AuthProvider>
        <BrowserRouter>
          <NotistackProvider>
            <MainRouter />
          </NotistackProvider>
        </BrowserRouter>
        </AuthProvider>
  );
}