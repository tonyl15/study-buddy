
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name := trim(NEW.display_name);
    NEW.display_name := regexp_replace(NEW.display_name, '<[^>]*>', '', 'g');
    IF length(NEW.display_name) < 1 THEN
      RAISE EXCEPTION 'Display name cannot be empty';
    END IF;
    IF length(NEW.display_name) > 50 THEN
      RAISE EXCEPTION 'Display name must be 50 characters or less';
    END IF;
    IF NEW.display_name !~ '^[a-zA-Z0-9 _.\-]+$' THEN
      RAISE EXCEPTION 'Display name contains invalid characters';
    END IF;
  END IF;

  IF NEW.avatar_url IS NOT NULL THEN
    NEW.avatar_url := trim(NEW.avatar_url);
    IF length(NEW.avatar_url) > 500 THEN
      RAISE EXCEPTION 'Avatar URL must be 500 characters or less';
    END IF;
    IF NEW.avatar_url !~ '^https://' THEN
      RAISE EXCEPTION 'Avatar URL must use HTTPS';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
