ALTER TABLE group_configs ADD COLUMN has_roles boolean DEFAULT false;

ALTER TABLE group_users
DROP CONSTRAINT group_users_pkey,
ADD PRIMARY KEY (group_id, user_id, group_role_id);

-- Insert role for group assessments that don't use group roles
INSERT INTO group_roles 
    (role_name, maximum)
VALUES
    ('No group roles', 99);
