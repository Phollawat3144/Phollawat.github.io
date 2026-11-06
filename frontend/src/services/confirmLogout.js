// จุดประสงค์: ยืนยันการออกจากระบบและดำเนินการล้างสถานะบัญชี
import Swal from "sweetalert2";
import api from "./api";

// ขั้นตอนยืนยันและดำเนินการออกจากระบบ
const confirmLogout = async (navigate) => {
    const result = await Swal.fire({
        title: "ยืนยันออกจากระบบ?",
        text: "คุณต้องการออกจากระบบหรือไม่",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ออกจากระบบ",
        cancelButtonText: "ยกเลิก",
        reverseButtons: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d"
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        await api.post("/auth/logout");
    } catch (error) {
        console.error("Logout API request failed:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login", { replace: true });
};

export default confirmLogout;
