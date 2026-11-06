CREATE TABLE IF NOT EXISTS activity_locations (
    activity_id INT(11) NOT NULL,
    location_id INT(11) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (activity_id, location_id),
    UNIQUE KEY uq_activity_locations_order (activity_id, sort_order),
    CONSTRAINT fk_activity_locations_activity
        FOREIGN KEY (activity_id) REFERENCES activities (activity_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_activity_locations_location
        FOREIGN KEY (location_id) REFERENCES locations (location_id)
        ON DELETE CASCADE
);

INSERT IGNORE INTO activity_locations (activity_id, location_id, sort_order)
SELECT activity_id, location_id, 0
FROM activities
WHERE location_id IS NOT NULL;
