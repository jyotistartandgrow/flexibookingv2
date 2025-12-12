// src/App.jsx
import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

export default function App({ initialRoute = "/" }) {
  const Layout = lazy(() => import("./components/Layout"));
  const Component = lazy(() => import("./pages/Component"));
  const SgbmDateGift = lazy(() => import("./pages/SgbmDateGift"));
  const Thankyou = lazy(() => import("./pages/Thankyou"));

  // Force route redirect when the app loads
  function InitialRedirect() {
    const navigate = useNavigate();
    useEffect(() => {
      if (window.location.pathname === "/") {
        let type = new URLSearchParams(window.location.search).get("type");
        if (type) {
          navigate(`${initialRoute}?type=${type}`);
        } else {
          navigate(initialRoute);
        }
      }
    }, []);
    return null;
  }

  return (
    <BrowserRouter>
      <InitialRedirect />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          {/* Layout wraps all public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<SgbmDateGift />} />
            <Route path="component" element={<Component />} />

            {/* 404 Fallback */}
            <Route path="*" element={<h1>Page Not Found</h1>} />
          </Route>
          <Route path="thankyou" element={<Thankyou />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
