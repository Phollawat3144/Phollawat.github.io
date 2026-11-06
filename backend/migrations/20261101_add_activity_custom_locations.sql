CREATE TABLE IF NOT EXISTS activity_custom_locations (
    custom_location_id INT(11) NOT NULL AUTO_INCREMENT,
    activity_id INT(11) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (custom_location_id),
    KEY idx_activity_custom_locations_activity (activity_id, sort_order),
    CONSTRAINT fk_activity_custom_locations_activity
        FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
        ON DELETE CASCADE
);
