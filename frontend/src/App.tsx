import { Route, Routes } from "react-router"
import { Layout } from "./components/Layout"
import { RedirectStaffAway } from "./components/RedirectStaffAway"
import { RequireRole } from "./components/RequireRole"
import { STAFF_ROLES, ROLES } from "./lib/auth/roles"
import { BookPage } from "./pages/BookPage"
import { DashboardPage } from "./pages/DashboardPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { MyAppointmentsPage } from "./pages/MyAppointmentsPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { RegisterPage } from "./pages/RegisterPage"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="book"
          element={
            <RedirectStaffAway redirectTo="/dashboard">
              <BookPage />
            </RedirectStaffAway>
          }
        />
        <Route
          path="appointments"
          element={
            <RequireRole roles={[ROLES.client]} redirectTo="/dashboard">
              <MyAppointmentsPage />
            </RequireRole>
          }
        />
        <Route
          path="dashboard"
          element={
            <RequireRole roles={STAFF_ROLES} redirectTo="/book">
              <DashboardPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
