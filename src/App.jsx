import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Departments from "./pages/Departments";
import DepartmentDetails from "./pages/DepartmentDetails";
import NewDepartment from "./pages/NewDepartment";
import NewVacancy from "./pages/NewVacancy";
import ManagementDetails from "./pages/ManagementDetails";
import Murojaatlar from "./pages/Murojaatlar";
import KadrlarDashboard from "./pages/KadrlarDashboard";
import Arizalar from "./pages/Arizalar";
import Testlar from "./pages/Testlar";
import NewTest from "./pages/NewTest";
import FAQCategories from "./pages/FAQCategories";
import Licenses from "./pages/Licenses";

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <KadrlarDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kadrlar"
        element={
          <ProtectedRoute>
            <Layout>
              <KadrlarDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <Layout>
              <Departments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewDepartment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <DepartmentDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/:id/new-vacancy"
        element={
          <ProtectedRoute>
            <Layout>
              <NewVacancy />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* New management route removed: handled via modal in DepartmentDetails */}
      <Route
        path="/management/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ManagementDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/:id/new-vacancy"
        element={
          <ProtectedRoute>
            <Layout>
              <NewVacancy />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/murojaatlar"
        element={
          <ProtectedRoute>
            <Layout>
              <Murojaatlar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/arizalar"
        element={
          <ProtectedRoute>
            <Layout>
              <Arizalar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testlar"
        element={
          <ProtectedRoute>
            <Layout>
              <Testlar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/testlar/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewTest />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faq-categories"
        element={
          <ProtectedRoute>
            <Layout>
              <FAQCategories />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/licenses"
        element={
          <ProtectedRoute>
            <Layout>
              <Licenses />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
