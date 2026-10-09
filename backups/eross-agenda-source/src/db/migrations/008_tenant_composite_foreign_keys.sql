-- QA reviewed migration: enforce tenant ownership at the database level.
-- Apply to isolated QA first; verify existing cross-tenant references are zero.
CREATE UNIQUE INDEX IF NOT EXISTS agenda_clients_company_id_id_uq ON agenda_clients(company_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS agenda_users_company_id_id_uq ON agenda_users(company_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS agenda_locations_company_id_id_uq ON agenda_locations(company_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS agenda_types_company_id_id_uq ON agenda_appointment_types(company_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS agenda_appointments_company_id_id_uq ON agenda_appointments(company_id,id);

ALTER TABLE agenda_appointments ADD CONSTRAINT agenda_appt_client_tenant_fk
 FOREIGN KEY(company_id,client_id) REFERENCES agenda_clients(company_id,id);
ALTER TABLE agenda_appointments ADD CONSTRAINT agenda_appt_user_tenant_fk
 FOREIGN KEY(company_id,responsible_user_id) REFERENCES agenda_users(company_id,id);
ALTER TABLE agenda_appointments ADD CONSTRAINT agenda_appt_location_tenant_fk
 FOREIGN KEY(company_id,location_id) REFERENCES agenda_locations(company_id,id);
ALTER TABLE agenda_appointments ADD CONSTRAINT agenda_appt_type_tenant_fk
 FOREIGN KEY(company_id,appointment_type_id) REFERENCES agenda_appointment_types(company_id,id);
ALTER TABLE agenda_appointment_events ADD CONSTRAINT agenda_event_appt_tenant_fk
 FOREIGN KEY(company_id,appointment_id) REFERENCES agenda_appointments(company_id,id);
ALTER TABLE agenda_integration_outbox ADD CONSTRAINT agenda_outbox_appt_tenant_fk
 FOREIGN KEY(company_id,appointment_id) REFERENCES agenda_appointments(company_id,id);
