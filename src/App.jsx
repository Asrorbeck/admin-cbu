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
import ImloviyXatoliklarMurojaatlar from "./pages/ImloviyXatoliklarMurojaatlar";
import ImloviyXatoliklarFAQCategories from "./pages/ImloviyXatoliklarFAQCategories";
import KorrupsiyaMurojaatlar from "./pages/KorrupsiyaMurojaatlar";
import KorrupsiyaFAQCategories from "./pages/KorrupsiyaFAQCategories";
import Sorovnomalar from "./pages/Sorovnomalar";
import SurveyDetails from "./pages/SurveyDetails";
import TestNatijalari from "./pages/TestNatijalari";
import TilSuhbati from "./pages/TilSuhbati";
import UmumiyNatijalar from "./pages/UmumiyNatijalar";

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
              <Departments />
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
        path="/test-natijalari"
        element={
          <ProtectedRoute>
            <Layout>
              <TestNatijalari />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/til-suhbati"
        element={
          <ProtectedRoute>
            <Layout>
              <TilSuhbati />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/umumiy-natijalar"
        element={
          <ProtectedRoute>
            <Layout>
              <UmumiyNatijalar />
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
      <Route
        path="/imloviy-xatoliklar/murojaatlar"
        element={
          <ProtectedRoute>
            <Layout>
              <ImloviyXatoliklarMurojaatlar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/imloviy-xatoliklar/faq-categories"
        element={
          <ProtectedRoute>
            <Layout>
              <ImloviyXatoliklarFAQCategories />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/korrupsiya-murojaatlari/murojaatlar"
        element={
          <ProtectedRoute>
            <Layout>
              <KorrupsiyaMurojaatlar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/korrupsiya-murojaatlari/faq-categories"
        element={
          <ProtectedRoute>
            <Layout>
              <KorrupsiyaFAQCategories />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sorovnomalar"
        element={
          <ProtectedRoute>
            <Layout>
              <Sorovnomalar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sorovnomalar/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SurveyDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sorovnomalar/javoblar"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  So'rovnoma javoblari
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Bu sahifa keyinchalik to'ldiriladi
                </p>
              </div>
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
