// App.jsx
import { BrowserRouter } from "react-router-dom";
import MainRouter from "./routes/index.jsx";
import { HelmetProvider } from "react-helmet-async";
// import ThemeProvider from './theme';
// components
import ThemeProvider from "./components/ThemeProvider";

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <MainRouter />
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}
