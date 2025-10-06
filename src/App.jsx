import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Departments from "./pages/Departments";
import DepartmentDetails from "./pages/DepartmentDetails";
import NewDepartment from "./pages/NewDepartment";
import NewVacancy from "./pages/NewVacancy";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Departments />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/new" element={<NewDepartment />} />
            <Route path="/departments/:id" element={<DepartmentDetails />} />
            <Route
              path="/departments/:id/new-vacancy"
              element={<NewVacancy />}
            />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
