-- ============================================================================
-- BASELINE SCHEMA — consolidated snapshot, replaces 67 incremental migration
-- files (2026-07-28 through 2026-10-03) that accumulated during development.
--
-- Generated 2026-10-06 via `pg_dump --schema-only --schema=public` against
-- Brandstrom X (BX)'s live database — the reference instance, verified fully
-- up to date and in sync with core/BX/CB at the time of this dump. This is
-- the actual live schema, not a hand-reconstruction from migration history,
-- so it reflects reality even where production drifted from what the old
-- migration files implied (a drift problem noted more than once in this
-- project's history).
--
-- Use this file to bootstrap a brand-new customer instance from scratch:
-- run it once against a fresh Supabase project's SQL Editor (or
-- `supabase db push` once linked), then set that project's own
-- system/config.js, supabase/config.toml project_id, and vercel.json favicon
-- per the fork-per-customer convention — those three files are the only
-- things that should ever differ between instances.
--
-- Does NOT include: auth/storage internal schemas (Supabase-managed), or
-- Edge Functions (supabase/functions/ deploys separately per project via
-- `supabase functions deploy`, not through migrations).
-- ============================================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."delete_auth_user_on_profile_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from auth.users where id = old.id;
  return old;
end;
$$;


ALTER FUNCTION "public"."delete_auth_user_on_profile_delete"() OWNER TO "postgres";



