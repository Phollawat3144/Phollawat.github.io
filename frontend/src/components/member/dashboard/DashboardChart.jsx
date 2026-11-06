// จุดประสงค์: แสดงกราฟสรุปข้อมูลกิจกรรมในแดชบอร์ดสมาชิก
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

function DashboardChart({ data = [] }) {

    const chartData = {

        labels: [

            "ม.ค.",
            "ก.พ.",
            "มี.ค.",
            "เม.ย.",
            "พ.ค.",
            "มิ.ย.",
            "ก.ค.",
            "ส.ค.",
            "ก.ย.",
            "ต.ค.",
            "พ.ย.",
            "ธ.ค."

        ],

        datasets: [

            {

                label: "Uploads",

                data:

                    data.length
                        ? data
                        : [0,0,0,0,0,0,2,5,3,0,0,0],

                borderColor: "#006664",

                backgroundColor: "rgba(22,163,74,.15)",

                fill: true,

                tension: .45,

                pointRadius: 5

            }

        ]

    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div className="card shadow-sm border-0 rounded-4 h-100">

            <div className="card-header bg-white border-0">

                <h5 className="fw-bold">

                    กิจกรรมรายเดือน

                </h5>

            </div>

            <div className="card-body">

                <Line data={chartData} />

            </div>

        </div>

    );

}

export default DashboardChart;
