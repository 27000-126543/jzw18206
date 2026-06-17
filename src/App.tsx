import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import RecordActivity from '@/pages/RecordActivity';
import ActivityDetail from '@/pages/ActivityDetail';
import Profile from '@/pages/Profile';
import RouteExplorer from '@/pages/RouteExplorer';
import Community from '@/pages/Community';
import Challenges from '@/pages/Challenges';
import SharePoster from '@/pages/SharePoster';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/record" element={<RecordActivity />} />
        <Route path="/share/:id" element={<SharePoster />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/routes" element={<RouteExplorer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/challenges" element={<Challenges />} />
        </Route>
      </Routes>
    </Router>
  );
}
