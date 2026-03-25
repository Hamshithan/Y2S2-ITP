import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import FleetManagement from './pages/FleetManagement'
import DriverManagement from './pages/DriverManagement'
import ParcelManagement from './pages/ParcelManagement'
import Dispatch from './pages/Dispatch'
import RouteManagement from './pages/RouteManagement'
import Reviews from './pages/Reviews'
import Loyalty from './pages/Loyalty'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="fleet" element={<FleetManagement />} />
          <Route path="drivers" element={<DriverManagement />} />
          <Route path="parcels" element={<ParcelManagement />} />
          <Route path="dispatch" element={<Dispatch />} />
          <Route path="routes" element={<RouteManagement />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="loyalty" element={<Loyalty />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
