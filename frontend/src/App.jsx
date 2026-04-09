import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import ProtectedRoute from './components/ProtectedRoute';
import SocketWrapper from './context/SocketWrapper';

// Page imports
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TeamManagement from './pages/admin/TeamManagement';
import AgentApprovals from './pages/admin/AgentApprovals';
import JobManagement from './pages/admin/JobManagement';
import ReferralQueue from './pages/admin/ReferralQueue';
import FinancialDashboard from './pages/admin/FinancialDashboard';
import KYCManagement from './pages/admin/KYCManagement';
import IncentiveDashboard from './pages/admin/IncentiveDashboard';
import ScriptManagement from './pages/admin/ScriptManagement';
import ManualReports from './pages/admin/ManualReports';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyAssignedCandidates from './pages/employee/MyAssignedCandidates';
import CandidatePipeline from './pages/employee/CandidatePipeline';
import IncentiveTracker from './pages/shared/IncentiveTracker';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AvailableJobs from './pages/agent/AvailableJobs';
import MyReferrals from './pages/agent/MyReferrals';
import Commissions from './pages/agent/Commissions';
import KYCSubmission from './pages/agent/KYCSubmission';
import CandidatePipeline from './pages/employee/CandidatePipeline';

// Team Leader Pages
import TeamLeaderDashboard from './pages/team_leader/TeamLeaderDashboard';

// Shared Pages
import DashboardOverview from './pages/shared/DashboardOverview';
import ATSResumeTracker from './pages/shared/ATSResumeTracker';
import ProfilePage from './pages/shared/ProfilePage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <SocketWrapper>
            <Toaster position="top-center" richColors theme="dark" />
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />}>
                    <Route path="dashboard" element={<DashboardOverview />} />
                    <Route path="team" element={<TeamManagement />} />
                    <Route path="approvals" element={<AgentApprovals />} />
                    <Route path="jobs" element={<JobManagement />} />
                    <Route path="referrals" element={<ReferralQueue />} />
                    <Route path="financials" element={<FinancialDashboard />} />
                    <Route path="kyc-management" element={<KYCManagement />} />
                    <Route path="incentives" element={<IncentiveDashboard />} />
                    <Route path="scripts" element={<ScriptManagement />} />
                    <Route path="ats-tracker" element={<ATSResumeTracker />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="incentive-tracker" element={<IncentiveTracker type="admin" />} />
                    <Route path="reports" element={<ManualReports />} />
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  </Route>
                </Route>
                
                {/* Employee Routes */}
                <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                  <Route path="/employee" element={<EmployeeDashboard />}>
                    <Route path="dashboard" element={<DashboardOverview />} />
                    <Route path="assigned-candidates" element={<MyAssignedCandidates />} />
                    <Route path="pipeline" element={<CandidatePipeline />} />
                    <Route path="jobs" element={<JobManagement />} />
                    <Route path="scripts" element={<ScriptManagement />} />
                    <Route path="incentives" element={<IncentiveTracker type="employee" />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route index element={<Navigate to="/employee/dashboard" replace />} />
                  </Route>
                </Route>
                
                {/* Agent Routes */}
                <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
                  <Route path="/agent" element={<AgentDashboard />}>
                    <Route path="dashboard" element={<DashboardOverview />} />
                    <Route path="jobs" element={<AvailableJobs />} />
                    <Route path="pipeline" element={<CandidatePipeline />} />
                    <Route path="referrals" element={<MyReferrals />} />
                    <Route path="commissions" element={<Commissions />} />
                    <Route path="kyc" element={<KYCSubmission />} />
                    <Route path="incentives" element={<IncentiveTracker type="agent" />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route index element={<Navigate to="/agent/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Team Leader Routes */}
                <Route element={<ProtectedRoute allowedRoles={['team_leader']} />}>
                  <Route path="/team-leader" element={<TeamLeaderDashboard />}>
                    <Route path="dashboard" element={<DashboardOverview />} />
                    <Route path="team" element={<TeamManagement />} />
                    <Route path="pipeline" element={<CandidatePipeline />} />
                    <Route path="jobs" element={<JobManagement />} />
                    <Route path="ats-tracker" element={<ATSResumeTracker />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route index element={<Navigate to="/team-leader/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Root Redirection */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </SocketWrapper>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
