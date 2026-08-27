import { Route, Routes } from "react-router"
import { Layout } from "./components/Layout"
import { BookPage } from "./pages/BookPage"
import { DashboardPage } from "./pages/DashboardPage"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="book" element={<BookPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
