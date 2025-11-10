// src/App.jsx
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  const Layout = lazy(() => import("./components/Layout"));
  const Component = lazy(() => import("./pages/Component"));
  const SgbmDateGift = lazy(() => import("./pages/SgbmDateGift"));

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          {/* Layout wraps all public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<SgbmDateGift />} />
            <Route path="component" element={<Component />} />

            {/* 404 Fallback */}
            <Route path="*" element={<h1>Page Not Found</h1>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