-- Added 2026-10-06 (see 20261006000002_force_logout_function.sql) — not
-- yet live on BX/CB at the time this baseline was dumped, folded in here
-- too so a brand-new instance starts correct from day one.
CREATE OR REPLACE FUNCTION "public"."fn_force_logout_user"("target_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  delete from auth.sessions where user_id = target_id;
end;
$$;


ALTER FUNCTION "public"."fn_force_logout_user"("uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_cascade_codename_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  delete from public.system_access where codename = old.codename;
  delete from public.b_account_setting where codename = old.codename;
  delete from public.b_finance_setting where codename = old.codename;
  delete from public.b_quest_member_role where codename = old.codename;
  delete from public.b_quest_member where codename = old.codename;
  return old;
end;
$$;


ALTER FUNCTION "public"."fn_cascade_codename_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_cascade_codename_rename"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.codename is distinct from old.codename and old.codename is not null then
    update public.system_access set codename = new.codename where codename = old.codename;
    update public.b_account_setting set codename = new.codename where codename = old.codename;
    update public.b_finance_setting set codename = new.codename where codename = old.codename;
    update public.b_quest_member set codename = new.codename where codename = old.codename;
    update public.b_quest_member_role set codename = new.codename where codename = old.codename;
    update public.b_quest_task_role set assign = new.codename where assign = old.codename;
    update public.b_quest_list set owner = new.codename where owner = old.codename;
    update public.b_account_list set create_by = new.codename where create_by = old.codename;
    update public.b_account_list set update_by = new.codename where update_by = old.codename;
    update public.b_opportunity_list set owner = new.codename where owner = old.codename;
    update public.b_opportunity_list set am = new.codename where am = old.codename;
    update public.b_opportunity_list set sub_am = new.codename where sub_am = old.codename;
    update public.b_opportunity_list set create_by = new.codename where create_by = old.codename;
    update public.b_opportunity_list set update_by = new.codename where update_by = old.codename;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."fn_cascade_codename_rename"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_finance_qt_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."fn_finance_qt_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_generate_opportunity_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE v_acct_num TEXT; v_seq INT;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.account_id));
    v_acct_num := SUBSTRING(NEW.account_id FROM 4);
    SELECT COALESCE(MAX((regexp_match(opportunity_id, '-(\d+)$'))[1]::int), 0) + 1
      INTO v_seq
      FROM b_opportunity_list
      WHERE account_id = NEW.account_id;
    NEW.opportunity_id := 'OP-' || v_acct_num || '-' || LPAD(v_seq::TEXT, 3, '0');
    RETURN NEW;
END; $_$;


ALTER FUNCTION "public"."fn_generate_opportunity_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_allow_new text;
  v_lock_enabled text;
  v_allowed_domains text;
begin
  select value into v_allow_new from public.system_setting where key = 'signup_allow_new';
  if v_allow_new = 'false' then
    raise exception 'Signups are currently closed. Please contact your administrator.';
  end if;

  select value into v_lock_enabled from public.system_setting where key = 'signup_domain_lock_enabled';
  if v_lock_enabled = 'true' then
    select value into v_allowed_domains from public.system_setting where key = 'signup_allowed_domains';
    if v_allowed_domains is not null and not (
      lower(split_part(new.email, '@', 2)) = any (
        string_to_array(lower(regexp_replace(v_allowed_domains, '\s', '', 'g')), ',')
      )
    ) then
      raise exception 'Your email domain is not allowed to register. Please contact your administrator.';
    end if;
  end if;

  insert into public.profiles (id, email, codename, employee_id, nick_name, full_name, department)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'codename',
    new.raw_user_meta_data ->> 'employee_id',
    new.raw_user_meta_data ->> 'nick_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'department'
  );
  return new;
exception
  when unique_violation then
    raise exception 'Employee ID or codename already registered';
end;
$$;


ALTER FUNCTION "public"."fn_handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_opp_status_change_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM public.fn_recompute_opp_totals(NEW.opportunity_id);
    RETURN NEW;
END; $$;


ALTER FUNCTION "public"."fn_opp_status_change_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_profiles_guard_self_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  is_admin boolean;
  expected_codename text;
begin
  select
    (p.level = 'god')
    or coalesce((
      select sa.system_setting
      from public.system_access sa
      where sa.codename = p.codename
    ), false)
  into is_admin
  from public.profiles p
  where p.id = auth.uid();

  if is_admin then
    return new;
  end if;

  if new.employee_id is distinct from old.employee_id then
    raise exception 'employee_id can only be changed by an administrator';
  end if;

  if new.level is distinct from old.level then
    raise exception 'level can only be changed by an administrator';
  end if;

  if new.codename is distinct from old.codename then
    expected_codename := case
      when old.employee_id is not null and btrim(old.employee_id) <> ''
        then btrim(new.nick_name) || ' (' || btrim(old.employee_id) || ')'
      else btrim(new.nick_name)
    end;

    if new.codename is distinct from expected_codename then
      raise exception 'codename can only change as a computed result of nick_name (self-edit)';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."fn_profiles_guard_self_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_recompute_opp_totals"("p_opp_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_status TEXT; v_type_filter TEXT;
BEGIN
    SELECT status INTO v_status FROM b_opportunity_list WHERE opportunity_id = p_opp_id;
    v_type_filter := CASE WHEN v_status = 'Churn' THEN 'churn' ELSE 'original' END;
    UPDATE b_opportunity_list SET
        total_amount = COALESCE((
            SELECT SUM(i.amount) FROM b_opportunity_qt_item i JOIN b_opportunity_qt q ON i.qt_id = q.qt_id
            WHERE q.opportunity_id = p_opp_id AND q.qt_type = v_type_filter
        ), 0),
        total_gp = COALESCE((
            SELECT SUM(i.gp) FROM b_opportunity_qt_item i JOIN b_opportunity_qt q ON i.qt_id = q.qt_id
            WHERE q.opportunity_id = p_opp_id AND q.qt_type = v_type_filter
        ), 0)
    WHERE opportunity_id = p_opp_id;
END; $$;


ALTER FUNCTION "public"."fn_recompute_opp_totals"("p_opp_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_set_update_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.update_date = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."fn_set_update_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_opp_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_opp_id TEXT;
BEGIN
    SELECT opportunity_id INTO v_opp_id FROM b_opportunity_qt WHERE qt_id = COALESCE(NEW.qt_id, OLD.qt_id);
    IF v_opp_id IS NOT NULL THEN
        PERFORM public.fn_recompute_opp_totals(v_opp_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END; $$;


ALTER FUNCTION "public"."fn_update_opp_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_account_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.account_id := 'AC-' || LPAD(nextval('b_account_id_seq')::text, 4, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_account_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, codename, employee_id, nick_name, full_name, department)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'codename',
    new.raw_user_meta_data->>'employee_id',
    new.raw_user_meta_data->>'nick_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'department'
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Employee ID or codename already registered';
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_system_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM setting_project sp
    JOIN profiles p ON p.codename = sp.codename
    WHERE p.id = auth.uid() AND sp.system_setting = true
  );
$$;


ALTER FUNCTION "public"."is_system_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_update_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.last_update = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_last_update_column"() OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."b_account_id_seq"
    START WITH 201
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."b_account_id_seq" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."b_account_list" (
    "account_id" "text" DEFAULT ('AC-'::"text" || "lpad"(("nextval"('"public"."b_account_id_seq"'::"regclass"))::"text", 4, '0'::"text")) NOT NULL,
    "account_name" "text",
    "company_name" "text",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "address" "text",
    "tax_id" "text",
    "contact" "text",
    "document" "text",
    "payment" "text",
    "remark" "text",
    "create_by" "text",
    "create_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "update_by" "text",
    "update_date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."b_account_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_account_setting" (
    "codename" "text" NOT NULL,
    "new" boolean DEFAULT false NOT NULL,
    "edit" boolean DEFAULT false NOT NULL,
    "delete" boolean DEFAULT false NOT NULL,
    "setting" boolean DEFAULT false NOT NULL,
    "dashboard" boolean DEFAULT false NOT NULL,
    "account" boolean DEFAULT false NOT NULL,
    "duplicate" boolean DEFAULT false NOT NULL,
    "share" boolean DEFAULT false NOT NULL,
    "member" boolean DEFAULT false NOT NULL,
    "edit_scope" "text" DEFAULT 'own'::"text" NOT NULL,
    "delete_scope" "text" DEFAULT 'own'::"text" NOT NULL,
    CONSTRAINT "b_account_setting_delete_scope_check" CHECK (("delete_scope" = ANY (ARRAY['own'::"text", 'all'::"text"]))),
    CONSTRAINT "b_account_setting_edit_scope_check" CHECK (("edit_scope" = ANY (ARRAY['own'::"text", 'all'::"text"])))
);


ALTER TABLE "public"."b_account_setting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_finance_qt" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "qt_id" "uuid" NOT NULL,
    "sub_index" integer DEFAULT 1 NOT NULL,
    "quotation_sub" "text",
    "invoice" "text",
    "actual_amount" numeric,
    "detail" "text",
    "bill_date" "date",
    "receipt_no" "text",
    "receipt_date" "date",
    "remark" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."b_finance_qt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_finance_setting" (
    "codename" "text" NOT NULL,
    "view" boolean DEFAULT false NOT NULL,
    "edit" boolean DEFAULT false NOT NULL,
    "setting" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."b_finance_setting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_opportunity_config" (
    "type" "text" NOT NULL,
    "value" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "color" "text",
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer NOT NULL
);


ALTER TABLE "public"."b_opportunity_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_opportunity_list" (
    "opportunity_id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "opportunity_name" "text",
    "status" "text" DEFAULT 'Active'::"text",
    "business_type" "text",
    "lead_source" "text",
    "owner" "text",
    "am" "text",
    "sub_am" "text",
    "launch_date" "date",
    "signed_date" "date",
    "materials" "text",
    "proposal" "text",
    "campaign" "text",
    "remark" "text",
    "total_amount" numeric DEFAULT 0,
    "total_gp" numeric DEFAULT 0,
    "create_by" "text",
    "create_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "update_by" "text",
    "update_date" timestamp with time zone NOT NULL,
    "churn_date" "date"
);


ALTER TABLE "public"."b_opportunity_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_opportunity_qt" (
    "qt_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "opportunity_id" "text" NOT NULL,
    "qt_number" "text",
    "company_qt" "text",
    "qt_type" "text" DEFAULT 'original'::"text"
);


ALTER TABLE "public"."b_opportunity_qt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_opportunity_qt_item" (
    "qt_id" "uuid" NOT NULL,
    "no" integer,
    "bu" "text",
    "detail" "text",
    "qty" numeric,
    "price" numeric,
    "discount" numeric DEFAULT 0,
    "gp" numeric,
    "item_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "amount" numeric GENERATED ALWAYS AS (GREATEST((0)::numeric, (("qty" * "price") - COALESCE("discount", (0)::numeric)))) STORED
);


ALTER TABLE "public"."b_opportunity_qt_item" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."bquest_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bquest_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_list" (
    "id" "text" DEFAULT ('BQ-'::"text" || "lpad"(("nextval"('"public"."bquest_id_seq"'::"regclass"))::"text", 4, '0'::"text")) NOT NULL,
    "account_name" "text",
    "opportunity_name" "text",
    "task_name" "text",
    "detail" "text",
    "link" "text",
    "publish_date" "date",
    "owner" "text",
    "create_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "last_update" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."b_quest_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_member" (
    "codename" "text" NOT NULL,
    "creative" boolean DEFAULT false NOT NULL,
    "designer" boolean DEFAULT false NOT NULL,
    "setting" boolean DEFAULT false NOT NULL,
    "permissions" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."b_quest_member" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_member_role" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codename" "text" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "new" boolean DEFAULT false NOT NULL,
    "edit" boolean DEFAULT false NOT NULL,
    "delete" boolean DEFAULT false NOT NULL,
    "assign" boolean DEFAULT false NOT NULL,
    "accept" boolean DEFAULT false NOT NULL,
    "edit_scope" "text" DEFAULT 'own'::"text" NOT NULL,
    "delete_scope" "text" DEFAULT 'own'::"text" NOT NULL
);


ALTER TABLE "public"."b_quest_member_role" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_role" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "icon" "text",
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer,
    "max_capacity" numeric
);


ALTER TABLE "public"."b_quest_role" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_setting" (
    "rule" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);


ALTER TABLE "public"."b_quest_setting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "sort_order" integer,
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."b_quest_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_task_role" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quest_id" "text" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "status_id" "uuid" NOT NULL,
    "status" "text",
    "work" "text",
    "type" "text",
    "deadline" "date",
    "weight" numeric,
    "day" "text",
    "max_per_day" numeric,
    "assign" "text"
);


ALTER TABLE "public"."b_quest_task_role" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer,
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."b_quest_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."b_quest_work" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text",
    "role_id" "uuid" NOT NULL,
    "work" "text" NOT NULL,
    "day" "text",
    "weight" numeric,
    "sort_order" integer,
    "max_per_day" numeric
);


