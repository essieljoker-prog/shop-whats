import { Routes, Route } from "react-router";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import Home from "./pages/Home";
import Boutique from "./pages/Boutique";
import Product from "./pages/Product";
import Occasion from "./pages/Occasion";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import FaqPage from "./pages/FaqPage";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import ProductEdit from "./pages/admin/ProductEdit";
import AdminCategories from "./pages/admin/Categories";
import AdminBrands from "./pages/admin/Brands";
import AdminSettings from "./pages/admin/Settings";
import AdminTestimonials from "./pages/admin/Testimonials";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/boutique" element={<Boutique />} />
          <Route path="/produit/:slug" element={<Product />} />
          <Route path="/occasion" element={<Occasion />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/mentions-legales" element={<Legal kind="mentions-legales" />} />
          <Route path="/politique-confidentialite" element={<Legal kind="politique-confidentialite" />} />
          <Route path="/cgv" element={<Legal kind="cgv" />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/connexion" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="produits/nouveau" element={<ProductEdit />} />
          <Route path="produits/:id" element={<ProductEdit />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="marques" element={<AdminBrands />} />
          <Route path="temoignages" element={<AdminTestimonials />} />
          <Route path="parametres" element={<AdminSettings />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
}
