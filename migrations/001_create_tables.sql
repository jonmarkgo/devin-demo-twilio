CREATE TABLE customer_interactions (id SERIAL PRIMARY KEY, phone VARCHAR(20), complete BOOLEAN DEFAULT false, service_type INTEGER, notifications_enabled BOOLEAN DEFAULT false, responses JSONB);
