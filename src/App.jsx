import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PracticeByCategory from './pages/PracticeByCategory.jsx'
import MockExam from './pages/MockExam.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="practice" element={<PracticeByCategory />} />
        <Route path="mock-exam" element={<MockExam />} />
      </Route>
    </Routes>
  )
}