ALTER TABLE "public"."b_quest_work" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."holiday" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "date_from" "date" NOT NULL,
    "date_to" "date" NOT NULL,
    "description" "text",
    "day_type" "text" DEFAULT 'full'::"text" NOT NULL,
    CONSTRAINT "holiday_day_type_check" CHECK (("day_type" = ANY (ARRAY['full'::"text", 'half'::"text"])))
);


ALTER TABLE "public"."holiday" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "codename" "text",
    "employee_id" "text",
    "nick_name" "text",
    "full_name" "text",
    "email" "text",
    "department" "text",
    "level" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_access" (
    "codename" "text" NOT NULL,
    "bcommission" boolean DEFAULT false NOT NULL,
    "system_setting" boolean DEFAULT false NOT NULL,
    "system_holiday" boolean DEFAULT false NOT NULL,
    "system_member" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."system_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_department" (
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer NOT NULL
);


ALTER TABLE "public"."system_department" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_project" (
    "key" "text" NOT NULL,
    "sort_order" integer,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "label" "text",
    "icon" "text",
    CONSTRAINT "system_project_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'disabled'::"text", 'hidden'::"text"])))
);


ALTER TABLE "public"."system_project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_setting" (
    "key" "text" NOT NULL,
    "value" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_setting" OWNER TO "postgres";


ALTER TABLE ONLY "public"."b_account_setting"
    ADD CONSTRAINT "b-account-setting_pkey" PRIMARY KEY ("codename");



ALTER TABLE ONLY "public"."b_account_list"
    ADD CONSTRAINT "b_account_list_pkey" PRIMARY KEY ("account_id");



ALTER TABLE ONLY "public"."b_finance_qt"
    ADD CONSTRAINT "b_finance_qt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_finance_setting"
    ADD CONSTRAINT "b_finance_setting_pkey" PRIMARY KEY ("codename");



ALTER TABLE ONLY "public"."b_opportunity_config"
    ADD CONSTRAINT "b_opportunity_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_opportunity_config"
    ADD CONSTRAINT "b_opportunity_config_type_value_key" UNIQUE ("type", "value");



ALTER TABLE ONLY "public"."b_opportunity_list"
    ADD CONSTRAINT "b_opportunity_list_pkey" PRIMARY KEY ("opportunity_id");



ALTER TABLE ONLY "public"."b_opportunity_qt_item"
    ADD CONSTRAINT "b_opportunity_qt_item_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."b_opportunity_qt"
    ADD CONSTRAINT "b_opportunity_qt_pkey" PRIMARY KEY ("qt_id");



ALTER TABLE ONLY "public"."b_quest_setting"
    ADD CONSTRAINT "b_quest_config_pkey" PRIMARY KEY ("rule");



ALTER TABLE ONLY "public"."b_quest_list"
    ADD CONSTRAINT "b_quest_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_quest_member"
    ADD CONSTRAINT "b_quest_member_pkey" PRIMARY KEY ("codename");



ALTER TABLE ONLY "public"."b_quest_member_role"
    ADD CONSTRAINT "b_quest_member_role_codename_role_id_key" UNIQUE ("codename", "role_id");



ALTER TABLE ONLY "public"."b_quest_member_role"
    ADD CONSTRAINT "b_quest_member_role_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_quest_role"
    ADD CONSTRAINT "b_quest_role_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."b_quest_role"
    ADD CONSTRAINT "b_quest_role_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_quest_status"
    ADD CONSTRAINT "b_quest_status_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."b_quest_status"
    ADD CONSTRAINT "b_quest_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_quest_task_role"
    ADD CONSTRAINT "b_quest_task_role_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_quest_task_role"
    ADD CONSTRAINT "b_quest_task_role_quest_role_key" UNIQUE ("quest_id", "role_id");



ALTER TABLE ONLY "public"."b_quest_type"
    ADD CONSTRAINT "b_quest_type_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."b_quest_type"
    ADD CONSTRAINT "b_quest_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."b_quest_work"
    ADD CONSTRAINT "b_quest_work_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_department"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."holiday"
    ADD CONSTRAINT "holiday_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_codename_key" UNIQUE ("codename");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key1" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_employee_id_key1" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_access"
    ADD CONSTRAINT "setting_project_pkey" PRIMARY KEY ("codename");



ALTER TABLE ONLY "public"."system_setting"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."system_project"
    ADD CONSTRAINT "system_project_pkey" PRIMARY KEY ("key");



CREATE OR REPLACE TRIGGER "trg_b_account_update_date" BEFORE UPDATE ON "public"."b_account_list" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_update_date"();



CREATE OR REPLACE TRIGGER "trg_b_opportunity_update_date" BEFORE UPDATE ON "public"."b_opportunity_list" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_update_date"();



CREATE OR REPLACE TRIGGER "trg_delete_auth_user" AFTER DELETE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."delete_auth_user_on_profile_delete"();



CREATE OR REPLACE TRIGGER "trg_finance_qt_updated_at" BEFORE UPDATE ON "public"."b_finance_qt" FOR EACH ROW EXECUTE FUNCTION "public"."fn_finance_qt_updated_at"();



CREATE OR REPLACE TRIGGER "trg_generate_opportunity_id" BEFORE INSERT ON "public"."b_opportunity_list" FOR EACH ROW WHEN ((("new"."opportunity_id" IS NULL) OR ("new"."opportunity_id" = ''::"text"))) EXECUTE FUNCTION "public"."fn_generate_opportunity_id"();



CREATE OR REPLACE TRIGGER "trg_opp_status_change_totals" AFTER UPDATE OF "status" ON "public"."b_opportunity_list" FOR EACH ROW WHEN (("new"."status" IS DISTINCT FROM "old"."status")) EXECUTE FUNCTION "public"."fn_opp_status_change_totals"();



CREATE OR REPLACE TRIGGER "trg_profiles_cascade_codename" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."fn_cascade_codename_rename"();



CREATE OR REPLACE TRIGGER "trg_profiles_cascade_codename_delete" AFTER DELETE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."fn_cascade_codename_delete"();



CREATE OR REPLACE TRIGGER "trg_profiles_guard_self_update" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."fn_profiles_guard_self_update"();



CREATE OR REPLACE TRIGGER "trg_update_opp_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."b_opportunity_qt_item" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_opp_totals"();



ALTER TABLE ONLY "public"."b_finance_qt"
    ADD CONSTRAINT "b_finance_qt_qt_id_fkey" FOREIGN KEY ("qt_id") REFERENCES "public"."b_opportunity_qt"("qt_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."b_opportunity_list"
    ADD CONSTRAINT "b_opportunity_list_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."b_account_list"("account_id");



ALTER TABLE ONLY "public"."b_opportunity_qt_item"
    ADD CONSTRAINT "b_opportunity_qt_item_qt_id_fkey" FOREIGN KEY ("qt_id") REFERENCES "public"."b_opportunity_qt"("qt_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."b_opportunity_qt"
    ADD CONSTRAINT "b_opportunity_qt_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."b_opportunity_list"("opportunity_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."b_quest_member_role"
    ADD CONSTRAINT "b_quest_member_role_codename_fkey" FOREIGN KEY ("codename") REFERENCES "public"."b_quest_member"("codename") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."b_quest_member_role"
    ADD CONSTRAINT "b_quest_member_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."b_quest_role"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."b_quest_task_role"
    ADD CONSTRAINT "b_quest_task_role_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "public"."b_quest_list"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."b_quest_task_role"
    ADD CONSTRAINT "b_quest_task_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."b_quest_role"("id");



ALTER TABLE ONLY "public"."b_quest_task_role"
    ADD CONSTRAINT "b_quest_task_role_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."b_quest_status"("id");



ALTER TABLE ONLY "public"."b_quest_work"
    ADD CONSTRAINT "b_quest_work_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."b_quest_role"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey1" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."b_account_list" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_account_list_all_authenticated" ON "public"."b_account_list" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_account_setting" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_account_setting_all_authenticated" ON "public"."b_account_setting" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_finance_qt" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_finance_qt_all_authenticated" ON "public"."b_finance_qt" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_finance_setting" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_finance_setting_all_authenticated" ON "public"."b_finance_setting" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_opportunity_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_opportunity_config_all_authenticated" ON "public"."b_opportunity_config" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_opportunity_list" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_opportunity_list_all_authenticated" ON "public"."b_opportunity_list" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_opportunity_qt" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_opportunity_qt_all_authenticated" ON "public"."b_opportunity_qt" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_opportunity_qt_item" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_opportunity_qt_item_all_authenticated" ON "public"."b_opportunity_qt_item" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "b_quest_config_all_authenticated" ON "public"."b_quest_setting" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_list" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_list_all_authenticated" ON "public"."b_quest_list" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_member" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_member_all_authenticated" ON "public"."b_quest_member" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_member_role" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_member_role_all_authenticated" ON "public"."b_quest_member_role" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_role" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_role_all_authenticated" ON "public"."b_quest_role" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_setting" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."b_quest_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_status_all_authenticated" ON "public"."b_quest_status" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_task_role" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_task_role_all_authenticated" ON "public"."b_quest_task_role" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_type" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_type_all_authenticated" ON "public"."b_quest_type" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."b_quest_work" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "b_quest_work_all_authenticated" ON "public"."b_quest_work" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "departments_all_authenticated" ON "public"."system_department" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "departments_select_anon" ON "public"."system_department" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."holiday" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "holiday_all_authenticated" ON "public"."holiday" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_god_or_system_setting" ON "public"."profiles" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."level" = 'god'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."system_access" "sa"
     JOIN "public"."profiles" "p" ON (("p"."codename" = "sa"."codename")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("sa"."system_setting" = true))))));



