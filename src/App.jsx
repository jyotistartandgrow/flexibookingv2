import { Suspense, lazy } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

export default function App({ initialRoute = "/", ...props }) {
  const Layout = lazy(() => import("./components/Layout"));
  const Component = lazy(() => import("./pages/Component"));
  const SgbmDateGift = lazy(() => import("./pages/SgbmDateGift"));
  const Thankyou = lazy(() => import("./pages/Thankyou"));
  const SgbmService = lazy(() => import("./pages/SgbmService"));
  const SgbmCategory = lazy(() => import("./pages/SgbmCategory"));
  const RedeemGift = lazy(() => import("./pages/RedeemGift"));
  const RedeemThankyou = lazy(() => import("./pages/RedeemThankyou"));
  const SgbmOpenDatePurchase = lazy(() => import("./pages/SgbmOpenDatePurchase"));

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout {...props} />}>
            <Route index element={<SgbmDateGift {...props} />} />
            <Route
              path="startingservice"
              element={<SgbmService {...props} />}
            />
            <Route
              path="startingcategory"
              element={<SgbmCategory {...props} />}
            />
            <Route
              path="opendatepurchase"
              element={<SgbmOpenDatePurchase {...props} />}
            />
            <Route path="component" element={<Component {...props} />} />
            <Route path="*" element={<h1>Page Not Found</h1>} />
          </Route>
          <Route path="redeemgift" element={<RedeemGift {...props} />} />
          <Route path="thankyou" element={<Thankyou />} />
          <Route path="redeem-thankyou" element={<RedeemThankyou />} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
}
