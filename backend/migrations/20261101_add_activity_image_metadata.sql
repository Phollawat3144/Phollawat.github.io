-- Store per-photo GPS coordinates and capture time from JPEG EXIF metadata.
ALTER TABLE activity_images
    ADD COLUMN latitude DECIMAL(10, 7) NULL,
    ADD COLUMN longitude DECIMAL(10, 7) NULL,
    ADD COLUMN captured_at DATETIME NULL;
