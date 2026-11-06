// จุดประสงค์: แสดงกราฟสรุปจำนวนกิจกรรมตามข้อมูลที่ได้รับ
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

function ActivityChart({ activities = [], monthlyData, title = "กิจกรรมรายเดือน", labels }) {

    const months = [
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
    ];

    const total = monthlyData || new Array(12).fill(0);

    if (!monthlyData) activities.forEach((item) => {

        if (!item.activity_date) return;

        const month = new Date(item.activity_date).getMonth();

        total[month]++;

    });

    const data = {

        labels: labels || months,

        datasets: [

            {

                    label: title,

                data: total,

                borderColor: "#006664",

                backgroundColor: "rgba(25,135,84,.18)",

                fill: true,

                tension: 0.45,

                pointRadius: 5,

                pointHoverRadius: 7,

                pointBackgroundColor: "#006664",

                borderWidth: 3

            }

        ]

    };

    const options = {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {

                display: true,

                position: "top"

            }

        },

        scales: {

            y: {

                beginAtZero: true,

                ticks: {

                    precision: 0,

                    stepSize: 1

                }

            }

        }

    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div className="card border-0 shadow-sm rounded-4">

            <div className="card-body">

                <h5 className="fw-bold mb-4" style={{ color: "#0f172a" }}>{title}</h5>

                <div style={{ height: "320px" }}>

                    <Line
                        data={data}
                        options={options}
                    />

                </div>

            </div>

        </div>

    );

}

export default ActivityChart;
