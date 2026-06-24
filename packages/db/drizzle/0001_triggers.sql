-- Function to enforce append-only behavior
CREATE OR REPLACE FUNCTION enforce_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'This table is append-only. Updates and deletes are forbidden.';
END;
$$ LANGUAGE plpgsql;

-- Apply append-only to audit_logs
CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only();

-- Apply append-only to review_issues
CREATE TRIGGER review_issues_append_only
BEFORE UPDATE OR DELETE ON review_issues
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only();

-- Apply append-only to review_issue_events
CREATE TRIGGER review_issue_events_append_only
BEFORE UPDATE OR DELETE ON review_issue_events
FOR EACH ROW
EXECUTE FUNCTION enforce_append_only();

-- Function to enforce PRD immutability on core fields
CREATE OR REPLACE FUNCTION enforce_prd_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.title IS DISTINCT FROM OLD.title OR NEW.content IS DISTINCT FROM OLD.content OR NEW.version IS DISTINCT FROM OLD.version THEN
        RAISE EXCEPTION 'PRD core content (title, content, version) is immutable. Updates are only allowed on the status field. Insert a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply PRD immutability
CREATE TRIGGER prds_immutability
BEFORE UPDATE ON prds
FOR EACH ROW
EXECUTE FUNCTION enforce_prd_immutability();