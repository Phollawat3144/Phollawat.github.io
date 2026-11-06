const fs = require("fs/promises");
const ExifParser = require("exif-parser");

const normalizeCoordinate = (value, reference, negativeReference, max) => {
    if (!Number.isFinite(value)) {
        return null;
    }

    const coordinate = reference === negativeReference
        ? -Math.abs(value)
        : Math.abs(value);

    return Math.abs(coordinate) <= max ? coordinate : null;
};

const formatExifTimestamp = (value) => {
    if (!Number.isFinite(value) || Math.abs(value) > 8640000000000) {
        return null;
    }

    return new Date(value * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
};

const readImageMetadata = async (filePath) => {
    const imageBuffer = await fs.readFile(filePath);
    const { tags } = ExifParser.create(imageBuffer).parse();

    const latitude = normalizeCoordinate(
        tags.GPSLatitude,
        tags.GPSLatitudeRef,
        "S",
        90
    );
    const longitude = normalizeCoordinate(
        tags.GPSLongitude,
        tags.GPSLongitudeRef,
        "W",
        180
    );

    return {
        latitude,
        longitude,
        captured_at: formatExifTimestamp(
            tags.DateTimeOriginal ?? tags.CreateDate
        )
    };
};

module.exports = readImageMetadata;
