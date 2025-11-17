// App.jsx
import { BrowserRouter } from "react-router-dom";
import MainRouter from "./routes/index.jsx";
// components
import ThemeProvider from "./components/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
        <BrowserRouter>
          <MainRouter />
        </BrowserRouter>
    </ThemeProvider>
  );
}