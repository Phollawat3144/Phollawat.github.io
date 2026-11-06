// จุดประสงค์: กำหนดเส้นทางของแอป การป้องกันเส้นทาง และการเลือกเลย์เอาต์ตามกลุ่มผู้ใช้
import { Navigate, Route, Routes } from "react-router-dom";

// ===========================
// เลย์เอาต์
// ===========================
import MainLayout from "./layouts/MainLayout";
import MemberLayout from "./layouts/MemberLayout";

// ===========================
// เว็บไซต์สาธารณะ
// ===========================
import Home from "./pages/Home";
import ActivityMap from "./pages/ActivityMap";
import Gallery from "./pages/Gallery";
import GalleryDetail from "./pages/GalleryDetail";
import News from "./pages/News";
import Login from "./pages/Login";

// ===========================
// สมาชิก
// ===========================
import MemberDashboard from "./pages/Member/Dashboard";
import Profile from "./pages/Member/Profile";
import UploadActivity from "./pages/Member/UploadActivity";
import MemberGallery from "./pages/Member/Gallery";
import MemberGalleryDetail from "./pages/Member/GalleryDetail";

// ===========================
// ผู้ดูแลระบบ
// ===========================
import Dashboard from "./pages/admin/Dashboard";
import Activities from "./pages/admin/Activities";
import AddActivity from "./pages/admin/AddActivity";
import AdminGallery from "./pages/admin/Gallery";
import AdminGalleryDetail from "./pages/admin/GalleryDetail";
import AdminMembers from "./pages/admin/Members";
import Locations from "./pages/admin/Locations";
import AddLocation from "./pages/admin/AddLocation";
import AdminProfile from "./pages/admin/Profile";
import AdminLayout from "./layouts/AdminLayout";

// ===========================
// ตรวจสิทธิ์เส้นทางผู้ดูแลระบบ
// ===========================
function AdminRoute({ children }) {

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const user =
        JSON.parse(
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            "null"
        );

    const isSuperAdmin =
        user?.role === "admin" &&
        (user.adminLevel === "super_admin" || user.accountSource === "admins");

    if (!token || !isSuperAdmin) {
        if (token && user?.role === "admin") {
            return <Navigate to="/member/upload" replace />;
        }

        return <Navigate to="/login" replace />;

    }

    return children;

}

// ===========================
// ตรวจสิทธิ์เส้นทางสมาชิก
// ===========================
function MemberRoute({ children }) {

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const user =
        JSON.parse(
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            "null"
        );

    if (!token) {

        return <Navigate to="/login" replace />;

    }

    const isContentAdmin =
        user?.role === "admin" &&
        (user.adminLevel === "content_admin" ||
            (!user.adminLevel && user.accountSource === "users"));

    if (user?.role !== "member" && !isContentAdmin) {

        return <Navigate to="/dashboard" replace />;

    }

    return children;

}

// ===========================
// App
// ===========================
function App() {

    return (

        <Routes>
            {/* Website */}

            <Route
                path="/"
                element={
                    <MainLayout>
                        <Home />
                    </MainLayout>
                }
            />

            <Route
                path="/gallery"
                element={
                    <MainLayout>
                        <Gallery />
                    </MainLayout>
                }
            />

            <Route
                path="/activity-map"
                element={
                    <MainLayout>
                        <ActivityMap />
                    </MainLayout>
                }
            />

            <Route
                path="/gallery/:id"
                element={
                    <MainLayout>
                        <GalleryDetail />
                    </MainLayout>
                }
            />

            <Route
                path="/news"
                element={
                    <MainLayout>
                        <News />
                    </MainLayout>
                }
            />

            <Route
                path="/login"
                element={
                    <MainLayout hideFooter>
                        <Login />
                    </MainLayout>
                }
            />

            {/* Member */}

            <Route
                path="/member"
                element={
                    <MemberRoute>
                        <MemberLayout>
                            <MemberDashboard />
                        </MemberLayout>
                    </MemberRoute>
                }
            />

            <Route
                path="/member/profile"
                element={
                    <MemberRoute>
                        <MemberLayout>
                            <Profile />
                        </MemberLayout>
                    </MemberRoute>
                }
            />

            <Route
                path="/member/upload"
                element={
                    <MemberRoute>
                        <MemberLayout>
                            <UploadActivity />
                        </MemberLayout>
                    </MemberRoute>
                }
            />

            <Route
                path="/member/gallery"
                element={
                    <MemberRoute>
                        <MemberLayout>
                            <MemberGallery />
                        </MemberLayout>
                    </MemberRoute>
                }
            />

            <Route
                path="/member/gallery/:id"
                element={
                    <MemberRoute>
                        <MemberLayout>
                            <MemberGalleryDetail />
                        </MemberLayout>
                    </MemberRoute>
                }
            />

            {/* Admin */}

            <Route
                path="/dashboard"
                element={
                    <AdminRoute>
                        <Dashboard />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/gallery"
                element={
                    <AdminRoute>
                        <AdminGallery />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/gallery/:id"
                element={
                    <AdminRoute>
                        <AdminGalleryDetail />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/activities"
                element={
                    <AdminRoute>
                        <Activities />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/activities/new"
                element={
                    <AdminRoute>
                        <AddActivity />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/activities/edit/:id"
                element={
                    <AdminRoute>
                        <AddActivity />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/members"
                element={
                    <AdminRoute>
                        <AdminMembers />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/locations"
                element={
                    <AdminRoute>
                        <Locations />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/locations/new"
                element={
                    <AdminRoute>
                        <AddLocation />
                    </AdminRoute>
                }
            />

            <Route
                path="/dashboard/locations/edit/:id"
                element={
                    <AdminRoute>
                        <AddLocation />
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/profile"
                element={
                    <AdminRoute>
                        <AdminLayout>
                            <AdminProfile />
                        </AdminLayout>
                    </AdminRoute>
                }
            />

            {/* 404 */}

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>

    );

}

export default App;