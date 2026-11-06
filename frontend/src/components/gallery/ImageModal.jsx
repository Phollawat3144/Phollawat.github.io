// จุดประสงค์: แสดงภาพในหน้าต่างโมดัล พร้อมเครื่องมือดูภาพและจัดการรูปภาพ
import { useEffect, useState } from "react";
import {
    FiDownload,
    FiZoomIn,
    FiZoomOut,
    FiMaximize2,
    FiX
} from "react-icons/fi";

const ImageModal = ({
    images = [],
    currentIndex,
    setCurrentIndex,
    onClose,
    activityName = "คลังภาพกิจกรรม"
}) => {

    if (!images.length) return null;

    const currentImage = images[currentIndex];

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [scale, setScale] = useState(1);

    const buttonStyle = {
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.08)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: ".25s",
        fontSize: 22
    };

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const nextImage = () => {

        setScale(1);

        setCurrentIndex(prev =>
            prev === images.length - 1
                ? 0
                : prev + 1
        );

    };

    const prevImage = () => {

        if (currentIndex === 0) return;

        setScale(1);

        setCurrentIndex(prev => prev - 1);

    };

    const handleArrowHover = e => {
        e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
        e.currentTarget.style.background = "rgba(255,255,255,.18)";
    };

    const handleArrowLeave = e => {
        e.currentTarget.style.transform = "translateY(-50%) scale(1)";
        e.currentTarget.style.background = "rgba(255,255,255,.08)";
    };

    const zoomIn = () => {

        setScale(prev => Math.min(prev + 0.25, 5));

    };

    const zoomOut = () => {

        setScale(prev => Math.max(prev - 0.25, 1));

    };


    const toggleFullscreen = async () => {

        if (!document.fullscreenElement) {

            await document.documentElement.requestFullscreen();

        } else {

            await document.exitFullscreen();

        }

    };

    const downloadImage = async () => {

        try {

            const url =
                `http://localhost:5000${currentImage.image_path}`;

            const response = await fetch(url);

            const blob = await response.blob();

            const objectUrl =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = objectUrl;

            link.download =
                currentImage.image_path.split("/").pop();

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(objectUrl);

        } catch (err) {

            console.error(err);

        }

    };

    const handleHover = e => {

        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.background =
            "rgba(255,255,255,.18)";

    };

    const handleLeave = e => {

        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.background =
            "rgba(255,255,255,.08)";

    };
    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์
    useEffect(() => {

        const handleKeyDown = (e) => {

            switch (e.key) {

                case "Escape":

                    onClose();

                    break;

                case "ArrowRight":

                    nextImage();

                    break;

                case "ArrowLeft":

                    prevImage();

                    break;

                case "+":
                case "=":

                    zoomIn();

                    break;

                case "-":

                    zoomOut();

                    break;

                default:

                    if (e.key.toLowerCase() === "d") {

                        downloadImage();

                    }

                    if (e.key.toLowerCase() === "f") {

                        toggleFullscreen();

                    }

                    break;

            }

        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [currentIndex]);

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.92)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                zIndex: 9999
            }}
        >

            {/* Close Button */}

            <button
                onClick={(e) => {

                    e.stopPropagation();

                    onClose();

                }}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
                style={{
                    ...buttonStyle,
                    position: "fixed",
                    top: 22,
                    left: 22,
                    zIndex: 10020
                }}
            >
                <FiX size={28} />
            </button>

            {/* Header */}

            <div
                style={{
                    position: "fixed",
                    top: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    color: "#fff",
                    userSelect: "none",
                    zIndex: 10010
                }}
            >

                <h2
                    style={{
                        margin: 0,
                        fontSize: 24,
                        fontWeight: 700
                    }}
                >
                    {activityName}
                </h2>

                <div
                    style={{
                        marginTop: 8,
                        fontSize: 15,
                        opacity: .9
                    }}
                >
                    {currentIndex + 1} / {images.length}
                </div>

            </div>

            {/* Toolbar */}

            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "fixed",
                    top: 20,
                    right: 22,
                    display: "flex",
                    gap: 12,
                    zIndex: 10020
                }}
            >

                <button
                    style={buttonStyle}
                    onClick={downloadImage}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                    title="Download"
                >
                    <FiDownload />
                </button>

                <button
                    style={buttonStyle}
                    onClick={zoomIn}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                    title="Zoom In"
                >
                    <FiZoomIn />
                </button>

                <button
                    style={buttonStyle}
                    onClick={zoomOut}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                    title="Zoom Out"
                >
                    <FiZoomOut />
                </button>

                <button
                    style={buttonStyle}
                    onClick={toggleFullscreen}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                    title="Fullscreen"
                >
                    <FiMaximize2 />
                </button>

            </div>
            {/* Previous Button */}

            <button
                onClick={(e) => {

                    e.stopPropagation();

                    if (currentIndex > 0) prevImage();

                }}
                disabled={currentIndex === 0}
                style={{
                    position: "fixed",
                    left: 24,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.08)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    color: "#fff",
                    fontSize: 34,
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    opacity: currentIndex === 0 ? 0.35 : 1,
                    transition: ".25s",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10010
                }}
                onMouseEnter={handleArrowHover}
                onMouseLeave={handleArrowLeave}
            >
                ❮
            </button>

            {/* Next Button */}

            <button
                onClick={(e) => {

                    e.stopPropagation();

                    nextImage();

                }}
                style={{
                    position: "fixed",
                    right: 24,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.08)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    color: "#fff",
                    fontSize: 34,
                    cursor: "pointer",
                    transition: ".25s",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10010
                }}
                onMouseEnter={handleArrowHover}
                onMouseLeave={handleArrowLeave}
            >
                ❯
            </button>

            {/* Image */}

            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    height: "100%",
                    padding: "90px 120px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >

                <img
                    src={`http://localhost:5000${currentImage.image_path}`}
                    alt={`image-${currentIndex}`}
                    draggable={false}
                    loading="eager"
                    onDoubleClick={() => {

                        if (scale === 1) {

                            setScale(2);

                        } else {

                            setScale(1);

                        }

                    }}
                    style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: 14,
                        userSelect: "none",
                        transform: `scale(${scale})`,
                        transition:
                            "transform .25s ease",
                        cursor:
                            scale === 1
                                ? "zoom-in"
                                : "zoom-out",
                        boxShadow:
                            "0 30px 80px rgba(0,0,0,.45)"
                    }}
                />

            </div>

            <style>

                {`

                @media (max-width:768px){

                    img{

                        max-width:100% !important;

                        max-height:100% !important;

                    }

                }

                `}

            </style>

        </div>
    );
}

export default ImageModal;
