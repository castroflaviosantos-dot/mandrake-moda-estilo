import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store'
import { SiteLayout } from '@/components/site/SiteLayout'
import AdminLayout from '@/components/admin/AdminLayout'
import Home from '@/pages/Home'
import Catalog from '@/pages/Catalog'
import ProductPage from '@/pages/ProductPage'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderConfirmed from '@/pages/OrderConfirmed'
import TrackOrder from '@/pages/TrackOrder'
import Account from '@/pages/Account'
import Dashboard from '@/pages/admin/Dashboard'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminBanners from '@/pages/admin/AdminBanners'
import AdminCustomers from '@/pages/admin/AdminCustomers'
import AdminShipping from '@/pages/admin/AdminShipping'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/produtos" element={<Catalog />} />
            <Route path="/categoria/:slug" element={<Catalog />} />
            <Route path="/novidades" element={<Catalog mode="novidades" />} />
            <Route path="/ofertas" element={<Catalog mode="ofertas" />} />
            <Route path="/produto/:slug" element={<ProductPage />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:code" element={<OrderConfirmed />} />
            <Route path="/acompanhar" element={<TrackOrder />} />
            <Route path="/conta" element={<Account />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="clientes" element={<AdminCustomers />} />
            <Route path="entregas" element={<AdminShipping />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster theme="dark" position="top-right" />
      </BrowserRouter>
    </StoreProvider>
  )
}