CREATE POLICY "profiles_select_authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_update_god_or_system_setting" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."level" = 'god'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."system_access" "sa"
     JOIN "public"."profiles" "p" ON (("p"."codename" = "sa"."codename")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("sa"."system_setting" = true)))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."level" = 'god'::"text")))) OR (EXISTS ( SELECT 1
   FROM ("public"."system_access" "sa"
     JOIN "public"."profiles" "p" ON (("p"."codename" = "sa"."codename")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("sa"."system_setting" = true))))));



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "setting_project_all_authenticated" ON "public"."system_access" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."system_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_config_select_authenticated" ON "public"."system_setting" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "system_config_write_authenticated" ON "public"."system_setting" TO "authenticated" USING (true) WITH CHECK (true);



-- Added 2026-10-06 (see 20261006000001_system_setting_select_anon.sql) —
-- not yet live on BX/CB at the time this baseline was dumped, folded in
-- here too so a brand-new instance starts correct from day one instead of
-- inheriting the same gap.
CREATE POLICY "system_setting_select_anon" ON "public"."system_setting" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."system_department" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_project" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_project_all_authenticated" ON "public"."system_project" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."system_setting" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_auth_user_on_profile_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_auth_user_on_profile_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_auth_user_on_profile_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_cascade_codename_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_cascade_codename_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_cascade_codename_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_cascade_codename_rename"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_cascade_codename_rename"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_cascade_codename_rename"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_finance_qt_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_finance_qt_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_finance_qt_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_generate_opportunity_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_generate_opportunity_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_generate_opportunity_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_opp_status_change_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_opp_status_change_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_opp_status_change_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_profiles_guard_self_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_profiles_guard_self_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_profiles_guard_self_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_recompute_opp_totals"("p_opp_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_recompute_opp_totals"("p_opp_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_recompute_opp_totals"("p_opp_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_set_update_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_set_update_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_set_update_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_opp_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_opp_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_opp_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_account_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_account_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_account_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_system_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_system_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_system_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_update_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_update_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_update_column"() TO "service_role";



GRANT ALL ON SEQUENCE "public"."b_account_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."b_account_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."b_account_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."b_account_list" TO "anon";
GRANT ALL ON TABLE "public"."b_account_list" TO "authenticated";
GRANT ALL ON TABLE "public"."b_account_list" TO "service_role";



GRANT ALL ON TABLE "public"."b_account_setting" TO "anon";
GRANT ALL ON TABLE "public"."b_account_setting" TO "authenticated";
GRANT ALL ON TABLE "public"."b_account_setting" TO "service_role";



GRANT ALL ON TABLE "public"."b_finance_qt" TO "anon";
GRANT ALL ON TABLE "public"."b_finance_qt" TO "authenticated";
GRANT ALL ON TABLE "public"."b_finance_qt" TO "service_role";



GRANT ALL ON TABLE "public"."b_finance_setting" TO "anon";
GRANT ALL ON TABLE "public"."b_finance_setting" TO "authenticated";
GRANT ALL ON TABLE "public"."b_finance_setting" TO "service_role";



GRANT ALL ON TABLE "public"."b_opportunity_config" TO "anon";
GRANT ALL ON TABLE "public"."b_opportunity_config" TO "authenticated";
GRANT ALL ON TABLE "public"."b_opportunity_config" TO "service_role";



GRANT ALL ON TABLE "public"."b_opportunity_list" TO "anon";
GRANT ALL ON TABLE "public"."b_opportunity_list" TO "authenticated";
GRANT ALL ON TABLE "public"."b_opportunity_list" TO "service_role";



GRANT ALL ON TABLE "public"."b_opportunity_qt" TO "anon";
GRANT ALL ON TABLE "public"."b_opportunity_qt" TO "authenticated";
GRANT ALL ON TABLE "public"."b_opportunity_qt" TO "service_role";



GRANT ALL ON TABLE "public"."b_opportunity_qt_item" TO "anon";
GRANT ALL ON TABLE "public"."b_opportunity_qt_item" TO "authenticated";
GRANT ALL ON TABLE "public"."b_opportunity_qt_item" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bquest_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bquest_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bquest_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_list" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_list" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_list" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_member" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_member" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_member" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_member_role" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_member_role" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_member_role" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_role" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_role" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_role" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_setting" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_setting" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_setting" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_status" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_status" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_status" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_task_role" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_task_role" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_task_role" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_type" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_type" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_type" TO "service_role";



GRANT ALL ON TABLE "public"."b_quest_work" TO "anon";
GRANT ALL ON TABLE "public"."b_quest_work" TO "authenticated";
GRANT ALL ON TABLE "public"."b_quest_work" TO "service_role";



GRANT ALL ON TABLE "public"."holiday" TO "anon";
GRANT ALL ON TABLE "public"."holiday" TO "authenticated";
GRANT ALL ON TABLE "public"."holiday" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."system_access" TO "anon";
GRANT ALL ON TABLE "public"."system_access" TO "authenticated";
GRANT ALL ON TABLE "public"."system_access" TO "service_role";



GRANT ALL ON TABLE "public"."system_department" TO "anon";
GRANT ALL ON TABLE "public"."system_department" TO "authenticated";
GRANT ALL ON TABLE "public"."system_department" TO "service_role";



GRANT ALL ON TABLE "public"."system_project" TO "anon";
GRANT ALL ON TABLE "public"."system_project" TO "authenticated";
GRANT ALL ON TABLE "public"."system_project" TO "service_role";



GRANT ALL ON TABLE "public"."system_setting" TO "anon";
GRANT ALL ON TABLE "public"."system_setting" TO "authenticated";
GRANT ALL ON TABLE "public"."system_setting" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";









-- ============================================================================
-- auth.users trigger wiring — can't be captured by a `--schema public` dump
-- since it's attached to the auth schema's own users table, not a public
-- one. The functions it calls (fn_handle_new_user, below) ARE in the dump
-- above since they live in public; only the trigger attachment itself is
-- added here by hand, taken from 20260922000012_unify_signup_and_delete_auth_user.sql
-- (the last file to touch it) and verified consistent with the live
-- fn_handle_new_user() definition already present above.
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();
