create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "pgjwt" with schema "extensions";

create schema if not exists "pgmq";

create extension if not exists "pgmq" with schema "pgmq";

create extension if not exists "cube" with schema "public";

create extension if not exists "earthdistance" with schema "public";

create type "public"."couple_agreement_status" as enum ('PENDING', 'ACTIVE', 'DISPUTED', 'DISSOLVED', 'FORFEITED');

create type "public"."relationship_type" as enum ('man-woman', 'man-man', 'woman-woman');

create sequence "public"."apk_downloads_id_seq";

create sequence "public"."app_metrics_id_seq";

create sequence "public"."compatibility_scores_id_seq";

create sequence "public"."explicit_preferences_id_seq";

create sequence "public"."faq_items_id_seq";

create sequence "public"."notifications_id_seq";

create sequence "public"."subscribers_id_seq";

create sequence "public"."swinger_interests_id_seq";

create sequence "public"."user_explicit_preferences_id_seq";

create sequence "public"."user_interests_id_seq";

drop trigger if exists "trigger_update_app_metrics_updated_at" on "public"."app_metrics";

drop trigger if exists "career_applications_updated_at" on "public"."career_applications";

drop trigger if exists "trigger_chat_members_updated_at" on "public"."chat_members";

drop trigger if exists "trigger_update_clubs_updated_at" on "public"."clubs";

drop trigger if exists "trigger_update_consent_verifications_updated_at" on "public"."consent_verifications";

drop trigger if exists "trigger_update_event_participations_updated_at" on "public"."event_participations";

drop trigger if exists "trigger_update_images_updated_at" on "public"."images";

drop trigger if exists "trigger_update_invitation_statistics_updated_at" on "public"."invitation_statistics";

drop trigger if exists "moderator_requests_updated_at" on "public"."moderator_requests";

drop trigger if exists "trigger_update_nft_galleries_updated_at" on "public"."nft_galleries";

drop trigger if exists "trigger_update_nft_gallery_images_updated_at" on "public"."nft_gallery_images";

drop trigger if exists "trigger_update_profiles_updated_at" on "public"."profiles";

drop trigger if exists "trigger_update_roles_updated_at" on "public"."roles";

drop trigger if exists "trigger_update_sensitive_data_updated_at" on "public"."sensitive_data";

drop trigger if exists "trigger_update_summary_requests_updated_at" on "public"."summary_requests";

drop trigger if exists "trigger_update_token_analytics_updated_at" on "public"."token_analytics";

drop trigger if exists "trigger_update_user_device_tokens_updated_at" on "public"."user_device_tokens";

drop trigger if exists "trigger_update_user_suspensions_updated_at" on "public"."user_suspensions";

drop trigger if exists "trigger_update_user_themes_updated_at" on "public"."user_themes";

drop policy "users_can_insert_own_app_metrics" on "public"."app_metrics";

drop policy "users_can_update_own_app_metrics" on "public"."app_metrics";

drop policy "users_can_view_own_app_metrics" on "public"."app_metrics";

drop policy "Admins can update application status" on "public"."career_applications";

drop policy "Admins can view all applications" on "public"."career_applications";

drop policy "Users can insert their own applications" on "public"."career_applications";

drop policy "Users can update their own applications" on "public"."career_applications";

drop policy "Users can view their own applications" on "public"."career_applications";

drop policy "Owners can delete members" on "public"."chat_members";

drop policy "Users can delete themselves" on "public"."chat_members";

drop policy "Users can join public rooms or if invited" on "public"."chat_members";

drop policy "Users can update their own membership" on "public"."chat_members";

drop policy "Users can view chat members in their rooms" on "public"."chat_members";

drop policy "anyone_can_view_active_clubs" on "public"."clubs";

drop policy "authenticated_users_can_insert_clubs" on "public"."clubs";

drop policy "authenticated_users_can_update_own_clubs" on "public"."clubs";

drop policy "users_can_insert_own_consent_verifications" on "public"."consent_verifications";

drop policy "users_can_update_own_consent_verifications" on "public"."consent_verifications";

drop policy "users_can_view_own_consent_verifications" on "public"."consent_verifications";

drop policy "users_can_insert_own_participations" on "public"."event_participations";

drop policy "users_can_update_own_participations" on "public"."event_participations";

drop policy "users_can_view_own_participations" on "public"."event_participations";

drop policy "Users can delete gallery permissions they granted" on "public"."gallery_permissions";

drop policy "Users can insert gallery permissions they own" on "public"."gallery_permissions";

drop policy "Users can update gallery permissions they granted" on "public"."gallery_permissions";

drop policy "Users can view their gallery permissions" on "public"."gallery_permissions";

drop policy "users_can_delete_own_images" on "public"."images";

drop policy "users_can_insert_own_images" on "public"."images";

drop policy "users_can_update_own_images" on "public"."images";

drop policy "users_can_view_own_images" on "public"."images";

drop policy "users_can_insert_own_invitation_statistics" on "public"."invitation_statistics";

drop policy "users_can_update_own_invitation_statistics" on "public"."invitation_statistics";

drop policy "users_can_view_own_invitation_statistics" on "public"."invitation_statistics";

drop policy "Users can insert invitations they send" on "public"."invitations";

drop policy "Users can update invitations they receive" on "public"."invitations";

drop policy "Users can view their invitations" on "public"."invitations";

drop policy "authenticated_users_can_insert_moderation_logs" on "public"."moderation_logs";

drop policy "moderators_can_view_moderation_logs" on "public"."moderation_logs";

drop policy "Admins can update request status" on "public"."moderator_requests";

drop policy "Admins can view all requests" on "public"."moderator_requests";

drop policy "Users can insert their own requests" on "public"."moderator_requests";

drop policy "Users can update their own requests" on "public"."moderator_requests";

drop policy "Users can view their own requests" on "public"."moderator_requests";

drop policy "users_can_insert_own_nft_galleries" on "public"."nft_galleries";

drop policy "users_can_update_own_nft_galleries" on "public"."nft_galleries";

drop policy "users_can_view_own_nft_galleries" on "public"."nft_galleries";

drop policy "users_can_view_public_nft_galleries" on "public"."nft_galleries";

drop policy "users_can_insert_own_nft_gallery_images" on "public"."nft_gallery_images";

drop policy "users_can_update_own_nft_gallery_images" on "public"."nft_gallery_images";

drop policy "users_can_view_own_nft_gallery_images" on "public"."nft_gallery_images";

drop policy "performance_metrics_insert" on "public"."performance_metrics";

drop policy "performance_metrics_read_admin" on "public"."performance_metrics";

drop policy "performance_metrics_read_own" on "public"."performance_metrics";

drop policy "performance_metrics_update_admin" on "public"."performance_metrics";

drop policy "performance_metrics_update_own" on "public"."performance_metrics";

drop policy "users_can_view_own_security" on "public"."security";

drop policy "users_can_view_own_security_audit_log" on "public"."security_audit_log";

drop policy "users_can_view_own_security_audit_logs" on "public"."security_audit_logs";

drop policy "users_can_insert_own_sensitive_data" on "public"."sensitive_data";

drop policy "users_can_update_own_sensitive_data" on "public"."sensitive_data";

drop policy "users_can_view_own_sensitive_data" on "public"."sensitive_data";

drop policy "users_can_insert_own_summary_requests" on "public"."summary_requests";

drop policy "users_can_update_own_summary_requests" on "public"."summary_requests";

drop policy "users_can_view_own_summary_requests" on "public"."summary_requests";

drop policy "anyone_can_view_token_analytics" on "public"."token_analytics";

drop policy "authenticated_users_can_insert_token_analytics" on "public"."token_analytics";

drop policy "authenticated_users_can_update_token_analytics" on "public"."token_analytics";

drop policy "users_can_delete_own_device_tokens" on "public"."user_device_tokens";

drop policy "users_can_insert_own_device_tokens" on "public"."user_device_tokens";

drop policy "users_can_update_own_device_tokens" on "public"."user_device_tokens";

drop policy "users_can_view_own_device_tokens" on "public"."user_device_tokens";

drop policy "users_can_view_own_roles" on "public"."user_roles";

drop policy "authenticated_users_can_insert_user_suspensions" on "public"."user_suspensions";

drop policy "authenticated_users_can_update_user_suspensions" on "public"."user_suspensions";

drop policy "moderators_can_view_user_suspensions" on "public"."user_suspensions";

drop policy "users_can_insert_own_themes" on "public"."user_themes";

drop policy "users_can_update_own_themes" on "public"."user_themes";

drop policy if exists "users_can_view_own_themes" on "public"."user_themes";

drop policy if exists "Users can manage their own wallets" on "public"."user_wallets";

drop policy if exists "Users can update own wallet" on "public"."user_wallets";

drop policy if exists "Users can view own wallet" on "public"."user_wallets";

drop policy "Admins can manage banners" on "public"."banner_config";

drop policy "Users can create couple NFT requests" on "public"."couple_nft_requests";

drop policy "Users can insert couple requests for their wallets" on "public"."couple_nft_requests";

drop policy "Users can update couple requests involving their wallets" on "public"."couple_nft_requests";

drop policy "Users can view couple requests involving their wallets" on "public"."couple_nft_requests";

drop policy "Users can view their couple NFT requests" on "public"."couple_nft_requests";

drop policy "own_couple_nft_requests" on "public"."couple_nft_requests";

drop policy "Users can insert their own NFT staking" on "public"."nft_staking";

drop policy "Users can update their own NFT staking" on "public"."nft_staking";

drop policy "Users can view their own NFT staking" on "public"."nft_staking";

drop policy "own_nft_staking" on "public"."nft_staking";

drop policy "Users can update own notifications" on "public"."notifications";

drop policy "Users can view own notifications" on "public"."notifications";

drop policy "Demo users access demo profiles" on "public"."profiles";

drop policy "Real users access real profiles" on "public"."profiles";

drop policy "Users can insert their own token staking" on "public"."token_staking";

drop policy "Users can update their own token staking" on "public"."token_staking";

drop policy "Users can view their own token staking" on "public"."token_staking";

drop policy "own_token_staking" on "public"."token_staking";

drop policy "Users can insert NFTs for their wallets" on "public"."user_nfts";

drop policy "Users can view NFTs by wallet address" on "public"."user_nfts";

drop policy "Users can view their NFTs" on "public"."user_nfts";

drop policy "own_user_nfts" on "public"."user_nfts";

drop policy if exists "Users can insert their own wallets" on "public"."user_wallets";

drop policy if exists "Users can update their own wallets" on "public"."user_wallets";

drop policy if exists "Users can view their own wallets" on "public"."user_wallets";

revoke delete on table "public"."permissions" from "anon";

revoke insert on table "public"."permissions" from "anon";

revoke references on table "public"."permissions" from "anon";

revoke select on table "public"."permissions" from "anon";

revoke trigger on table "public"."permissions" from "anon";

revoke truncate on table "public"."permissions" from "anon";

revoke update on table "public"."permissions" from "anon";

revoke delete on table "public"."permissions" from "authenticated";

revoke insert on table "public"."permissions" from "authenticated";

revoke references on table "public"."permissions" from "authenticated";

revoke select on table "public"."permissions" from "authenticated";

revoke trigger on table "public"."permissions" from "authenticated";

revoke truncate on table "public"."permissions" from "authenticated";

revoke update on table "public"."permissions" from "authenticated";

revoke delete on table "public"."permissions" from "service_role";

revoke insert on table "public"."permissions" from "service_role";

revoke references on table "public"."permissions" from "service_role";

revoke select on table "public"."permissions" from "service_role";

revoke trigger on table "public"."permissions" from "service_role";

revoke truncate on table "public"."permissions" from "service_role";

revoke update on table "public"."permissions" from "service_role";

revoke delete on table "public"."role_permissions" from "anon";

revoke insert on table "public"."role_permissions" from "anon";

revoke references on table "public"."role_permissions" from "anon";

revoke select on table "public"."role_permissions" from "anon";

revoke trigger on table "public"."role_permissions" from "anon";

revoke truncate on table "public"."role_permissions" from "anon";

revoke update on table "public"."role_permissions" from "anon";

revoke delete on table "public"."role_permissions" from "authenticated";

revoke insert on table "public"."role_permissions" from "authenticated";

revoke references on table "public"."role_permissions" from "authenticated";

revoke select on table "public"."role_permissions" from "authenticated";

revoke trigger on table "public"."role_permissions" from "authenticated";

revoke truncate on table "public"."role_permissions" from "authenticated";

revoke update on table "public"."role_permissions" from "authenticated";

revoke delete on table "public"."role_permissions" from "service_role";

revoke insert on table "public"."role_permissions" from "service_role";

revoke references on table "public"."role_permissions" from "service_role";

revoke select on table "public"."role_permissions" from "service_role";

revoke trigger on table "public"."role_permissions" from "service_role";

revoke truncate on table "public"."role_permissions" from "service_role";

revoke update on table "public"."role_permissions" from "service_role";

revoke delete on table "public"."sensitive_data" from "anon";

revoke insert on table "public"."sensitive_data" from "anon";

revoke references on table "public"."sensitive_data" from "anon";

revoke select on table "public"."sensitive_data" from "anon";

revoke trigger on table "public"."sensitive_data" from "anon";

revoke truncate on table "public"."sensitive_data" from "anon";

revoke update on table "public"."sensitive_data" from "anon";

revoke delete on table "public"."sensitive_data" from "authenticated";

revoke insert on table "public"."sensitive_data" from "authenticated";

revoke references on table "public"."sensitive_data" from "authenticated";

revoke select on table "public"."sensitive_data" from "authenticated";

revoke trigger on table "public"."sensitive_data" from "authenticated";

revoke truncate on table "public"."sensitive_data" from "authenticated";

revoke update on table "public"."sensitive_data" from "authenticated";

revoke delete on table "public"."sensitive_data" from "service_role";

revoke insert on table "public"."sensitive_data" from "service_role";

revoke references on table "public"."sensitive_data" from "service_role";

revoke select on table "public"."sensitive_data" from "service_role";

revoke trigger on table "public"."sensitive_data" from "service_role";

revoke truncate on table "public"."sensitive_data" from "service_role";

revoke update on table "public"."sensitive_data" from "service_role";

alter table "public"."app_metrics" drop constraint "app_metrics_metric_type_check";

alter table "public"."app_metrics" drop constraint "app_metrics_user_id_fkey";

alter table "public"."chat_members" drop constraint "chat_members_chat_room_id_user_id_key";

alter table "public"."chat_summaries" drop constraint "chat_summaries_chat_room_id_fkey";

alter table "public"."couple_agreements" drop constraint "couple_agreements_couple_id_fkey";

alter table "public"."couple_disputes" drop constraint "couple_disputes_status_check";

alter table "public"."couple_events" drop constraint "couple_events_couple_id_fkey";

alter table "public"."couple_profile_likes" drop constraint "couple_profile_likes_from_couple_id_fkey";

alter table "public"."couple_profile_likes" drop constraint "couple_profile_likes_from_couple_id_to_couple_id_key";

alter table "public"."couple_profile_likes" drop constraint "couple_profile_likes_to_couple_id_fkey";

alter table "public"."daily_token_claims" drop constraint "daily_token_claims_token_type_check";

alter table "public"."daily_token_claims" drop constraint "daily_token_claims_unique_user_date_type";

alter table "public"."messages" drop constraint "messages_chat_room_id_fkey";

alter table "public"."nft_galleries" drop constraint "nft_galleries_nft_network_check";

alter table "public"."nft_gallery_images" drop constraint "nft_gallery_images_nft_network_check";

alter table "public"."nft_gallery_images" drop constraint "nft_gallery_images_user_id_fkey";

alter table "public"."permanent_bans" drop constraint "permanent_bans_combined_hash_key";

alter table "public"."permissions" drop constraint "permissions_name_key";

alter table "public"."profiles" drop constraint "profiles_user_id_key";

alter table "public"."referral_transactions" drop constraint "referral_transactions_referred_user_id_fkey";

alter table "public"."reports" drop constraint "reports_resolved_by_fkey";

alter table "public"."role_permissions" drop constraint "role_permissions_permission_id_fkey";

alter table "public"."role_permissions" drop constraint "role_permissions_role_id_fkey";

alter table "public"."role_permissions" drop constraint "role_permissions_role_id_permission_id_key";

alter table "public"."security_audit_logs" drop constraint if exists "security_audit_logs_event_type_check";

alter table "public"."security_audit_logs" drop constraint if exists "security_audit_logs_severity_check";

alter table "public"."user_roles" drop constraint "user_roles_assigned_by_fkey";

alter table "public"."worldid_verifications" drop constraint "worldid_verifications_world_id_key";

alter table "public"."app_logs" drop constraint "app_logs_user_id_fkey";

alter table "public"."blockchain_transactions" drop constraint "blockchain_transactions_status_check";

alter table "public"."career_applications" drop constraint "career_applications_status_check";

alter table "public"."chat_rooms" drop constraint "chat_rooms_created_by_fkey";

alter table "public"."clubs" drop constraint if exists "clubs_created_by_fkey";

alter table "public"."clubs" drop constraint if exists "clubs_verified_by_fkey";

alter table "public"."cmpx_purchases" drop constraint "cmpx_purchases_package_id_fkey";

alter table "public"."couple_nft_requests" drop constraint "couple_nft_requests_status_check";

alter table "public"."couple_profiles" drop constraint "couple_profiles_user_id_fkey";

alter table "public"."error_alerts" drop constraint "error_alerts_resolved_by_fkey";

alter table "public"."error_alerts" drop constraint "error_alerts_user_id_fkey";

alter table "public"."messages" drop constraint "messages_sender_id_fkey";

alter table "public"."moderators" drop constraint "moderators_created_by_fkey";

alter table "public"."monitoring_sessions" drop constraint "monitoring_sessions_user_id_fkey";

alter table "public"."nft_galleries" drop constraint "nft_galleries_profile_id_fkey";

alter table "public"."performance_metrics" drop constraint "performance_metrics_user_id_fkey";

alter table "public"."posts" drop constraint "posts_profile_id_fkey";

alter table "public"."reports" drop constraint "reports_reported_user_id_fkey";

alter table "public"."reports" drop constraint "reports_reporter_user_id_fkey";

alter table "public"."reports" drop constraint "reports_status_check";

alter table "public"."security" drop constraint if exists "security_user_id_fkey";

alter table "public"."stories" drop constraint "stories_user_id_fkey";

alter table "public"."story_comments" drop constraint "story_comments_parent_comment_id_fkey";

alter table "public"."two_factor_auth" drop constraint "two_factor_auth_method_check";

alter table "public"."user_nfts" drop constraint "user_nfts_rarity_check";

alter table "public"."user_roles" drop constraint "user_roles_role_check";

alter table "public"."web_vitals_history" drop constraint "web_vitals_history_user_id_fkey";

drop function if exists "public"."create_permanent_ban"(p_user_id uuid, p_canvas_hash text, p_combined_hash text, p_ban_reason text, p_banned_by uuid, p_severity text, p_evidence jsonb, p_worldid_nullifier_hash text);

drop function if exists "public"."is_demo_user"();

drop function if exists "public"."mark_user_offline"();

drop function if exists "public"."record_gallery_commission"(p_gallery_id uuid, p_creator_id uuid, p_transaction_type text, p_amount_cmpx numeric, p_commission_percentage numeric);

drop function if exists "public"."update_app_metrics_updated_at"();

drop function if exists "public"."update_career_applications_updated_at"();

drop function if exists "public"."update_chat_members_updated_at"();

drop function if exists "public"."update_clubs_updated_at"();

drop function if exists "public"."update_event_participations_updated_at"();

drop function if exists "public"."update_moderator_requests_updated_at"();

drop function if exists "public"."update_profiles_updated_at"();

drop function if exists "public"."update_roles_updated_at"();

drop function if exists "public"."update_sensitive_data_updated_at"();

drop function if exists "public"."update_summary_requests_updated_at"();

drop function if exists "public"."update_token_analytics_updated_at"();

drop function if exists "public"."update_user_device_tokens_updated_at"();

drop function if exists "public"."update_user_suspensions_updated_at"();

drop function if exists "public"."update_user_themes_updated_at"();

drop view if exists "public"."geographic_hotspots";

drop view if exists "public"."profiles_safe";

alter table "public"."permissions" drop constraint "permissions_pkey";

alter table "public"."role_permissions" drop constraint "role_permissions_pkey";

alter table "public"."sensitive_data" drop constraint "sensitive_data_pkey";

drop index if exists "public"."chat_members_chat_room_id_user_id_key";

drop index if exists "public"."couple_profile_likes_from_couple_id_to_couple_id_key";

drop index if exists "public"."daily_token_claims_unique_user_date_type";

drop index if exists "public"."idx_app_metrics_metric_name";

drop index if exists "public"."idx_app_metrics_timestamp";

drop index if exists "public"."idx_app_metrics_user_id";

drop index if exists "public"."idx_app_metrics_user_metric_timestamp";

drop index if exists "public"."idx_carear_applications_created_at";

drop index if exists "public"."idx_clubs_rating_average";

drop index if exists "public"."idx_consent_evidence_type";

drop index if exists "public"."idx_couple_profile_likes_from";

drop index if exists "public"."idx_couple_profile_likes_to";

drop index if exists "public"."idx_event_participations_participated_at";

drop index if exists "public"."idx_invitations_created_at";

drop index if exists "public"."idx_invitations_from_profile";

drop index if exists "public"."idx_invitations_status";

drop index if exists "public"."idx_invitations_to_profile";

drop index if exists "public"."idx_invitations_type";

drop index if exists "public"."idx_nft_galleries_minted_at";

drop index if exists "public"."idx_nft_gallery_images_sort_order";

drop index if exists "public"."idx_nft_gallery_images_user_id";

drop index if exists "public"."idx_notifications_user_read";

drop index if exists "public"."idx_permanent_bans_lifted_at";

drop index if exists "public"."idx_permissions_action";

drop index if exists "public"."idx_permissions_resource";

drop index if exists "public"."idx_role_permissions_permission_id";

drop index if exists "public"."idx_role_permissions_role_id";

drop index if exists "public"."idx_sensitive_data_data_type";

drop index if exists "public"."idx_sensitive_data_is_active";

drop index if exists "public"."idx_sensitive_data_sensitivity_level";

drop index if exists "public"."idx_sensitive_data_user_id";

drop index if exists "public"."idx_stories_location";

drop index if exists "public"."idx_summary_requests_chat_id";

drop index if exists "public"."idx_summary_requests_status";

drop index if exists "public"."idx_summary_requests_user_id";

drop index if exists "public"."idx_swinger_interests_interest";

drop index if exists "public"."idx_token_analytics_period_end";

drop index if exists "public"."idx_two_factor_auth_enabled";

drop index if exists "public"."idx_user_device_tokens_device_token";

drop index if exists "public"."idx_user_device_tokens_is_active";

drop index if exists "public"."idx_user_device_tokens_user_id";

drop index if exists "public"."idx_user_suspensions_suspended_at";

drop index if exists "public"."idx_user_suspensions_suspended_by";

drop index if exists "public"."idx_user_themes_theme_name";

drop index if exists "public"."permanent_bans_combined_hash_key";

drop index if exists "public"."permissions_name_key";

drop index if exists "public"."permissions_pkey";

drop index if exists "public"."profiles_user_id_key";

drop index if exists "public"."role_permissions_pkey";

drop index if exists "public"."role_permissions_role_id_permission_id_key";

drop index if exists "public"."sensitive_data_pkey";

drop index if exists "public"."worldid_verifications_world_id_key";

drop index if exists "public"."idx_clubs_location";

drop index if exists "public"."idx_consent_verifications_chat_id";

drop index if exists "public"."idx_couple_agreements_status";

drop index if exists "public"."idx_couple_disputes_agreement_id";

drop index if exists "public"."idx_couple_disputes_created_at";

drop index if exists "public"."idx_couple_disputes_deadline";

drop index if exists "public"."idx_couple_profiles_status";

drop index if exists "public"."idx_daily_token_claims_user_date";

drop index if exists "public"."idx_moderation_logs_created_at";

drop index if exists "public"."idx_moderation_logs_target_id";

drop index if exists "public"."idx_notifications_read";

drop index if exists "public"."idx_permanent_bans_banned_at";

drop index if exists "public"."idx_permanent_bans_combined_hash";

drop index if exists "public"."idx_profiles_age";

drop index if exists "public"."idx_profiles_s2_active";

drop index if exists "public"."idx_reports_content_type";

drop index if exists "public"."idx_reports_created_at";

drop index if exists "public"."idx_reports_status";

drop index if exists "public"."idx_roles_name";

drop index if exists "public"."idx_testnet_token_claims_wallet";

drop index if exists "public"."idx_token_analytics_created_at";

drop index if exists "public"."idx_token_transactions_created_at";

drop index if exists "public"."idx_virtual_events_start_time";

-- drop index if exists "public"."roles_name_key";
-- Nota: No se puede eliminar este índice porque es parte de la restricción UNIQUE roles_name_key
-- El índice se mantiene automáticamente por la restricción

drop table "public"."permissions";

drop table "public"."role_permissions";

drop table "public"."sensitive_data";


  create table "public"."ai_compatibility_scores" (
    "id" uuid not null default gen_random_uuid(),
    "user1_id" uuid not null,
    "user2_id" uuid not null,
    "ai_score" numeric(3,2),
    "legacy_score" numeric(3,2),
    "final_score" numeric(3,2) not null,
    "model_version" character varying(50) default 'v1-base'::character varying,
    "prediction_method" character varying(20),
    "confidence_score" numeric(3,2),
    "features" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."ai_compatibility_scores" enable row level security;


  create table "public"."ai_model_metrics" (
    "id" uuid not null default gen_random_uuid(),
    "model_version" character varying(50) not null,
    "predictions_count" integer default 0,
    "accuracy_score" numeric(5,4),
    "precision_score" numeric(5,4),
    "recall_score" numeric(5,4),
    "f1_score" numeric(5,4),
    "avg_prediction_time_ms" numeric(10,2),
    "cache_hit_rate" numeric(5,4),
    "error_rate" numeric(5,4),
    "match_rate" numeric(5,4),
    "conversation_rate" numeric(5,4),
    "satisfaction_score" numeric(3,2),
    "period_start" timestamp with time zone not null,
    "period_end" timestamp with time zone not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."ai_model_metrics" enable row level security;


  create table "public"."ai_prediction_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user1_id" uuid not null,
    "user2_id" uuid not null,
    "score" numeric(3,2) not null,
    "method" character varying(20) not null,
    "features" jsonb not null default '{}'::jsonb,
    "prediction_time_ms" integer,
    "cache_hit" boolean default false,
    "error_message" text,
    "fallback_used" boolean default false,
    "model_version" character varying(50),
    "timestamp" timestamp with time zone default now()
      );


alter table "public"."ai_prediction_logs" enable row level security;


  create table "public"."apk_downloads" (
    "id" integer not null default nextval('public.apk_downloads_id_seq'::regclass),
    "user_id" uuid,
    "ip_address" inet,
    "user_agent" text,
    "download_source" character varying(50) default 'direct'::character varying,
    "version" character varying(20),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."apk_downloads" enable row level security;


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "session_id" text,
    "ip_address" inet,
    "user_agent" text,
    "action_type" text not null,
    "resource_type" text,
    "resource_id" text,
    "action_description" text not null,
    "request_data" jsonb,
    "response_data" jsonb,
    "risk_level" text default 'low'::text,
    "fraud_score" numeric(3,2) default 0.0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."automation_rules" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "description" text,
    "trigger" character varying(100) not null,
    "conditions" jsonb not null default '{}'::jsonb,
    "actions" jsonb not null default '{}'::jsonb,
    "enabled" boolean default true,
    "priority" integer default 1,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid,
    "last_executed_at" timestamp with time zone,
    "execution_count" integer default 0
      );


alter table "public"."automation_rules" enable row level security;


  create table "public"."biometric_challenges" (
    "id" uuid not null default gen_random_uuid(),
    "challenge" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."biometric_challenges" enable row level security;


  create table "public"."biometric_credentials" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "credential_id" text not null,
    "public_key" bytea not null,
    "sign_count" bigint not null,
    "transports" text[],
    "created_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone
      );


alter table "public"."biometric_credentials" enable row level security;


  create table "public"."biometric_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "session_id" text not null,
    "session_type" text not null,
    "device_id" text,
    "credential_id" text,
    "public_key" text,
    "confidence" numeric(3,2),
    "success" boolean default false,
    "is_active" boolean default true,
    "expires_at" timestamp with time zone not null,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."biometric_sessions" enable row level security;


  create table "public"."blocked_ips" (
    "id" uuid not null default gen_random_uuid(),
    "ip_address" inet not null,
    "blocked_at" timestamp with time zone default now(),
    "duration" text not null,
    "reason" text not null,
    "blocked_by" text not null,
    "expires_at" timestamp with time zone,
    "is_active" boolean default true
      );


alter table "public"."blocked_ips" enable row level security;


  create table "public"."blocks" (
    "id" uuid not null default public.uuid_generate_v4(),
    "blocker_id" uuid not null,
    "blocked_id" uuid not null,
    "reason" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."blocks" enable row level security;


  create table "public"."chat_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "room_id" uuid,
    "invited_by" uuid,
    "invited_user" uuid,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."chat_invitations" enable row level security;


  create table "public"."chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "content" text not null,
    "message_type" text default 'text'::text,
    "room_id" uuid,
    "sender_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."chat_messages" enable row level security;


  create table "public"."club_checkins" (
    "id" uuid not null default gen_random_uuid(),
    "club_id" uuid not null,
    "user_id" uuid not null,
    "latitude" double precision not null,
    "longitude" double precision not null,
    "distance_meters" numeric(10,2) not null,
    "is_verified" boolean default false,
    "verified_at" timestamp with time zone,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."club_checkins" enable row level security;


  create table "public"."club_flyers" (
    "id" uuid not null default gen_random_uuid(),
    "club_id" uuid not null,
    "title" character varying(255) not null,
    "description" text,
    "image_url" text not null,
    "image_url_watermarked" text,
    "image_url_blurred" text,
    "event_date" timestamp with time zone,
    "event_end_date" timestamp with time zone,
    "is_active" boolean default true,
    "is_featured" boolean default false,
    "watermark_applied" boolean default false,
    "blur_applied" boolean default false,
    "ai_processing_status" text default 'pending'::text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid
      );


alter table "public"."club_flyers" enable row level security;


  create table if not exists "public"."club_reviews" (
    "id" uuid not null default gen_random_uuid(),
    "club_id" uuid not null,
    "user_id" uuid not null,
    "rating" integer not null,
    "title" character varying(255),
    "review_text" text not null,
    "has_verified_checkin" boolean default false,
    "checkin_id" uuid,
    "is_verified" boolean default false,
    "is_featured" boolean default false,
    "helpful_count" integer default 0,
    "images" jsonb default '[]'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."club_reviews" enable row level security;


  create table "public"."club_verifications" (
    "id" uuid not null default gen_random_uuid(),
    "club_id" uuid not null,
    "verified_by" uuid not null,
    "verification_type" text not null,
    "status" text not null default 'pending'::text,
    "documents" jsonb default '[]'::jsonb,
    "notes" text,
    "verified_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."club_verifications" enable row level security;


  create table "public"."comment_likes" (
    "id" uuid not null default gen_random_uuid(),
    "comment_id" uuid not null,
    "user_id" uuid not null,
    "profile_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."comment_likes" enable row level security;


  create table "public"."compatibility_scores" (
    "id" integer not null default nextval('public.compatibility_scores_id_seq'::regclass),
    "user1_id" uuid,
    "user2_id" uuid,
    "compatibility_score" numeric(3,2),
    "shared_interests" integer default 0,
    "total_interests" integer default 0,
    "last_calculated" timestamp with time zone default now()
      );


alter table "public"."compatibility_scores" enable row level security;


  create table "public"."content_moderation" (
    "id" uuid not null default gen_random_uuid(),
    "content_type" text not null,
    "content_id" uuid not null,
    "user_id" uuid,
    "moderator_id" uuid,
    "status" text not null default 'pending'::text,
    "reason" text,
    "ai_confidence" numeric(3,2),
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "reviewed_at" timestamp with time zone
      );


alter table "public"."content_moderation" enable row level security;


  create table "public"."couple_favorites" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid,
    "favorite_couple_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."couple_favorites" enable row level security;


  create table "public"."couple_gifts" (
    "id" uuid not null default gen_random_uuid(),
    "sender_couple_id" uuid,
    "receiver_couple_id" uuid,
    "gift_type" text not null,
    "gift_name" text not null,
    "gift_description" text,
    "gift_value" numeric(10,2),
    "is_delivered" boolean default false,
    "delivery_date" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."couple_gifts" enable row level security;


  create table "public"."couple_interactions" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid,
    "target_couple_id" uuid,
    "interaction_type" text not null,
    "created_at" timestamp with time zone default now(),
    "metadata" jsonb default '{}'::jsonb
      );


alter table "public"."couple_interactions" enable row level security;


  create table "public"."couple_matches" (
    "id" uuid not null default gen_random_uuid(),
    "couple1_id" uuid,
    "couple2_id" uuid,
    "match_score" numeric(3,2),
    "compatibility_factors" jsonb default '{}'::jsonb,
    "match_reasons" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "status" text not null
      );


alter table "public"."couple_matches" enable row level security;


  create table "public"."couple_messages" (
    "id" uuid not null default gen_random_uuid(),
    "sender_couple_id" uuid,
    "receiver_couple_id" uuid,
    "message" text not null,
    "message_type" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."couple_messages" enable row level security;


  create table "public"."couple_profile_matches" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "couple_profile1_id" uuid not null,
    "couple_profile2_id" uuid not null,
    "matched_at" timestamp with time zone default now(),
    "is_active" boolean default true,
    "last_interaction" timestamp with time zone
      );


alter table "public"."couple_profile_matches" enable row level security;


  create table "public"."couple_profile_reports" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "couple_profile_id" uuid not null,
    "reporter_profile_id" uuid not null,
    "reason" character varying(50) not null,
    "description" text,
    "status" character varying(20) default 'pending'::character varying,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "resolution_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."couple_profile_reports" enable row level security;


  create table "public"."couple_profile_views" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "couple_profile_id" uuid not null,
    "viewer_profile_id" uuid not null,
    "viewed_at" timestamp with time zone default now(),
    "viewed_date" date default CURRENT_DATE
      );


alter table "public"."couple_profile_views" enable row level security;


  create table "public"."couple_reports" (
    "id" uuid not null default gen_random_uuid(),
    "reporter_couple_id" uuid,
    "reported_couple_id" uuid,
    "report_reason" text not null,
    "report_description" text,
    "status" text not null,
    "created_at" timestamp with time zone default now(),
    "resolved_at" timestamp with time zone,
    "resolved_by" uuid
      );


alter table "public"."couple_reports" enable row level security;


  create table "public"."couple_statistics" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid,
    "date" date not null,
    "views" integer default 0,
    "likes" integer default 0,
    "matches" integer default 0,
    "messages" integer default 0,
    "events_created" integer default 0,
    "events_joined" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."couple_statistics" enable row level security;


  create table "public"."couple_verifications" (
    "id" uuid not null default gen_random_uuid(),
    "couple_id" uuid,
    "verification_type" text not null,
    "verification_status" text not null,
    "verification_data" jsonb default '{}'::jsonb,
    "verified_by" uuid,
    "created_at" timestamp with time zone default now(),
    "verified_at" timestamp with time zone
      );


alter table "public"."couple_verifications" enable row level security;


  create table "public"."explicit_preferences" (
    "id" integer not null default nextval('public.explicit_preferences_id_seq'::regclass),
    "name" character varying(100) not null,
    "category" character varying(50) not null,
    "description" text,
    "requires_verification" boolean default true,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."explicit_preferences" enable row level security;


  create table "public"."faq_items" (
    "id" integer not null default nextval('public.faq_items_id_seq'::regclass),
    "question" text not null,
    "answer" text not null,
    "category" character varying(50) default 'general'::character varying,
    "is_active" boolean default true,
    "order_index" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."faq_items" enable row level security;


  create table "public"."favorites" (
    "id" uuid not null default public.uuid_generate_v4(),
    "user_id" uuid not null,
    "target_id" uuid not null,
    "target_type" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."favorites" enable row level security;


  create table "public"."follows" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "follower_user_id" uuid not null,
    "following_user_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."follows" enable row level security;


  create table "public"."fraud_analysis" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "transaction_id" uuid,
    "is_fraudulent" boolean not null,
    "confidence" numeric(5,2) not null,
    "patterns" text[],
    "risk_factors" text[],
    "analysis_data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."fraud_analysis" enable row level security;


  create table "public"."gallery_access_requests" (
    "id" uuid not null default gen_random_uuid(),
    "requester_id" uuid,
    "requested_from" uuid,
    "status" text default 'pending'::text,
    "message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."gallery_access_requests" enable row level security;


  create table "public"."gallery_unlocks" (
    "user_id" uuid not null,
    "profile_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."gallery_unlocks" enable row level security;


  create table "public"."image_metadata" (
    "id" uuid not null default public.uuid_generate_v4(),
    "image_url" text not null,
    "width" integer,
    "height" integer,
    "size_bytes" bigint,
    "mime_type" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."image_metadata" enable row level security;


  create table "public"."image_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "image_id" uuid,
    "granted_to" uuid,
    "granted_by" uuid,
    "granted_at" timestamp with time zone default now()
      );


alter table "public"."image_permissions" enable row level security;


  create table "public"."investment_returns" (
    "id" uuid not null default gen_random_uuid(),
    "investment_id" uuid not null,
    "user_id" uuid not null,
    "return_amount_mxn" numeric(10,2) not null,
    "return_percentage" numeric(5,2) not null,
    "return_period_start" timestamp with time zone not null,
    "return_period_end" timestamp with time zone not null,
    "payment_status" text not null default 'pending'::text,
    "payment_date" timestamp with time zone,
    "payment_method" text,
    "stripe_payout_id" character varying(255),
    "status" text not null default 'pending'::text,
    "due_date" timestamp with time zone not null,
    "paid_at" timestamp with time zone,
    "metadata" jsonb default '{}'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."investment_returns" enable row level security;


  create table "public"."invitation_analytics" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "invitation_id" uuid not null,
    "event_type" character varying(30) not null,
    "event_data" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."invitation_analytics" enable row level security;


  create table "public"."invitation_responses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "invitation_id" uuid not null,
    "response_type" character varying(20) not null,
    "message" text,
    "counter_invitation_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."invitation_responses" enable row level security;


  create table "public"."likes" (
    "id" uuid not null default public.uuid_generate_v4(),
    "user_id" uuid not null,
    "target_id" uuid not null,
    "target_type" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."likes" enable row level security;


  create table "public"."match_interactions" (
    "id" uuid not null default gen_random_uuid(),
    "match_id" uuid,
    "user_id" uuid,
    "interaction_type" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."match_interactions" enable row level security;


  create table "public"."media" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "file_name" character varying(255) not null,
    "file_path" text not null,
    "file_url" text not null,
    "file_type" character varying(50) not null,
    "mime_type" character varying(100),
    "file_size" bigint,
    "width" integer,
    "height" integer,
    "duration" integer,
    "thumbnail_url" text,
    "is_public" boolean default false,
    "is_verified" boolean default false,
    "metadata" jsonb default '{}'::jsonb,
    "tags" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."media" enable row level security;


  create table "public"."media_access_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "media_id" uuid,
    "access_type" text not null,
    "accessed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "action" character varying(20)
      );


alter table "public"."media_access_logs" enable row level security;


  create table "public"."mfa_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "secret" text not null,
    "backup_codes" text[] not null default '{}'::text[],
    "enabled" boolean not null default false,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."mfa_settings" enable row level security;


  create table "public"."notification_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "notification_type" text not null,
    "title" text not null,
    "body" text not null,
    "data" jsonb default '{}'::jsonb,
    "delivery_method" text not null,
    "status" text default 'pending'::text,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."notification_history" enable row level security;


  create table "public"."notification_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "notification_type" text not null,
    "enabled" boolean default true,
    "delivery_method" text default 'push'::text,
    "settings" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."notification_preferences" enable row level security;


  create table "public"."pending_rewards" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "reward_type" text not null,
    "amount" integer not null,
    "token_type" text default 'CMPX'::text,
    "description" text not null,
    "expires_at" timestamp with time zone,
    "claimed" boolean not null default false,
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."pending_rewards" enable row level security;


  create table "public"."performance_logs" (
    "id" uuid not null default public.uuid_generate_v4(),
    "user_id" uuid,
    "metric_name" text not null,
    "metric_value" numeric,
    "url" text,
    "user_agent" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."performance_logs" enable row level security;


  create table "public"."post_comments" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "profile_id" uuid,
    "parent_comment_id" uuid,
    "content" text not null,
    "likes_count" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."post_comments" enable row level security;


  create table "public"."post_likes" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "profile_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."post_likes" enable row level security;


  create table "public"."post_shares" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "profile_id" uuid,
    "share_type" character varying(20) not null default 'share'::character varying,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."post_shares" enable row level security;


  create table "public"."premium_access" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "feature_id" text not null,
    "expires_at" timestamp with time zone not null,
    "purchased_at" timestamp with time zone not null default now(),
    "cost" numeric not null
      );


alter table "public"."premium_access" enable row level security;


  create table "public"."profile_cache" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "cached_data" jsonb not null,
    "cache_key" text not null,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."profile_cache" enable row level security;


  create table "public"."room_members" (
    "id" uuid not null default public.uuid_generate_v4(),
    "room_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone default now()
      );


alter table "public"."room_members" enable row level security;


  create table "public"."security_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "alert_type" text not null,
    "title" text not null,
    "message" text not null,
    "severity" text not null,
    "status" text not null,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" uuid,
    "resolved_at" timestamp with time zone,
    "resolved_by" uuid
      );


alter table "public"."security_alerts" enable row level security;


  create table "public"."security_configurations" (
    "id" uuid not null default gen_random_uuid(),
    "config_key" text not null,
    "config_value" jsonb not null,
    "description" text,
    "updated_at" timestamp with time zone default now(),
    "updated_by" uuid
      );


alter table "public"."security_configurations" enable row level security;


  create table "public"."security_flags" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "flag_type" character varying(50) not null,
    "severity" character varying(20) not null,
    "description" text not null,
    "confidence" integer not null,
    "metadata" jsonb default '{}'::jsonb,
    "is_resolved" boolean default false,
    "resolved_at" timestamp with time zone,
    "resolved_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."security_flags" enable row level security;


  create table "public"."sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "session_token" text not null,
    "device_info" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "user_agent" text,
    "expires_at" timestamp with time zone not null,
    "last_activity" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."sessions" enable row level security;


  create table "public"."story_reports" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "story_id" uuid not null,
    "reporter_user_id" uuid not null,
    "reason" character varying(20) not null,
    "description" text,
    "status" character varying(20) default 'pending'::character varying,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "resolution_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."story_reports" enable row level security;


  create table "public"."stripe_events" (
    "id" uuid not null default gen_random_uuid(),
    "stripe_event_id" character varying(255) not null,
    "event_type" text not null,
    "event_data" jsonb not null,
    "processed" boolean default false,
    "processed_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."stripe_events" enable row level security;


  create table "public"."subscribers" (
    "id" integer not null default nextval('public.subscribers_id_seq'::regclass),
    "email" character varying(255) not null,
    "user_id" uuid,
    "stripe_customer_id" character varying(255),
    "subscribed" boolean default false,
    "subscription_tier" character varying(50) default 'basic'::character varying,
    "subscription_end" timestamp with time zone,
    "is_trialing" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."subscribers" enable row level security;


  create table "public"."subscriptions" (
    "id" uuid not null default public.uuid_generate_v4(),
    "user_id" uuid not null,
    "plan_type" text not null,
    "status" text default 'active'::text,
    "started_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."subscriptions" enable row level security;


  create table "public"."summary_feedback" (
    "id" uuid not null default gen_random_uuid(),
    "summary_id" uuid not null,
    "user_id" uuid not null,
    "is_helpful" boolean not null,
    "feedback_text" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."summary_feedback" enable row level security;


  create table "public"."system_metrics" (
    "id" uuid not null default gen_random_uuid(),
    "metric_type" text not null,
    "metric_value" numeric(10,4) not null,
    "metric_unit" text not null default 'ms'::text,
    "metadata" jsonb default '{}'::jsonb,
    "recorded_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "metric_name" character varying(100)
      );


alter table "public"."system_metrics" enable row level security;


  create table "public"."threat_detections" (
    "id" uuid not null default gen_random_uuid(),
    "threat_id" text not null,
    "threat_type" text not null,
    "severity" text not null,
    "description" text not null,
    "affected_users" uuid[] default '{}'::uuid[],
    "detected_at" timestamp with time zone default now(),
    "status" text not null,
    "mitigation_actions" text[] default '{}'::text[],
    "confidence" numeric(3,2),
    "resolved_at" timestamp with time zone,
    "resolved_by" uuid
      );


alter table "public"."threat_detections" enable row level security;


  create table "public"."tokens" (
    "id" uuid not null default gen_random_uuid(),
    "token_code" character varying(50) not null,
    "token_name" character varying(100) not null,
    "description" text,
    "base_value" numeric(10,2) default 0.00,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tokens" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "transaction_type" text not null,
    "token_type" text not null,
    "amount" integer not null,
    "balance_before" integer not null,
    "balance_after" integer not null,
    "description" text,
    "metadata" jsonb default '{}'::jsonb,
    "related_user_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."transactions" enable row level security;


  create table "public"."user_2fa_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "totp_secret" text,
    "totp_enabled" boolean not null default false,
    "totp_verified_at" timestamp with time zone,
    "backup_codes" text[],
    "backup_codes_used" integer not null default 0,
    "recovery_email" text,
    "recovery_phone" text,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_2fa_settings" enable row level security;


  create table "public"."user_activity" (
    "id" uuid not null default public.uuid_generate_v4(),
    "user_id" uuid not null,
    "activity_type" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_activity" enable row level security;


  create table "public"."user_explicit_preferences" (
    "id" integer not null default nextval('public.user_explicit_preferences_id_seq'::regclass),
    "user_id" uuid,
    "preference_id" integer,
    "privacy_level" character varying(20) default 'private'::character varying,
    "is_verified" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_explicit_preferences" enable row level security;


  create table "public"."user_likes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "liked_user_id" uuid,
    "liked" boolean not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_likes" enable row level security;


  create table "public"."user_notification_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "notification_type" text not null,
    "enabled" boolean not null default true,
    "delivery_method" text default 'push'::text,
    "settings" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_notification_preferences" enable row level security;


  create table "public"."user_sessions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "session_id" character varying(255) not null,
    "device_info" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "user_agent" text,
    "location" jsonb default '{}'::jsonb,
    "is_active" boolean default true,
    "last_activity" timestamp with time zone default now(),
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_sessions" enable row level security;


  create table "public"."user_staking" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "amount" integer not null,
    "start_date" timestamp with time zone not null default now(),
    "end_date" timestamp with time zone not null,
    "reward_percentage" numeric(5,2) not null default 10.00,
    "status" text default 'active'::text,
    "reward_claimed" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_staking" enable row level security;


  create table "public"."user_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "cmpx_balance" integer not null default 0,
    "gtk_balance" integer not null default 0,
    "cmpx_staked" integer not null default 0,
    "monthly_earned" integer not null default 0,
    "monthly_limit" integer not null default 500,
    "last_reset_date" timestamp with time zone not null default now(),
    "referral_code" text not null,
    "referred_by" uuid,
    "total_referrals" integer not null default 0,
    "world_id_verified" boolean not null default false,
    "world_id_claimed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_tokens" enable row level security;


  create table "public"."wallet_transactions" (
    "id" uuid not null default public.uuid_generate_v4(),
    "user_id" uuid not null,
    "wallet_address" text not null,
    "transaction_hash" text,
    "amount" numeric,
    "transaction_type" text,
    "status" text default 'pending'::text,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."wallet_transactions" enable row level security;


  create table "public"."worldid_rewards" (
    "id" uuid not null default gen_random_uuid(),
    "verification_id" uuid not null,
    "user_id" uuid not null,
    "reward_type" character varying(20) not null default 'cmpx'::character varying,
    "reward_amount" numeric(20,2) not null default 0,
    "claimed" boolean default false,
    "claimed_at" timestamp with time zone,
    "transaction_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."worldid_rewards" enable row level security;


  create table "public"."worldid_statistics" (
    "id" uuid not null default gen_random_uuid(),
    "period_start" timestamp with time zone not null,
    "period_end" timestamp with time zone not null,
    "total_verifications" integer default 0,
    "orb_verifications" integer default 0,
    "device_verifications" integer default 0,
    "total_rewards_distributed" numeric(20,2) default 0,
    "unique_users" integer default 0,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."worldid_statistics" enable row level security;

alter table "public"."app_logs" add column "context" jsonb;

alter table "public"."app_logs" add column "ip_address" inet;

alter table "public"."app_logs" add column "user_agent" text;

alter table "public"."app_logs" alter column "id" set default gen_random_uuid();

alter table "public"."app_logs" alter column "level" set default 'info'::text;

alter table "public"."app_logs" alter column "metadata" drop default;

alter table "public"."app_metrics" drop column "tags";

alter table "public"."app_metrics" drop column "timestamp";

alter table "public"."app_metrics" drop column "updated_at";

alter table "public"."app_metrics" drop column "user_id";

alter table "public"."app_metrics" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."app_metrics" add column "recorded_at" timestamp with time zone default now();

-- alter table "public"."app_metrics" alter column "id" set default nextval('public.app_metrics_id_seq'::regclass);
-- Nota: No se puede establecer un default de tipo bigint para una columna uuid

-- alter table "public"."app_metrics" alter column "id" set data type integer using "id"::integer;
-- Nota: No se puede cambiar el tipo de una columna uuid a integer

alter table "public"."app_metrics" alter column "metric_name" set data type character varying(100) using "metric_name"::character varying(100);

alter table "public"."app_metrics" alter column "metric_type" set default 'counter'::character varying;

alter table "public"."app_metrics" alter column "metric_type" drop not null;

alter table "public"."app_metrics" alter column "metric_type" set data type character varying(50) using "metric_type"::character varying(50);

alter table "public"."app_metrics" alter column "metric_value" set data type numeric(10,4) using "metric_value"::numeric(10,4);

alter table "public"."blockchain_transactions" alter column "from_address" set data type character varying(42) using "from_address"::character varying(42);

alter table "public"."blockchain_transactions" alter column "network" set default 'mumbai'::character varying;

alter table "public"."blockchain_transactions" alter column "network" set data type character varying(20) using "network"::character varying(20);

alter table "public"."blockchain_transactions" alter column "status" set default 'pending'::character varying;

alter table "public"."blockchain_transactions" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."blockchain_transactions" alter column "to_address" set data type character varying(42) using "to_address"::character varying(42);

alter table "public"."blockchain_transactions" alter column "transaction_type" set data type character varying(50) using "transaction_type"::character varying(50);

alter table "public"."career_applications" drop column "cover_letter";

alter table "public"."career_applications" drop column "email";

alter table "public"."career_applications" drop column "experience_years";

alter table "public"."career_applications" drop column "full_name";

alter table "public"."career_applications" drop column "linkedin_url";

alter table "public"."career_applications" drop column "phone";

alter table "public"."career_applications" drop column "position";

alter table "public"."career_applications" drop column "resume_url";

alter table "public"."career_applications" drop column "skills";

alter table "public"."career_applications" add column "correo" text not null;

alter table "public"."career_applications" add column "cv_url" text;

alter table "public"."career_applications" add column "domicilio" text;

alter table "public"."career_applications" add column "expectativas" text not null;

alter table "public"."career_applications" add column "experiencia" text not null;

alter table "public"."career_applications" add column "nombre" text not null;

alter table "public"."career_applications" add column "notes" text;

alter table "public"."career_applications" add column "puesto" text not null;

alter table "public"."career_applications" add column "referencias" text;

alter table "public"."career_applications" add column "reviewed_at" timestamp with time zone;

alter table "public"."career_applications" add column "reviewed_by" uuid;

alter table "public"."career_applications" add column "telefono" text not null;

alter table "public"."career_applications" add column "user_agent" text;

alter table "public"."chat_members" add column "profile_id" uuid;

alter table "public"."chat_members" add column "role" text default 'member'::text;

alter table "public"."chat_members" add column "room_id" uuid;

alter table "public"."chat_members" alter column "chat_room_id" drop not null;

alter table "public"."chat_members" alter column "id" set default gen_random_uuid();

alter table "public"."chat_members" alter column "user_id" drop not null;

alter table "public"."chat_rooms" add column "is_public" boolean default false;

alter table "public"."chat_rooms" add column "type" text default 'public'::text;

alter table "public"."chat_rooms" alter column "created_by" drop not null;

alter table "public"."chat_rooms" alter column "id" set default gen_random_uuid();

alter table "public"."chat_rooms" alter column "name" set not null;

alter table "public"."chat_rooms" alter column "participants" set default '{}'::uuid[];

alter table "public"."chat_rooms" alter column "participants" set data type text[] using "participants"::text[];

alter table "public"."chat_rooms" alter column "token_cost" set default 0;

alter table "public"."chat_summaries" drop column "chat_room_id";

alter table "public"."chat_summaries" drop column "key_points";

alter table "public"."chat_summaries" add column "chat_id" uuid not null;

alter table "public"."chat_summaries" add column "message_count" integer not null default 0;

alter table "public"."chat_summaries" add column "method" character varying(20);

alter table "public"."chat_summaries" add column "model_version" character varying(50) default 'v1'::character varying;

alter table "public"."chat_summaries" add column "sentiment" character varying(20);

alter table "public"."chat_summaries" add column "topics" jsonb default '[]'::jsonb;

alter table "public"."chat_summaries" add column "updated_at" timestamp with time zone default now();

alter table "public"."chat_summaries" alter column "id" set default gen_random_uuid();

alter table "public"."chat_summaries" alter column "summary" set not null;

alter table "public"."chat_summaries" enable row level security;

alter table "public"."clubs" add column if not exists "average_rating" numeric(3,2) default 0.0;

alter table "public"."clubs" alter column "city" set data type character varying(100) using "city"::character varying(100);

alter table "public"."clubs" alter column "country" set default 'México'::character varying;

alter table "public"."clubs" alter column "country" set data type character varying(100) using "country"::character varying(100);

alter table "public"."clubs" alter column "created_at" set not null;

alter table "public"."clubs" alter column "email" set data type character varying(255) using "email"::character varying(255);

alter table "public"."clubs" alter column "latitude" set data type double precision using "latitude"::double precision;

alter table "public"."clubs" alter column "longitude" set data type double precision using "longitude"::double precision;

alter table "public"."clubs" alter column "name" set data type character varying(255) using "name"::character varying(255);

alter table "public"."clubs" alter column "phone" set data type character varying(20) using "phone"::character varying(20);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'rating_average'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."clubs" ALTER COLUMN "rating_average" SET DEFAULT 0';
  END IF;
END $$;

alter table "public"."clubs" alter column "state" set data type character varying(100) using "state"::character varying(100);

alter table "public"."clubs" alter column "updated_at" set not null;

alter table "public"."clubs" alter column "website" set data type character varying(255) using "website"::character varying(255);

alter table "public"."cmpx_purchases" drop column "price_usd";

alter table "public"."cmpx_purchases" add column "completed_at" timestamp with time zone;

alter table "public"."cmpx_purchases" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."cmpx_purchases" add column "notes" text;

alter table "public"."cmpx_purchases" add column "payment_method" text;

alter table "public"."cmpx_purchases" add column "tokens_awarded" boolean default false;

alter table "public"."cmpx_purchases" add column "tokens_awarded_at" timestamp with time zone;

alter table "public"."cmpx_purchases" alter column "bonus_cmpx" set data type integer using "bonus_cmpx"::integer;

alter table "public"."cmpx_purchases" alter column "cmpx_amount" set data type integer using "cmpx_amount"::integer;

alter table "public"."cmpx_purchases" alter column "created_at" set not null;

alter table "public"."cmpx_purchases" alter column "package_id" drop not null;

alter table "public"."cmpx_purchases" alter column "payment_status" set default 'pending'::text;

alter table "public"."cmpx_purchases" alter column "payment_status" set not null;

alter table "public"."cmpx_purchases" alter column "payment_status" set data type text using "payment_status"::text;

alter table "public"."cmpx_purchases" alter column "price_mxn" set data type numeric(10,2) using "price_mxn"::numeric(10,2);

alter table "public"."cmpx_purchases" alter column "status" set default 'pending'::text;

alter table "public"."cmpx_purchases" alter column "status" set not null;

alter table "public"."cmpx_purchases" alter column "status" set data type text using "status"::text;

alter table "public"."cmpx_purchases" alter column "total_cmpx" set data type integer using "total_cmpx"::integer;

alter table "public"."cmpx_purchases" alter column "updated_at" set not null;

alter table "public"."cmpx_shop_packages" alter column "bonus_cmpx" set data type integer using "bonus_cmpx"::integer;

alter table "public"."cmpx_shop_packages" alter column "cmpx_amount" set data type integer using "cmpx_amount"::integer;

alter table "public"."cmpx_shop_packages" alter column "created_at" set not null;

alter table "public"."cmpx_shop_packages" alter column "display_order" set default 0;

alter table "public"."cmpx_shop_packages" alter column "price_mxn" set data type numeric(10,2) using "price_mxn"::numeric(10,2);

alter table "public"."cmpx_shop_packages" alter column "price_usd" set data type numeric(10,2) using "price_usd"::numeric(10,2);

alter table "public"."cmpx_shop_packages" alter column "updated_at" set not null;

alter table "public"."consent_verifications" add column "consent_level" text not null;

alter table "public"."consent_verifications" add column "explanation" text;

alter table "public"."consent_verifications" add column "message_id" uuid;

alter table "public"."consent_verifications" add column "recipient_id" uuid not null;

alter table "public"."consent_verifications" add column "requires_confirmation" boolean not null default true;

alter table "public"."consent_verifications" add column "suggested_action" text not null;

alter table "public"."consent_verifications" add column "verified" boolean not null default false;

alter table "public"."consent_verifications" add column "verified_at" timestamp with time zone;

alter table "public"."consent_verifications" alter column "chat_id" drop not null;

alter table "public"."consent_verifications" alter column "chat_id" set data type text using "chat_id"::text;

alter table "public"."consent_verifications" alter column "confidence" drop default;

alter table "public"."consent_verifications" alter column "confidence" set not null;

alter table "public"."consent_verifications" alter column "confidence" set data type integer using "confidence"::integer;

alter table "public"."consent_verifications" alter column "consent_score" drop default;

alter table "public"."consent_verifications" alter column "created_at" set not null;

alter table "public"."consent_verifications" alter column "status" drop default;

alter table "public"."consent_verifications" alter column "updated_at" set not null;

alter table "public"."consent_verifications" alter column "user_id1" drop not null;

alter table "public"."consent_verifications" alter column "user_id2" drop not null;

alter table "public"."couple_agreements" add column "dispute_started_at" timestamp with time zone;

alter table "public"."couple_agreements" add column "partner_1_ip" inet;

alter table "public"."couple_agreements" add column "partner_1_signed_at" timestamp with time zone;

alter table "public"."couple_agreements" add column "partner_2_ip" inet;

alter table "public"."couple_agreements" add column "partner_2_signed_at" timestamp with time zone;

alter table "public"."couple_agreements" alter column "asset_disposition_clause" set default 'ADMIN_FORFEIT'::text;

alter table "public"."couple_agreements" alter column "asset_disposition_clause" set not null;

alter table "public"."couple_agreements" alter column "created_at" set not null;

alter table "public"."couple_agreements" alter column "death_clause_text" set default 'En caso de disolución de la cuenta de pareja por conflicto no resuelto en 30 días, los activos digitales (Tokens/NFTs) no reclamados serán transferidos a la plataforma por concepto de "Gastos Administrativos de Cancelación" y la cuenta será eliminada.'::text;

alter table "public"."couple_agreements" alter column "death_clause_text" set not null;

alter table "public"."couple_agreements" alter column "id" set default gen_random_uuid();

alter table "public"."couple_agreements" alter column "updated_at" set not null;

alter table "public"."couple_disputes" add column "resolved_at" timestamp with time zone;

alter table "public"."couple_disputes" add column "resolved_by" uuid;

alter table "public"."couple_disputes" alter column "created_at" set not null;

alter table "public"."couple_disputes" alter column "deadline_at" drop default;

alter table "public"."couple_disputes" alter column "deadline_at" drop not null;

alter table "public"."couple_disputes" alter column "id" set default gen_random_uuid();

alter table "public"."couple_disputes" alter column "status" drop default;

alter table "public"."couple_disputes" alter column "status" drop not null;

alter table "public"."couple_disputes" alter column "updated_at" set not null;

alter table "public"."couple_events" drop column "event_name";

alter table "public"."couple_events" drop column "metadata";

alter table "public"."couple_events" add column "cmpx_reward" integer default 50;

alter table "public"."couple_events" add column "co2_saved" numeric(10,2) default 0;

alter table "public"."couple_events" add column "is_vip" boolean default false;

alter table "public"."couple_events" add column "organizer_id" uuid;

alter table "public"."couple_events" alter column "couple_id" drop not null;

alter table "public"."couple_events" alter column "date" set not null;

alter table "public"."couple_events" alter column "description" set not null;

alter table "public"."couple_events" alter column "event_type" drop default;

alter table "public"."couple_events" alter column "event_type" set not null;

alter table "public"."couple_events" alter column "event_type" set data type text using "event_type"::text;

alter table "public"."couple_events" alter column "id" set default gen_random_uuid();

alter table "public"."couple_events" alter column "is_public" set default true;

alter table "public"."couple_events" alter column "location" set not null;

alter table "public"."couple_events" alter column "max_participants" set default 10;

alter table "public"."couple_events" alter column "participants" set default '{}'::uuid[];

alter table "public"."couple_events" alter column "participants" set data type uuid[] using "participants"::uuid[];

alter table "public"."couple_events" enable row level security;

alter table "public"."couple_nft_requests" drop column "updated_at";

alter table "public"."couple_nft_requests" add column "transaction_hash" character varying(66);

alter table "public"."couple_nft_requests" alter column "expires_at" drop default;

alter table "public"."couple_nft_requests" alter column "initiator_address" set data type character varying(42) using "initiator_address"::character varying(42);

alter table "public"."couple_nft_requests" alter column "partner1_address" set data type character varying(42) using "partner1_address"::character varying(42);

alter table "public"."couple_nft_requests" alter column "partner2_address" set data type character varying(42) using "partner2_address"::character varying(42);

alter table "public"."couple_nft_requests" alter column "status" set default 'pending'::character varying;

alter table "public"."couple_nft_requests" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."couple_profile_likes" drop column "created_at";

alter table "public"."couple_profile_likes" drop column "from_couple_id";

alter table "public"."couple_profile_likes" drop column "to_couple_id";

alter table "public"."couple_profile_likes" add column "couple_profile_id" uuid not null;

alter table "public"."couple_profile_likes" add column "liked_at" timestamp with time zone default now();

alter table "public"."couple_profile_likes" add column "liker_profile_id" uuid not null;

alter table "public"."couple_profile_likes" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."couple_profiles" add column "avatar_url" text;

alter table "public"."couple_profiles" add column "bio" text;

alter table "public"."couple_profiles" add column "cover_url" text;

alter table "public"."couple_profiles" add column "is_active" boolean default true;

alter table "public"."couple_profiles" add column "is_verified" boolean default false;

alter table "public"."couple_profiles" add column "name" text;

alter table "public"."couple_profiles" add column "nickname" text;

alter table "public"."couple_profiles" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."couple_profiles" alter column "created_at" set not null;

alter table "public"."couple_profiles" alter column "id" set default gen_random_uuid();

alter table "public"."couple_profiles" alter column "location" set data type text using "location"::text;

alter table "public"."couple_profiles" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."couple_profiles" alter column "updated_at" set not null;

alter table "public"."digital_fingerprints" add column "banned_at" timestamp with time zone;

alter table "public"."digital_fingerprints" add column "browser_fingerprint" text;

alter table "public"."digital_fingerprints" add column "canvas_data" text;

alter table "public"."digital_fingerprints" add column "first_seen_at" timestamp with time zone not null default now();

alter table "public"."digital_fingerprints" add column "ip_address" inet;

alter table "public"."digital_fingerprints" add column "language" text;

alter table "public"."digital_fingerprints" add column "last_seen_at" timestamp with time zone not null default now();

alter table "public"."digital_fingerprints" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."digital_fingerprints" add column "platform" text;

alter table "public"."digital_fingerprints" add column "screen_resolution" text;

alter table "public"."digital_fingerprints" add column "seen_count" integer default 1;

alter table "public"."digital_fingerprints" add column "timezone" text;

alter table "public"."digital_fingerprints" add column "user_agent" text;

alter table "public"."digital_fingerprints" add column "worldid_nullifier_hash" character varying(255);

alter table "public"."digital_fingerprints" alter column "canvas_hash" set data type character varying(255) using "canvas_hash"::character varying(255);

alter table "public"."digital_fingerprints" alter column "combined_hash" set data type character varying(255) using "combined_hash"::character varying(255);

alter table "public"."digital_fingerprints" alter column "created_at" set not null;

alter table "public"."digital_fingerprints" alter column "id" set default gen_random_uuid();

alter table "public"."digital_fingerprints" alter column "updated_at" set not null;

alter table "public"."error_alerts" add column "timestamp" timestamp with time zone default now();

alter table "public"."error_alerts" alter column "category" set default 'unknown'::character varying;

alter table "public"."error_alerts" alter column "category" set data type character varying(50) using "category"::character varying(50);

alter table "public"."error_alerts" alter column "error_type" set default 'unknown'::text;

alter table "public"."error_alerts" alter column "id" set default gen_random_uuid();

alter table "public"."error_alerts" alter column "severity" set default 'medium'::character varying;

alter table "public"."error_alerts" alter column "severity" set data type character varying(20) using "severity"::character varying(20);

alter table "public"."event_participations" drop column "updated_at";

alter table "public"."event_participations" alter column "cmpx_rewarded" set default 50;

alter table "public"."event_participations" alter column "cmpx_rewarded" set not null;

alter table "public"."event_participations" alter column "co2_saved" set not null;

alter table "public"."event_participations" alter column "co2_saved" set data type numeric(10,2) using "co2_saved"::numeric(10,2);

alter table "public"."event_participations" alter column "created_at" set not null;

alter table "public"."event_participations" alter column "participated_at" set not null;

alter table "public"."frozen_assets" add column "asset_snapshot" jsonb;

alter table "public"."frozen_assets" add column "status" text default 'FROZEN'::text;

alter table "public"."frozen_assets" alter column "id" set default public.uuid_generate_v4();

alter table "public"."gallery_commissions" alter column "amount_cmpx" set data type integer using "amount_cmpx"::integer;

alter table "public"."gallery_commissions" alter column "commission_amount_cmpx" set data type integer using "commission_amount_cmpx"::integer;

alter table "public"."gallery_commissions" alter column "commission_percentage" set default 10.00;

alter table "public"."gallery_commissions" alter column "commission_percentage" set not null;

alter table "public"."gallery_commissions" alter column "commission_percentage" set data type numeric(5,2) using "commission_percentage"::numeric(5,2);

alter table "public"."gallery_commissions" alter column "created_at" set not null;

alter table "public"."gallery_commissions" alter column "creator_amount_cmpx" set data type integer using "creator_amount_cmpx"::integer;

alter table "public"."gallery_commissions" alter column "id" set default gen_random_uuid();

alter table "public"."gallery_commissions" alter column "metadata" set default '{}'::jsonb;

alter table "public"."gallery_commissions" alter column "updated_at" set not null;

alter table "public"."gallery_permissions" alter column "granted_by" drop default;

alter table "public"."gallery_permissions" alter column "granted_by" drop not null;

alter table "public"."gallery_permissions" alter column "granted_to" drop default;

alter table "public"."gallery_permissions" alter column "granted_to" drop not null;

alter table "public"."gallery_permissions" alter column "id" set default gen_random_uuid();

alter table "public"."gallery_permissions" alter column "permission_type" drop not null;

alter table "public"."images" add column "is_featured" boolean default false;

alter table "public"."images" add column "is_primary" boolean default false;

alter table "public"."images" add column "is_verified" boolean default false;

alter table "public"."images" add column "sort_order" integer default 0;

alter table "public"."images" add column "type" text default 'profile'::text;

alter table "public"."images" add column "uploaded_at" timestamp with time zone default now();

alter table "public"."images" alter column "is_public" set default true;

alter table "public"."images" alter column "profile_id" drop not null;

alter table "public"."investment_tiers" alter column "amount_mxn" set data type numeric(10,2) using "amount_mxn"::numeric(10,2);

alter table "public"."investment_tiers" alter column "cmpx_tokens_rewarded" set data type integer using "cmpx_tokens_rewarded"::integer;

alter table "public"."investment_tiers" alter column "created_at" set not null;

alter table "public"."investment_tiers" alter column "display_order" set default 0;

alter table "public"."investment_tiers" alter column "equity_percentage" set default 0;

alter table "public"."investment_tiers" alter column "equity_percentage" set data type numeric(5,4) using "equity_percentage"::numeric(5,4);

alter table "public"."investment_tiers" alter column "return_percentage" set default 10.00;

alter table "public"."investment_tiers" alter column "return_type" set default 'annual'::text;

alter table "public"."investment_tiers" alter column "return_type" set not null;

alter table "public"."investment_tiers" alter column "return_type" set data type text using "return_type"::text;

alter table "public"."investment_tiers" alter column "tier_key" set data type text using "tier_key"::text;

alter table "public"."investment_tiers" alter column "updated_at" set not null;

alter table "public"."investments" add column "currency" text default 'MXN'::text;

alter table "public"."investments" alter column "amount_mxn" set data type numeric(10,2) using "amount_mxn"::numeric(10,2);

alter table "public"."investments" alter column "amount_usd" set data type numeric(10,2) using "amount_usd"::numeric(10,2);

alter table "public"."investments" alter column "cmpx_tokens_rewarded" set default 0;

alter table "public"."investments" alter column "cmpx_tokens_rewarded" set data type integer using "cmpx_tokens_rewarded"::integer;

alter table "public"."investments" alter column "created_at" set not null;

alter table "public"."investments" alter column "equity_percentage" set default 0;

alter table "public"."investments" alter column "equity_percentage" set data type numeric(5,4) using "equity_percentage"::numeric(5,4);

alter table "public"."investments" alter column "payment_method" set data type text using "payment_method"::text;

alter table "public"."investments" alter column "payment_status" set default 'pending'::text;

alter table "public"."investments" alter column "payment_status" set not null;

alter table "public"."investments" alter column "payment_status" set data type text using "payment_status"::text;

alter table "public"."investments" alter column "return_percentage" set default 10.00;

alter table "public"."investments" alter column "return_type" set default 'annual'::text;

alter table "public"."investments" alter column "return_type" set not null;

alter table "public"."investments" alter column "return_type" set data type text using "return_type"::text;

alter table "public"."investments" alter column "status" set default 'pending'::text;

alter table "public"."investments" alter column "status" set not null;

alter table "public"."investments" alter column "status" set data type text using "status"::text;

alter table "public"."investments" alter column "tier" set data type text using "tier"::text;

alter table "public"."investments" alter column "updated_at" set not null;

alter table "public"."invitation_statistics" drop column "total_accepted";

alter table "public"."invitation_statistics" drop column "total_pending";

alter table "public"."invitation_statistics" drop column "total_rejected";

alter table "public"."invitation_statistics" drop column "total_sent";

alter table "public"."invitation_statistics" add column "acceptance_rate" numeric(5,2);

alter table "public"."invitation_statistics" add column "accepted_invitations" integer default 0;

alter table "public"."invitation_statistics" add column "declined_invitations" integer default 0;

alter table "public"."invitation_statistics" add column "expired_invitations" integer default 0;

alter table "public"."invitation_statistics" add column "metadata" jsonb;

alter table "public"."invitation_statistics" add column "pending_invitations" integer default 0;

alter table "public"."invitation_statistics" add column "period_end" timestamp with time zone not null;

alter table "public"."invitation_statistics" add column "period_start" timestamp with time zone not null;

alter table "public"."invitation_statistics" add column "total_invitations" integer default 0;

alter table "public"."invitation_templates" add column "created_by" uuid;

alter table "public"."invitation_templates" add column "is_active" boolean default true;

alter table "public"."invitation_templates" add column "updated_at" timestamp with time zone default now();

alter table "public"."invitation_templates" add column "usage_count" integer default 0;

alter table "public"."invitation_templates" add column "variables" jsonb default '{}'::jsonb;

alter table "public"."invitation_templates" alter column "invitation_type" set not null;

alter table "public"."invitation_templates" alter column "invitation_type" set data type character varying(20) using "invitation_type"::character varying(20);

alter table "public"."invitation_templates" alter column "template_content" set not null;

alter table "public"."invitation_templates" alter column "template_name" set not null;

alter table "public"."invitation_templates" alter column "template_name" set data type character varying(100) using "template_name"::character varying(100);

alter table "public"."invitations" drop column "decided_at";

alter table "public"."invitations" add column "inviter_id" uuid;

alter table "public"."invitations" alter column "type" set default 'connection'::text;

alter table "public"."matches" add column "compatibility_score" integer default 0;

alter table "public"."matches" add column "updated_at" timestamp with time zone default now();

alter table "public"."matches" add column "user_id_1" uuid;

alter table "public"."matches" add column "user_id_2" uuid;

alter table "public"."matches" alter column "status" set default 'active'::text;

alter table "public"."matches" alter column "user1_id" drop not null;

alter table "public"."matches" alter column "user2_id" drop not null;

alter table "public"."messages" drop column "chat_room_id";

alter table "public"."messages" drop column "edited_at";

alter table "public"."messages" drop column "is_edited";

alter table "public"."messages" drop column "media_url";

alter table "public"."messages" add column "room_id" uuid;

alter table "public"."messages" add column "updated_at" timestamp with time zone default now();

alter table "public"."messages" alter column "id" set default gen_random_uuid();

alter table "public"."messages" alter column "sender_id" drop not null;

alter table "public"."moderation_logs" drop column "action";

alter table "public"."moderation_logs" drop column "reason";

alter table "public"."moderation_logs" add column "action_type" text not null;

alter table "public"."moderation_logs" add column "description" text not null;

alter table "public"."moderation_logs" add column "new_state" jsonb;

alter table "public"."moderation_logs" add column "previous_state" jsonb;

alter table "public"."moderation_logs" add column "severity" character varying(20) default 'low'::character varying;

alter table "public"."moderation_logs" add column "target_user_id" uuid;

alter table "public"."moderation_logs" alter column "created_at" set not null;

alter table "public"."moderation_logs" alter column "metadata" set default '{}'::jsonb;

alter table "public"."moderation_logs" alter column "target_id" drop not null;

alter table "public"."moderation_logs" alter column "target_id" set data type text using "target_id"::text;

alter table "public"."moderator_payments" alter column "created_at" set not null;

alter table "public"."moderator_payments" alter column "moderator_level" set not null;

alter table "public"."moderator_payments" alter column "moderator_level" set data type text using "moderator_level"::text;

alter table "public"."moderator_payments" alter column "payment_amount_mxn" set data type numeric(10,2) using "payment_amount_mxn"::numeric(10,2);

alter table "public"."moderator_payments" alter column "payment_method" set default 'stripe'::text;

alter table "public"."moderator_payments" alter column "payment_method" set data type text using "payment_method"::text;

alter table "public"."moderator_payments" alter column "payment_status" set default 'pending'::text;

alter table "public"."moderator_payments" alter column "payment_status" set not null;

alter table "public"."moderator_payments" alter column "payment_status" set data type text using "payment_status"::text;

alter table "public"."moderator_payments" alter column "quality_score" set default 0;

alter table "public"."moderator_payments" alter column "total_revenue_mxn" set default 0;

alter table "public"."moderator_payments" alter column "total_revenue_mxn" set data type numeric(10,2) using "total_revenue_mxn"::numeric(10,2);

alter table "public"."moderator_payments" alter column "updated_at" set not null;

alter table "public"."moderator_requests" drop column "availability";

alter table "public"."moderator_requests" drop column "email";

alter table "public"."moderator_requests" drop column "experience";

alter table "public"."moderator_requests" drop column "full_name";

alter table "public"."moderator_requests" drop column "reason";

alter table "public"."moderator_requests" drop column "review_notes";

alter table "public"."moderator_requests" add column "acepta_terminos" boolean default false;

alter table "public"."moderator_requests" add column "correo" text not null;

alter table "public"."moderator_requests" add column "disponibilidad_horario" text not null;

alter table "public"."moderator_requests" add column "disponibilidad_horas" integer not null;

alter table "public"."moderator_requests" add column "edad" integer not null;

alter table "public"."moderator_requests" add column "experiencia_moderacion" text not null;

alter table "public"."moderator_requests" add column "motivacion" text not null;

alter table "public"."moderator_requests" add column "nombre" text not null;

alter table "public"."moderator_requests" add column "notes" text;

alter table "public"."moderator_requests" add column "referencias" text;

alter table "public"."moderator_requests" add column "rejection_reason" text;

alter table "public"."moderator_requests" add column "telefono" text not null;

alter table "public"."moderator_sessions" add column "created_at" timestamp with time zone not null default now();

alter table "public"."moderator_sessions" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."moderator_sessions" alter column "id" set default gen_random_uuid();

alter table "public"."moderator_sessions" alter column "session_start" set not null;

alter table "public"."moderator_sessions" alter column "updated_at" set not null;

alter table "public"."moderators" drop column "updated_at";

alter table "public"."moderators" alter column "is_active" set default true;

alter table "public"."moderators" alter column "level" set data type character varying(20) using "level"::character varying(20);

alter table "public"."moderators" alter column "moderator_id" set data type character varying(50) using "moderator_id"::character varying(50);

alter table "public"."moderators" alter column "permissions" set default '[]'::jsonb;

alter table "public"."moderators" alter column "role" set default 'moderator'::text;

alter table "public"."moderators" alter column "role" set data type text using "role"::text;

alter table "public"."moderators" alter column "status" set default 'pending'::text;

alter table "public"."moderators" alter column "status" set data type text using "status"::text;

alter table "public"."monitoring_sessions" drop column "duration_ms";

alter table "public"."monitoring_sessions" drop column "end_time";

alter table "public"."monitoring_sessions" drop column "metrics";

alter table "public"."monitoring_sessions" drop column "session_type";

alter table "public"."monitoring_sessions" drop column "start_time";

alter table "public"."monitoring_sessions" add column "duration_seconds" integer;

alter table "public"."monitoring_sessions" add column "ended_at" timestamp with time zone;

alter table "public"."monitoring_sessions" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."monitoring_sessions" add column "page_views" integer default 0;

alter table "public"."monitoring_sessions" add column "started_at" timestamp with time zone default now();

alter table "public"."monitoring_sessions" add column "total_errors" integer default 0;

alter table "public"."monitoring_sessions" add column "user_agent" text;

alter table "public"."monitoring_sessions" alter column "id" set default gen_random_uuid();

alter table "public"."monitoring_sessions" alter column "user_id" drop not null;

alter table "public"."nft_galleries" drop column "title";

alter table "public"."nft_galleries" add column "gallery_name" text not null;

alter table "public"."nft_galleries" alter column "created_at" set not null;

alter table "public"."nft_galleries" alter column "is_public" set not null;

alter table "public"."nft_galleries" alter column "is_verified" set not null;

alter table "public"."nft_galleries" alter column "nft_network" drop default;

alter table "public"."nft_galleries" alter column "updated_at" set not null;

alter table "public"."nft_gallery_images" drop column "user_id";

alter table "public"."nft_gallery_images" alter column "created_at" set not null;

alter table "public"."nft_gallery_images" alter column "is_verified" set not null;

alter table "public"."nft_gallery_images" alter column "nft_network" drop default;

alter table "public"."nft_gallery_images" alter column "sort_order" set not null;

alter table "public"."nft_gallery_images" alter column "updated_at" set not null;

alter table "public"."nft_staking" add column "unstaked_at" timestamp with time zone;

alter table "public"."nft_staking" alter column "last_claim_at" set default now();

alter table "public"."nft_staking" alter column "network" set default 'mumbai'::character varying;

alter table "public"."nft_staking" alter column "network" set data type character varying(20) using "network"::character varying(20);

alter table "public"."nft_staking" alter column "staking_contract" set data type character varying(42) using "staking_contract"::character varying(42);

alter table "public"."nft_staking" alter column "user_address" set data type character varying(42) using "user_address"::character varying(42);

alter table "public"."notifications" add column "is_read" boolean default false;

alter table "public"."notifications" add column "read_at" timestamp with time zone;

alter table "public"."notifications" alter column "data" set default '{}'::jsonb;

-- alter table "public"."notifications" alter column "id" set default nextval('public.notifications_id_seq'::regclass);
-- Nota: No se puede establecer un default de tipo bigint para una columna uuid

-- alter table "public"."notifications" alter column "id" set data type integer using "id"::integer;
-- Nota: No se puede cambiar el tipo de una columna uuid a integer

alter table "public"."notifications" alter column "title" set data type character varying(200) using "title"::character varying(200);

alter table "public"."notifications" alter column "type" set default 'info'::character varying;

alter table "public"."notifications" alter column "type" drop not null;

alter table "public"."notifications" alter column "type" set data type character varying(50) using "type"::character varying(50);

alter table "public"."performance_metrics" add column "timestamp" timestamp with time zone default now();

alter table "public"."performance_metrics" alter column "id" set default gen_random_uuid();

alter table "public"."performance_metrics" alter column "metric_name" set data type character varying(100) using "metric_name"::character varying(100);

alter table "public"."performance_metrics" alter column "session_id" set data type uuid using "session_id"::uuid;

alter table "public"."performance_metrics" alter column "unit" drop not null;

alter table "public"."performance_metrics" alter column "unit" set data type character varying(20) using "unit"::character varying(20);

alter table "public"."permanent_bans" drop column "details";

alter table "public"."permanent_bans" drop column "lift_reason";

alter table "public"."permanent_bans" drop column "lifted_at";

alter table "public"."permanent_bans" drop column "lifted_by";

alter table "public"."permanent_bans" add column "appeal_rejected_reason" text;

alter table "public"."permanent_bans" add column "appeal_requested" boolean default false;

alter table "public"."permanent_bans" add column "appeal_reviewed_at" timestamp with time zone;

alter table "public"."permanent_bans" add column "appeal_reviewed_by" uuid;

alter table "public"."permanent_bans" add column "ban_type" text not null;

alter table "public"."permanent_bans" add column "canvas_hash" character varying(255);

alter table "public"."permanent_bans" add column "evidence" jsonb default '{}'::jsonb;

alter table "public"."permanent_bans" add column "fingerprint_ids" uuid[] default '{}'::uuid[];

alter table "public"."permanent_bans" add column "is_active" boolean default true;

alter table "public"."permanent_bans" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."permanent_bans" add column "moderation_log_id" uuid;

alter table "public"."permanent_bans" add column "notes" text;

alter table "public"."permanent_bans" add column "severity" text not null;

alter table "public"."permanent_bans" add column "worldid_nullifier_hash" character varying(255);

alter table "public"."permanent_bans" alter column "ban_reason" set not null;

alter table "public"."permanent_bans" alter column "banned_at" set not null;

alter table "public"."permanent_bans" alter column "combined_hash" drop not null;

alter table "public"."permanent_bans" alter column "combined_hash" set data type character varying(255) using "combined_hash"::character varying(255);

alter table "public"."permanent_bans" alter column "created_at" set not null;

alter table "public"."permanent_bans" alter column "updated_at" set not null;

alter table "public"."posts" alter column "comments_count" set not null;

alter table "public"."posts" alter column "is_premium" set not null;

alter table "public"."posts" alter column "is_public" set not null;

alter table "public"."posts" alter column "likes_count" set not null;

alter table "public"."posts" alter column "location" set data type character varying(255) using "location"::character varying(255);

alter table "public"."posts" alter column "post_type" set not null;

alter table "public"."posts" alter column "post_type" set data type character varying(20) using "post_type"::character varying(20);

alter table "public"."posts" alter column "shares_count" set not null;

alter table "public"."profiles" add column if not exists "age_range_max" integer default 65;

alter table "public"."profiles" add column if not exists "age_range_min" integer default 18;

alter table "public"."profiles" add column if not exists "city" text;

alter table "public"."profiles" add column if not exists "id_verified" boolean default false;

alter table "public"."profiles" add column if not exists "id_verified_at" timestamp with time zone;

alter table "public"."profiles" add column if not exists "interested_in" text[];

alter table "public"."profiles" add column if not exists "is_active" boolean default true;

alter table "public"."profiles" add column if not exists "is_admin" boolean default false;

alter table "public"."profiles" add column if not exists "last_active" timestamp with time zone default now();

alter table "public"."profiles" add column if not exists "lifestyle_preferences" jsonb default '{}'::jsonb;

alter table "public"."profiles" add column if not exists "location_preferences" jsonb default '{}'::jsonb;

alter table "public"."profiles" add column if not exists "looking_for" text;

alter table "public"."profiles" add column if not exists "max_distance" integer default 50;

alter table "public"."profiles" add column if not exists "personality_traits" jsonb default '{}'::jsonb;

alter table "public"."profiles" add column if not exists "photo_verified" boolean default false;

alter table "public"."profiles" add column if not exists "photo_verified_at" timestamp with time zone;

alter table "public"."profiles" add column if not exists "pin_hash" text;

alter table "public"."profiles" add column if not exists "suspension_end_date" timestamp with time zone;

alter table "public"."profiles" add column if not exists "swinger_experience" text;

alter table "public"."profiles" add column if not exists "verification_level" text default 'none'::text;

alter table "public"."profiles" add column if not exists "warnings_count" integer default 0;

alter table "public"."profiles" add column if not exists "world_id_nullifier_hash" text;

alter table "public"."profiles" add column if not exists "world_id_verified_at" timestamp with time zone;

alter table "public"."profiles" alter column "account_type" set default 'single'::text;

alter table "public"."profiles" alter column "id" set default gen_random_uuid();

alter table "public"."profiles" alter column "is_demo" drop not null;

alter table "public"."profiles" alter column "name" set not null;

alter table "public"."profiles" alter column "name" set data type text using "name"::text;

-- alter table "public"."profiles" alter column "role" set default 'user'::text;
-- Nota: No se puede establecer un default de tipo text para una columna user_role (enum)

alter table "public"."profiles" alter column "role" set data type text using "role"::text;

alter table "public"."referral_rewards" drop column "profile_id";

alter table "public"."referral_rewards" add column "amount" numeric(10,2) not null default 0;

alter table "public"."referral_rewards" add column "claimed" boolean default false;

alter table "public"."referral_rewards" add column "claimed_at" timestamp with time zone;

alter table "public"."referral_rewards" add column "description" text;

alter table "public"."referral_rewards" add column "expires_at" timestamp with time zone;

alter table "public"."referral_rewards" add column "invited_id" uuid;

alter table "public"."referral_rewards" add column "invited_reward_amount" bigint default 0;

alter table "public"."referral_rewards" add column "inviter_id" uuid;

alter table "public"."referral_rewards" add column "inviter_reward_amount" bigint default 0;

alter table "public"."referral_rewards" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."referral_rewards" add column "processed_at" timestamp with time zone;

alter table "public"."referral_rewards" add column "referral_code" text not null;

alter table "public"."referral_rewards" add column "reward_type" text not null;

alter table "public"."referral_rewards" add column "status" character varying(20) default 'pending'::character varying;

alter table "public"."referral_rewards" add column "user_id" uuid;

alter table "public"."referral_rewards" enable row level security;

alter table "public"."referral_statistics" drop column "total_clicks";

alter table "public"."referral_statistics" drop column "total_conversions";

alter table "public"."referral_statistics" add column "last_invite_date" timestamp with time zone;

alter table "public"."referral_statistics" add column "monthly_earned" bigint not null default 0;

alter table "public"."referral_statistics" add column "period_end" date not null default (CURRENT_DATE + '1 mon'::interval);

alter table "public"."referral_statistics" add column "period_start" date not null default CURRENT_DATE;

alter table "public"."referral_statistics" add column "referral_code" character varying(20) not null;

alter table "public"."referral_statistics" add column "successful_invites" integer not null default 0;

alter table "public"."referral_statistics" add column "total_earned" bigint not null default 0;

alter table "public"."referral_statistics" add column "total_invites" integer not null default 0;

alter table "public"."referral_statistics" enable row level security;

alter table "public"."referral_transactions" drop column "referred_user_id";

alter table "public"."referral_transactions" drop column "status";

alter table "public"."referral_transactions" drop column "updated_at";

alter table "public"."referral_transactions" add column "referral_code" character varying(20);

alter table "public"."referral_transactions" add column "related_reward_id" uuid;

alter table "public"."referral_transactions" alter column "amount" set data type bigint using "amount"::bigint;

alter table "public"."referral_transactions" alter column "balance_after" set not null;

alter table "public"."referral_transactions" alter column "balance_after" set data type bigint using "balance_after"::bigint;

alter table "public"."referral_transactions" alter column "balance_before" set not null;

alter table "public"."referral_transactions" alter column "balance_before" set data type bigint using "balance_before"::bigint;

alter table "public"."referral_transactions" alter column "transaction_type" set data type character varying(30) using "transaction_type"::character varying(30);

alter table "public"."report_ai_classification" add column "human_notes" text;

alter table "public"."report_ai_classification" add column "human_override" boolean default false;

alter table "public"."report_ai_classification" add column "human_reviewed" boolean default false;

alter table "public"."report_ai_classification" add column "human_severity" text;

alter table "public"."report_ai_classification" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."report_ai_classification" add column "processing_time_ms" integer;

alter table "public"."report_ai_classification" alter column "ai_model_version" drop default;

alter table "public"."report_ai_classification" alter column "ai_model_version" set data type text using "ai_model_version"::text;

-- alter table "public"."report_ai_classification" alter column "ai_tags" set default '[]'::jsonb;
-- Nota: No se puede establecer un default de tipo jsonb para una columna text[]

-- alter table "public"."report_ai_classification" alter column "ai_tags" set data type jsonb using "ai_tags"::jsonb;
-- Nota: No se puede cambiar el tipo de una columna text[] a jsonb directamente

alter table "public"."report_ai_classification" alter column "created_at" set not null;

alter table "public"."report_ai_classification" alter column "id" set default gen_random_uuid();

alter table "public"."report_ai_classification" alter column "suggested_priority" set not null;

alter table "public"."report_ai_classification" alter column "updated_at" set not null;

alter table "public"."report_ai_classification" enable row level security;

alter table "public"."reports" drop column "resolved_at";

alter table "public"."reports" drop column "resolved_by";

alter table "public"."reports" add column "ai_classified" boolean default false;

alter table "public"."reports" add column "assigned_to" uuid;

alter table "public"."reports" add column "queue_position" integer;

alter table "public"."reports" add column "reviewing" text default 'pending'::text;

alter table "public"."reports" alter column "created_at" set not null;

alter table "public"."reports" alter column "report_type" drop default;

alter table "public"."reports" alter column "report_type" drop not null;

alter table "public"."reports" alter column "reported_user_id" set not null;

alter table "public"."reports" alter column "reporter_user_id" set not null;

alter table "public"."reports" alter column "updated_at" set not null;

alter table "public"."roles" add column "is_active" boolean not null default true;

alter table "public"."roles" alter column "created_at" set not null;

alter table "public"."roles" alter column "name" set data type text using "name"::text;

alter table "public"."roles" alter column "permissions" set not null;

alter table "public"."roles" alter column "updated_at" set not null;

alter table "public"."security" add column "location" jsonb;

alter table "public"."security" add column "resolved" boolean default false;

alter table "public"."security" add column "user_agent" text;

alter table "public"."security" alter column "created_at" set not null;

alter table "public"."security" alter column "ip_address" drop default;

alter table "public"."security" alter column "ip_address" set data type inet using "ip_address"::inet;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security'
      AND column_name = 'risk_level'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."security" ALTER COLUMN "risk_level" SET DEFAULT ''low''::text';
    EXECUTE 'ALTER TABLE "public"."security" ALTER COLUMN "risk_level" SET NOT NULL';
  END IF;
END $$;

alter table "public"."security" alter column "user_id" drop not null;

alter table "public"."security_audit_logs" drop column if exists "description";

alter table "public"."security_audit_logs" drop column if exists "event_type";

alter table "public"."security_audit_logs" drop column if exists "metadata";

alter table "public"."security_audit_logs" drop column if exists "resolved";

alter table "public"."security_audit_logs" drop column if exists "severity";

alter table "public"."security_audit_logs" add column if not exists "action" character varying(100);

alter table "public"."security_audit_logs" add column if not exists "details" jsonb;

alter table "public"."security_audit_logs" add column if not exists "resource" character varying(100);

alter table "public"."security_audit_logs" add column if not exists "risk_score" integer;

alter table "public"."security_audit_logs" add column if not exists "session_id" character varying(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security_audit_logs'
      AND column_name = 'action'
  ) THEN
    EXECUTE 'UPDATE "public"."security_audit_logs" SET "action" = ''unknown'' WHERE "action" IS NULL';
    EXECUTE 'ALTER TABLE "public"."security_audit_logs" ALTER COLUMN "action" SET DEFAULT ''unknown''';
    EXECUTE 'ALTER TABLE "public"."security_audit_logs" ALTER COLUMN "action" SET NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security_audit_logs'
      AND column_name = 'resource'
  ) THEN
    EXECUTE 'UPDATE "public"."security_audit_logs" SET "resource" = ''unknown'' WHERE "resource" IS NULL';
    EXECUTE 'ALTER TABLE "public"."security_audit_logs" ALTER COLUMN "resource" SET DEFAULT ''unknown''';
    EXECUTE 'ALTER TABLE "public"."security_audit_logs" ALTER COLUMN "resource" SET NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security_audit_logs'
      AND column_name = 'details'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."security_audit_logs" ALTER COLUMN "details" SET DEFAULT ''{}''::jsonb';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security_audit_logs'
      AND column_name = 'risk_score'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."security_audit_logs" ALTER COLUMN "risk_score" SET DEFAULT 0';
  END IF;
END $$;

alter table "public"."security_audit_logs" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."security_audit_logs" alter column "ip_address" set data type inet using "ip_address"::inet;

alter table "public"."security_events" drop column "status";

alter table "public"."security_events" add column "description" text not null;

alter table "public"."security_events" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."security_events" add column "resolved" boolean default false;

alter table "public"."security_events" add column "resolved_at" timestamp with time zone;

alter table "public"."security_events" add column "resolved_by" uuid;

alter table "public"."security_events" add column "severity" text not null;

alter table "public"."security_events" add column "timestamp" timestamp with time zone default now();

alter table "public"."security_events" alter column "id" set default gen_random_uuid();

alter table "public"."security_events" alter column "user_id" drop not null;

alter table "public"."security_logs" enable row level security;

alter table "public"."staking_records" drop column "reward_claimed";

alter table "public"."staking_records" drop column "reward_percentage";

alter table "public"."staking_records" add column "is_active" boolean default true;

alter table "public"."staking_records" add column "last_claimed_at" timestamp with time zone;

alter table "public"."staking_records" add column "rewards_earned" bigint default 0;

alter table "public"."staking_records" alter column "amount" set default 0;

alter table "public"."staking_records" alter column "amount" set data type bigint using "amount"::bigint;

alter table "public"."staking_records" alter column "apy" set default 0.00;

alter table "public"."staking_records" alter column "apy" set not null;

alter table "public"."staking_records" alter column "start_date" set default now();

alter table "public"."staking_records" alter column "status" set default 'active'::character varying;

alter table "public"."staking_records" alter column "status" set not null;

alter table "public"."staking_records" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."staking_records" alter column "token_type" set data type character varying(10) using "token_type"::character varying(10);

alter table "public"."stories" drop column "caption";

alter table "public"."stories" drop column "duration";

alter table "public"."stories" drop column "expires_at";

alter table "public"."stories" drop column "location";

alter table "public"."stories" drop column "media_type";

alter table "public"."stories" add column "comments_count" integer default 0;

alter table "public"."stories" add column "hashtags" text[] default '{}'::text[];

alter table "public"."stories" add column "likes_count" integer default 0;

alter table "public"."stories" add column "post_type" character varying(20) default 'story'::character varying;

alter table "public"."stories" add column "shares_count" integer default 0;

alter table "public"."stories" alter column "content_type" drop default;

alter table "public"."stories" alter column "content_type" set not null;

alter table "public"."stories" alter column "content_type" set data type character varying(20) using "content_type"::character varying(20);

alter table "public"."stories" alter column "media_url" drop not null;

alter table "public"."stories" alter column "media_urls" set default '{}'::text[];

alter table "public"."story_comments" add column "is_deleted" boolean default false;

alter table "public"."story_comments" add column "is_edited" boolean default false;

alter table "public"."story_comments" add column "likes_count" integer default 0;

alter table "public"."story_comments" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."story_shares" drop column "shared_to";

alter table "public"."story_shares" add column "platform" character varying(50);

alter table "public"."story_shares" add column "share_type" character varying(20) not null;

alter table "public"."summary_requests" drop column "status";

alter table "public"."summary_requests" drop column "updated_at";

alter table "public"."swinger_interests" drop column "interest";

alter table "public"."swinger_interests" drop column "level";

alter table "public"."swinger_interests" add column "description" text;

alter table "public"."swinger_interests" add column "is_active" boolean default true;

alter table "public"."swinger_interests" add column "is_explicit" boolean default false;

alter table "public"."swinger_interests" add column "name" character varying(100) not null;

alter table "public"."swinger_interests" alter column "category" set not null;

alter table "public"."swinger_interests" alter column "category" set data type character varying(50) using "category"::character varying(50);

-- alter table "public"."swinger_interests" alter column "id" set default nextval('public.swinger_interests_id_seq'::regclass);
-- Nota: No se puede establecer un default de tipo bigint para una columna uuid

-- alter table "public"."swinger_interests" alter column "id" set data type integer using "id"::integer;
-- Nota: No se puede cambiar el tipo de una columna uuid a integer

alter table "public"."token_analytics" alter column "active_stakers" set not null;

alter table "public"."token_analytics" alter column "circulating_cmpx" set default 0;

alter table "public"."token_analytics" alter column "circulating_cmpx" set data type bigint using "circulating_cmpx"::bigint;

alter table "public"."token_analytics" alter column "circulating_gtk" set default 0;

alter table "public"."token_analytics" alter column "circulating_gtk" set data type bigint using "circulating_gtk"::bigint;

alter table "public"."token_analytics" alter column "created_at" set not null;

alter table "public"."token_analytics" alter column "total_cmpx_supply" set default 0;

alter table "public"."token_analytics" alter column "total_cmpx_supply" set data type bigint using "total_cmpx_supply"::bigint;

alter table "public"."token_analytics" alter column "total_gtk_supply" set default 0;

alter table "public"."token_analytics" alter column "total_gtk_supply" set data type bigint using "total_gtk_supply"::bigint;

alter table "public"."token_analytics" alter column "total_staked_cmpx" set not null;

alter table "public"."token_analytics" alter column "total_staked_cmpx" set data type bigint using "total_staked_cmpx"::bigint;

alter table "public"."token_analytics" alter column "transaction_count" set not null;

alter table "public"."token_analytics" alter column "transaction_volume_cmpx" set not null;

alter table "public"."token_analytics" alter column "transaction_volume_cmpx" set data type bigint using "transaction_volume_cmpx"::bigint;

alter table "public"."token_analytics" alter column "transaction_volume_gtk" set not null;

alter table "public"."token_analytics" alter column "transaction_volume_gtk" set data type bigint using "transaction_volume_gtk"::bigint;

alter table "public"."token_staking" add column "unstaked_at" timestamp with time zone;

alter table "public"."token_staking" alter column "last_claim_at" set default now();

alter table "public"."token_staking" alter column "network" set default 'mumbai'::character varying;

alter table "public"."token_staking" alter column "network" set data type character varying(20) using "network"::character varying(20);

alter table "public"."token_staking" alter column "staking_contract" set data type character varying(42) using "staking_contract"::character varying(42);

alter table "public"."token_staking" alter column "user_address" set data type character varying(42) using "user_address"::character varying(42);

alter table "public"."token_transactions" drop column "balance_after";

alter table "public"."token_transactions" drop column "description";

alter table "public"."token_transactions" add column "status" character varying(20) default 'completed'::character varying;

alter table "public"."token_transactions" add column "updated_at" timestamp with time zone default now();

alter table "public"."token_transactions" alter column "amount" set default 0;

alter table "public"."token_transactions" alter column "amount" set data type bigint using "amount"::bigint;

alter table "public"."token_transactions" alter column "token_type" set data type character varying(10) using "token_type"::character varying(10);

alter table "public"."token_transactions" alter column "transaction_type" set data type character varying(20) using "transaction_type"::character varying(20);

alter table "public"."two_factor_auth" add column "email" character varying(255);

alter table "public"."two_factor_auth" add column "phone_number" character varying(20);

alter table "public"."two_factor_auth" alter column "backup_codes" drop default;

alter table "public"."two_factor_auth" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."two_factor_auth" alter column "method" set data type character varying(20) using "method"::character varying(20);

alter table "public"."two_factor_auth" alter column "secret" set data type character varying(255) using "secret"::character varying(255);

alter table "public"."user_consents" alter column "id" set default gen_random_uuid();

alter table "public"."user_device_tokens" drop column "app_version";

alter table "public"."user_device_tokens" drop column "device_model";

alter table "public"."user_device_tokens" drop column "device_os";

alter table "public"."user_device_tokens" drop column "updated_at";

alter table "public"."user_device_tokens" add column "device_info" jsonb default '{}'::jsonb;

alter table "public"."user_device_tokens" alter column "created_at" set not null;

alter table "public"."user_device_tokens" alter column "is_active" set not null;

alter table "public"."user_device_tokens" alter column "last_used_at" set not null;

alter table "public"."user_identifiers" alter column "id" set default public.uuid_generate_v4();

alter table "public"."user_interests" add column "privacy_level" character varying(20) default 'public'::character varying;

-- alter table "public"."user_interests" alter column "id" set default nextval('public.user_interests_id_seq'::regclass);
-- Nota: No se puede establecer un default de tipo bigint para una columna uuid

-- alter table "public"."user_interests" alter column "id" set data type integer using "id"::integer;
-- Nota: No se puede cambiar el tipo de una columna uuid a integer

alter table "public"."user_interests" alter column "interest_id" drop not null;

alter table "public"."user_interests" alter column "interest_id" set data type integer using "interest_id"::integer;

alter table "public"."user_interests" alter column "user_id" drop not null;

alter table "public"."user_interests" enable row level security;

alter table "public"."user_nfts" alter column "contract_address" drop default;

alter table "public"."user_nfts" alter column "contract_address" set data type character varying(42) using "contract_address"::character varying(42);

alter table "public"."user_nfts" alter column "network" set default 'mumbai'::character varying;

alter table "public"."user_nfts" alter column "network" set data type character varying(20) using "network"::character varying(20);

drop policy if exists "Users can view own NFTs" on "public"."user_nfts";
drop policy if exists "Users can insert own NFTs" on "public"."user_nfts";
drop policy if exists "Users can update own NFTs" on "public"."user_nfts";
drop policy if exists "Users can insert NFTs for their wallets" on "public"."user_nfts";
drop policy if exists "Users can view NFTs by wallet address" on "public"."user_nfts";
drop policy if exists "Users can view their NFTs" on "public"."user_nfts";
drop policy if exists "own_user_nfts" on "public"."user_nfts";

alter table "public"."user_nfts" alter column "owner_address" set data type character varying(42) using "owner_address"::character varying(42);

alter table "public"."user_nfts" alter column "partner_address" set data type character varying(42) using "partner_address"::character varying(42);

alter table "public"."user_nfts" alter column "rarity" set default 'common'::character varying;

alter table "public"."user_nfts" alter column "rarity" set data type character varying(20) using "rarity"::character varying(20);

alter table "public"."user_referral_balances" add column "referred_by" uuid;

alter table "public"."user_referral_balances" alter column "cmpx_balance" set not null;

alter table "public"."user_referral_balances" alter column "cmpx_balance" set data type bigint using "cmpx_balance"::bigint;

alter table "public"."user_referral_balances" alter column "last_reset_date" set default CURRENT_DATE;

alter table "public"."user_referral_balances" alter column "last_reset_date" set not null;

alter table "public"."user_referral_balances" alter column "last_reset_date" set data type date using "last_reset_date"::date;

alter table "public"."user_referral_balances" alter column "monthly_earned" set not null;

alter table "public"."user_referral_balances" alter column "monthly_earned" set data type bigint using "monthly_earned"::bigint;

alter table "public"."user_referral_balances" alter column "total_earned" set not null;

alter table "public"."user_referral_balances" alter column "total_earned" set data type bigint using "total_earned"::bigint;

alter table "public"."user_referral_balances" alter column "total_referrals" set not null;

alter table "public"."user_roles" drop column "assigned_by";

alter table "public"."user_roles" add column "is_active" boolean default true;

alter table "public"."user_roles" alter column "created_at" drop not null;

alter table "public"."user_roles" alter column "id" set default gen_random_uuid();

alter table "public"."user_roles" alter column "role" set default 'user'::text;

alter table "public"."user_roles" alter column "user_id" drop not null;

alter table "public"."user_suspensions" drop column "lift_reason";

alter table "public"."user_suspensions" drop column "lifted_at";

alter table "public"."user_suspensions" drop column "lifted_by";

alter table "public"."user_suspensions" drop column "metadata";

alter table "public"."user_suspensions" drop column "suspended_at";

alter table "public"."user_suspensions" drop column "suspended_by";

alter table "public"."user_suspensions" add column "duration_days" integer;

alter table "public"."user_suspensions" add column "ends_at" timestamp with time zone;

alter table "public"."user_suspensions" add column "is_active" boolean default true;

alter table "public"."user_suspensions" add column "moderator_id" uuid not null;

alter table "public"."user_suspensions" add column "starts_at" timestamp with time zone default now();

alter table "public"."user_suspensions" add column "suspension_type" character varying(20) not null default 'temporary'::character varying;

alter table "public"."user_suspensions" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."user_themes" drop column "primary_color";

alter table "public"."user_themes" drop column "secondary_color";

alter table "public"."user_themes" drop column "text_color";

alter table "public"."user_themes" drop column "theme_name";

alter table "public"."user_themes" add column "animation_speed" text default 'normal'::text;

alter table "public"."user_themes" add column "enable_background_animations" boolean default true;

alter table "public"."user_themes" add column "enable_glass_ui" boolean default true;

alter table "public"."user_themes" add column "enable_particles" boolean default true;

alter table "public"."user_themes" add column "glow_level" text default 'medium'::text;

alter table "public"."user_themes" add column "particles_intensity" integer default 50;

alter table "public"."user_token_balances" add column "last_reset_date" timestamp with time zone default now();

alter table "public"."user_token_balances" add column "monthly_earned" bigint default 0;

alter table "public"."user_token_balances" add column "monthly_limit" bigint default 1000;

alter table "public"."user_token_balances" add column "referral_code" character varying(20);

alter table "public"."user_token_balances" add column "referred_by" uuid;

alter table "public"."user_token_balances" add column "total_referrals" integer default 0;

alter table "public"."user_token_balances" add column "world_id_verified" boolean default false;

alter table "public"."user_token_balances" alter column "cmpx_balance" set not null;

alter table "public"."user_token_balances" alter column "cmpx_balance" set data type bigint using "cmpx_balance"::bigint;

alter table "public"."user_token_balances" alter column "gtk_balance" set not null;

alter table "public"."user_token_balances" alter column "gtk_balance" set data type bigint using "gtk_balance"::bigint;

alter table "public"."virtual_events" alter column "event_type" set data type text using "event_type"::text;

alter table "public"."virtual_events" alter column "id" set default public.uuid_generate_v4();

alter table "public"."virtual_events" alter column "status" set default 'scheduled'::text;

alter table "public"."virtual_events" alter column "status" set data type text using "status"::text;

alter table "public"."web_vitals_history" add column "timestamp" timestamp with time zone default now();

alter table "public"."web_vitals_history" alter column "id" set default gen_random_uuid();

alter table "public"."web_vitals_history" alter column "url" set not null;

alter table "public"."worldid_verifications" drop column "world_id";

alter table "public"."worldid_verifications" add column "action_id" text not null;

alter table "public"."worldid_verifications" add column "expires_at" timestamp with time zone;

alter table "public"."worldid_verifications" add column "is_active" boolean default true;

alter table "public"."worldid_verifications" add column "merkle_root" text;

alter table "public"."worldid_verifications" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."worldid_verifications" add column "nullifier_hash" text not null;

alter table "public"."worldid_verifications" add column "proof" jsonb not null;

alter table "public"."worldid_verifications" add column "signal_hash" text;

alter table "public"."worldid_verifications" alter column "id" set default gen_random_uuid();

alter table "public"."worldid_verifications" alter column "verification_level" set default 'orb'::character varying;

alter table "public"."worldid_verifications" alter column "verification_level" set not null;

alter table "public"."worldid_verifications" alter column "verification_level" set data type character varying(20) using "verification_level"::character varying(20);

alter table "public"."worldid_verifications" alter column "verified_at" set default now();

alter table "public"."worldid_verifications" enable row level security;

alter sequence "public"."apk_downloads_id_seq" owned by "public"."apk_downloads"."id";

alter sequence "public"."app_metrics_id_seq" owned by "public"."app_metrics"."id";

alter sequence "public"."compatibility_scores_id_seq" owned by "public"."compatibility_scores"."id";

alter sequence "public"."explicit_preferences_id_seq" owned by "public"."explicit_preferences"."id";

alter sequence "public"."faq_items_id_seq" owned by "public"."faq_items"."id";

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."subscribers_id_seq" owned by "public"."subscribers"."id";

alter sequence "public"."swinger_interests_id_seq" owned by "public"."swinger_interests"."id";

alter sequence "public"."user_explicit_preferences_id_seq" owned by "public"."user_explicit_preferences"."id";

alter sequence "public"."user_interests_id_seq" owned by "public"."user_interests"."id";

drop type "public"."role_enum";

CREATE UNIQUE INDEX ai_compatibility_scores_pkey ON public.ai_compatibility_scores USING btree (id);

CREATE UNIQUE INDEX ai_model_metrics_pkey ON public.ai_model_metrics USING btree (id);

CREATE UNIQUE INDEX ai_prediction_logs_pkey ON public.ai_prediction_logs USING btree (id);

CREATE UNIQUE INDEX apk_downloads_pkey ON public.apk_downloads USING btree (id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX automation_rules_pkey ON public.automation_rules USING btree (id);

CREATE UNIQUE INDEX biometric_challenges_pkey ON public.biometric_challenges USING btree (id);

CREATE UNIQUE INDEX biometric_credentials_credential_id_key ON public.biometric_credentials USING btree (credential_id);

CREATE UNIQUE INDEX biometric_credentials_pkey ON public.biometric_credentials USING btree (id);

CREATE UNIQUE INDEX biometric_sessions_pkey ON public.biometric_sessions USING btree (id);

CREATE UNIQUE INDEX biometric_sessions_session_id_key ON public.biometric_sessions USING btree (session_id);

CREATE UNIQUE INDEX blocked_ips_pkey ON public.blocked_ips USING btree (id);

CREATE UNIQUE INDEX blocks_pkey ON public.blocks USING btree (id);

CREATE UNIQUE INDEX chat_invitations_pkey ON public.chat_invitations USING btree (id);

CREATE UNIQUE INDEX chat_invitations_room_id_invited_user_key ON public.chat_invitations USING btree (room_id, invited_user);

CREATE UNIQUE INDEX chat_members_room_id_profile_id_key ON public.chat_members USING btree (room_id, profile_id);

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE UNIQUE INDEX club_checkins_pkey ON public.club_checkins USING btree (id);

CREATE UNIQUE INDEX club_flyers_pkey ON public.club_flyers USING btree (id);

CREATE UNIQUE INDEX club_reviews_club_id_user_id_key ON public.club_reviews USING btree (club_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS club_reviews_pkey ON public.club_reviews USING btree (id);

CREATE UNIQUE INDEX club_verifications_pkey ON public.club_verifications USING btree (id);

CREATE UNIQUE INDEX comment_likes_comment_id_user_id_key ON public.comment_likes USING btree (comment_id, user_id);

CREATE UNIQUE INDEX comment_likes_pkey ON public.comment_likes USING btree (id);

CREATE UNIQUE INDEX compatibility_scores_pkey ON public.compatibility_scores USING btree (id);

CREATE UNIQUE INDEX compatibility_scores_user1_id_user2_id_key ON public.compatibility_scores USING btree (user1_id, user2_id);

CREATE UNIQUE INDEX consent_verifications_chat_id_unique ON public.consent_verifications USING btree (chat_id) WHERE (chat_id IS NOT NULL);

CREATE UNIQUE INDEX content_moderation_pkey ON public.content_moderation USING btree (id);

CREATE UNIQUE INDEX couple_favorites_couple_id_favorite_couple_id_key ON public.couple_favorites USING btree (couple_id, favorite_couple_id);

CREATE UNIQUE INDEX couple_favorites_pkey ON public.couple_favorites USING btree (id);

CREATE UNIQUE INDEX couple_gifts_pkey ON public.couple_gifts USING btree (id);

CREATE UNIQUE INDEX couple_interactions_pkey ON public.couple_interactions USING btree (id);

CREATE UNIQUE INDEX couple_matches_pkey ON public.couple_matches USING btree (id);

CREATE UNIQUE INDEX couple_messages_pkey ON public.couple_messages USING btree (id);

CREATE UNIQUE INDEX couple_profile_likes_couple_profile_id_liker_profile_id_key ON public.couple_profile_likes USING btree (couple_profile_id, liker_profile_id);

CREATE UNIQUE INDEX couple_profile_matches_couple_profile1_id_couple_profile2_i_key ON public.couple_profile_matches USING btree (couple_profile1_id, couple_profile2_id);

CREATE UNIQUE INDEX couple_profile_matches_pkey ON public.couple_profile_matches USING btree (id);

CREATE UNIQUE INDEX couple_profile_reports_couple_profile_id_reporter_profile_i_key ON public.couple_profile_reports USING btree (couple_profile_id, reporter_profile_id);

CREATE UNIQUE INDEX couple_profile_reports_pkey ON public.couple_profile_reports USING btree (id);

CREATE UNIQUE INDEX couple_profile_views_couple_profile_id_viewer_profile_id_vi_key ON public.couple_profile_views USING btree (couple_profile_id, viewer_profile_id, viewed_date);

CREATE UNIQUE INDEX couple_profile_views_pkey ON public.couple_profile_views USING btree (id);

CREATE UNIQUE INDEX couple_profiles_nickname_key ON public.couple_profiles USING btree (nickname);

CREATE UNIQUE INDEX couple_reports_pkey ON public.couple_reports USING btree (id);

CREATE UNIQUE INDEX couple_statistics_couple_id_date_key ON public.couple_statistics USING btree (couple_id, date);

CREATE UNIQUE INDEX couple_statistics_pkey ON public.couple_statistics USING btree (id);

CREATE UNIQUE INDEX couple_verifications_pkey ON public.couple_verifications USING btree (id);

CREATE UNIQUE INDEX event_participations_event_id_user_id_key ON public.event_participations USING btree (event_id, user_id);

CREATE UNIQUE INDEX explicit_preferences_name_key ON public.explicit_preferences USING btree (name);

CREATE UNIQUE INDEX explicit_preferences_pkey ON public.explicit_preferences USING btree (id);

CREATE UNIQUE INDEX faq_items_pkey ON public.faq_items USING btree (id);

CREATE UNIQUE INDEX favorites_pkey ON public.favorites USING btree (id);

CREATE UNIQUE INDEX follows_follower_user_id_following_user_id_key ON public.follows USING btree (follower_user_id, following_user_id);

CREATE UNIQUE INDEX follows_pkey ON public.follows USING btree (id);

CREATE UNIQUE INDEX fraud_analysis_pkey ON public.fraud_analysis USING btree (id);

CREATE UNIQUE INDEX gallery_access_requests_pkey ON public.gallery_access_requests USING btree (id);

CREATE UNIQUE INDEX gallery_access_requests_requester_id_requested_from_key ON public.gallery_access_requests USING btree (requester_id, requested_from);

CREATE UNIQUE INDEX gallery_permissions_profile_id_granted_to_permission_type_key ON public.gallery_permissions USING btree (profile_id, granted_to, permission_type);

CREATE UNIQUE INDEX gallery_unlocks_pkey ON public.gallery_unlocks USING btree (user_id, profile_id);

CREATE INDEX idx_ai_scores_created ON public.ai_compatibility_scores USING btree (created_at DESC);

CREATE INDEX idx_ai_scores_final ON public.ai_compatibility_scores USING btree (final_score DESC);

CREATE INDEX idx_ai_scores_method ON public.ai_compatibility_scores USING btree (prediction_method);

CREATE UNIQUE INDEX idx_ai_scores_unique_pair ON public.ai_compatibility_scores USING btree (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

CREATE INDEX idx_ai_scores_user1 ON public.ai_compatibility_scores USING btree (user1_id);

CREATE INDEX idx_ai_scores_user2 ON public.ai_compatibility_scores USING btree (user2_id);

CREATE INDEX idx_ai_scores_user_pair ON public.ai_compatibility_scores USING btree (user1_id, user2_id);

CREATE INDEX idx_apk_downloads_created_at ON public.apk_downloads USING btree (created_at);

CREATE INDEX idx_apk_downloads_user_id ON public.apk_downloads USING btree (user_id);

CREATE INDEX idx_app_logs_user_level ON public.app_logs USING btree (user_id, level) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_app_metrics_name ON public.app_metrics USING btree (metric_name);

CREATE INDEX idx_app_metrics_recorded_at ON public.app_metrics USING btree (recorded_at);

CREATE INDEX idx_audit_logs_risk_level ON public.audit_logs USING btree (risk_level, created_at DESC);

CREATE INDEX idx_audit_logs_user_time ON public.audit_logs USING btree (user_id, created_at DESC);

CREATE INDEX idx_automation_rules_enabled ON public.automation_rules USING btree (enabled);

CREATE INDEX idx_automation_rules_priority ON public.automation_rules USING btree (priority);

CREATE INDEX idx_automation_rules_trigger ON public.automation_rules USING btree (trigger);

CREATE INDEX idx_biometric_sessions_expires_at ON public.biometric_sessions USING btree (expires_at);

CREATE INDEX idx_biometric_sessions_is_active ON public.biometric_sessions USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_biometric_sessions_session_id ON public.biometric_sessions USING btree (session_id);

CREATE INDEX idx_biometric_sessions_user_id ON public.biometric_sessions USING btree (user_id);

CREATE INDEX idx_blocked_ips_active ON public.blocked_ips USING btree (is_active);

CREATE INDEX idx_blocked_ips_expires_at ON public.blocked_ips USING btree (expires_at);

CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips USING btree (ip_address);

CREATE INDEX idx_blocks_blocked_id ON public.blocks USING btree (blocked_id);

CREATE INDEX idx_blocks_blocker_id ON public.blocks USING btree (blocker_id);

CREATE INDEX idx_career_applications_created_at ON public.career_applications USING btree (created_at DESC);

CREATE INDEX idx_chat_members_room_profile ON public.chat_members USING btree (chat_room_id, user_id);

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at DESC);

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages USING btree (room_id);

CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages USING btree (sender_id);

CREATE INDEX idx_chat_rooms_is_public ON public.chat_rooms USING btree (is_public);

CREATE INDEX idx_chat_summaries_chat_id ON public.chat_summaries USING btree (chat_id);

CREATE INDEX idx_chat_summaries_created ON public.chat_summaries USING btree (created_at DESC);

CREATE INDEX idx_chat_summaries_method ON public.chat_summaries USING btree (method);

CREATE INDEX idx_chat_summaries_sentiment ON public.chat_summaries USING btree (sentiment);

CREATE INDEX idx_chat_summaries_topics ON public.chat_summaries USING gin (topics);

CREATE INDEX idx_club_checkins_club_id ON public.club_checkins USING btree (club_id);

CREATE INDEX idx_club_checkins_created_at ON public.club_checkins USING btree (created_at DESC);

-- CREATE INDEX idx_club_checkins_location ON public.club_checkins USING gist (public.ll_to_earth(latitude, longitude));
-- Nota: El tipo earth no existe en el esquema actual

-- CREATE UNIQUE INDEX idx_club_checkins_unique_daily ON public.club_checkins USING btree (club_id, user_id, public.date_trunc_day(created_at));
-- Nota: La función date_trunc_day no existe en el esquema actual

CREATE INDEX idx_club_checkins_user_id ON public.club_checkins USING btree (user_id);

CREATE INDEX idx_club_checkins_verified ON public.club_checkins USING btree (is_verified) WHERE (is_verified = true);

CREATE INDEX idx_club_flyers_active ON public.club_flyers USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_club_flyers_ai_status ON public.club_flyers USING btree (ai_processing_status);

CREATE INDEX idx_club_flyers_club_id ON public.club_flyers USING btree (club_id);

CREATE INDEX idx_club_flyers_event_date ON public.club_flyers USING btree (event_date) WHERE (event_date IS NOT NULL);

CREATE INDEX idx_club_flyers_featured ON public.club_flyers USING btree (is_featured) WHERE (is_featured = true);

CREATE INDEX IF NOT EXISTS idx_club_reviews_club_id ON public.club_reviews USING btree (club_id);

CREATE INDEX IF NOT EXISTS idx_club_reviews_created_at ON public.club_reviews USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_reviews_featured ON public.club_reviews USING btree (is_featured) WHERE (is_featured = true);

CREATE INDEX IF NOT EXISTS idx_club_reviews_rating ON public.club_reviews USING btree (rating);

CREATE INDEX IF NOT EXISTS idx_club_reviews_user_id ON public.club_reviews USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_club_reviews_verified ON public.club_reviews USING btree (is_verified) WHERE (is_verified = true);

CREATE INDEX idx_club_verifications_club_id ON public.club_verifications USING btree (club_id);

CREATE INDEX idx_club_verifications_status ON public.club_verifications USING btree (status);

CREATE INDEX idx_club_verifications_verified_by ON public.club_verifications USING btree (verified_by);

CREATE INDEX idx_clubs_active ON public.clubs USING btree (is_active) WHERE (is_active = true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'is_featured'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clubs_featured ON public.clubs USING btree (is_featured) WHERE (is_featured = true)';
  END IF;
END $$;

CREATE INDEX idx_clubs_verified ON public.clubs USING btree (verified_at) WHERE (verified_at IS NOT NULL);

CREATE INDEX idx_cmpx_purchases_payment_status ON public.cmpx_purchases USING btree (payment_status);

CREATE INDEX idx_cmpx_purchases_stripe_payment_intent ON public.cmpx_purchases USING btree (stripe_payment_intent_id) WHERE (stripe_payment_intent_id IS NOT NULL);

CREATE INDEX idx_cmpx_shop_packages_active ON public.cmpx_shop_packages USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_cmpx_shop_packages_order ON public.cmpx_shop_packages USING btree (display_order);

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);

CREATE INDEX idx_comment_likes_created_at ON public.comment_likes USING btree (created_at);

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);

CREATE INDEX idx_compatibility_scores_users ON public.compatibility_scores USING btree (user1_id, user2_id);

CREATE INDEX idx_consent_verifications_consent_level ON public.consent_verifications USING btree (consent_level);

CREATE INDEX idx_consent_verifications_created_at ON public.consent_verifications USING btree (created_at DESC);

CREATE INDEX idx_consent_verifications_is_paused ON public.consent_verifications USING btree (is_paused);

CREATE INDEX idx_consent_verifications_message_id ON public.consent_verifications USING btree (message_id);

CREATE INDEX idx_consent_verifications_recipient_id ON public.consent_verifications USING btree (recipient_id);

CREATE INDEX idx_consent_verifications_verified ON public.consent_verifications USING btree (verified);

CREATE INDEX idx_content_moderation_content_id ON public.content_moderation USING btree (content_id);

CREATE INDEX idx_content_moderation_status ON public.content_moderation USING btree (status);

CREATE INDEX idx_content_moderation_type ON public.content_moderation USING btree (content_type);

CREATE INDEX idx_couple_agreements_partners ON public.couple_agreements USING btree (partner_1_id, partner_2_id);

CREATE INDEX idx_couple_events_couple_id ON public.couple_events USING btree (couple_id);

CREATE INDEX idx_couple_events_date ON public.couple_events USING btree (date);

CREATE INDEX idx_couple_events_event_date ON public.couple_events USING btree (event_date);

CREATE INDEX idx_couple_events_is_public ON public.couple_events USING btree (is_public);

CREATE INDEX idx_couple_events_organizer_id ON public.couple_events USING btree (organizer_id);

CREATE INDEX idx_couple_events_public ON public.couple_events USING btree (is_public);

CREATE INDEX idx_couple_events_type ON public.couple_events USING btree (event_type);

CREATE INDEX idx_couple_favorites_couple_id ON public.couple_favorites USING btree (couple_id);

CREATE INDEX idx_couple_favorites_favorite_couple_id ON public.couple_favorites USING btree (favorite_couple_id);

CREATE INDEX idx_couple_gifts_delivered ON public.couple_gifts USING btree (is_delivered);

CREATE INDEX idx_couple_gifts_receiver ON public.couple_gifts USING btree (receiver_couple_id);

CREATE INDEX idx_couple_gifts_sender ON public.couple_gifts USING btree (sender_couple_id);

CREATE INDEX idx_couple_interactions_couple_id ON public.couple_interactions USING btree (couple_id);

CREATE INDEX idx_couple_interactions_created_at ON public.couple_interactions USING btree (created_at);

CREATE INDEX idx_couple_interactions_target_couple_id ON public.couple_interactions USING btree (target_couple_id);

CREATE INDEX idx_couple_interactions_type ON public.couple_interactions USING btree (interaction_type);

CREATE INDEX idx_couple_matches_couple1_id ON public.couple_matches USING btree (couple1_id);

CREATE INDEX idx_couple_matches_couple2_id ON public.couple_matches USING btree (couple2_id);

CREATE INDEX idx_couple_matches_created_at ON public.couple_matches USING btree (created_at);

CREATE INDEX idx_couple_matches_status ON public.couple_matches USING btree (status);

CREATE INDEX idx_couple_messages_created_at ON public.couple_messages USING btree (created_at);

CREATE INDEX idx_couple_messages_read ON public.couple_messages USING btree (is_read);

CREATE INDEX idx_couple_messages_receiver ON public.couple_messages USING btree (receiver_couple_id);

CREATE INDEX idx_couple_messages_sender ON public.couple_messages USING btree (sender_couple_id);

CREATE INDEX idx_couple_profile_likes_couple_profile_id ON public.couple_profile_likes USING btree (couple_profile_id);

CREATE INDEX idx_couple_profile_likes_liked_at ON public.couple_profile_likes USING btree (liked_at);

CREATE INDEX idx_couple_profile_likes_liker_profile_id ON public.couple_profile_likes USING btree (liker_profile_id);

CREATE INDEX idx_couple_profile_matches_couple_profile1_id ON public.couple_profile_matches USING btree (couple_profile1_id);

CREATE INDEX idx_couple_profile_matches_couple_profile2_id ON public.couple_profile_matches USING btree (couple_profile2_id);

CREATE INDEX idx_couple_profile_matches_is_active ON public.couple_profile_matches USING btree (is_active);

CREATE INDEX idx_couple_profile_matches_matched_at ON public.couple_profile_matches USING btree (matched_at);

CREATE INDEX idx_couple_profile_reports_couple_profile_id ON public.couple_profile_reports USING btree (couple_profile_id);

CREATE INDEX idx_couple_profile_reports_created_at ON public.couple_profile_reports USING btree (created_at);

CREATE INDEX idx_couple_profile_reports_reason ON public.couple_profile_reports USING btree (reason);

CREATE INDEX idx_couple_profile_reports_reporter_profile_id ON public.couple_profile_reports USING btree (reporter_profile_id);

CREATE INDEX idx_couple_profile_reports_status ON public.couple_profile_reports USING btree (status);

CREATE INDEX idx_couple_profile_views_couple_profile_id ON public.couple_profile_views USING btree (couple_profile_id);

CREATE INDEX idx_couple_profile_views_viewed_at ON public.couple_profile_views USING btree (viewed_at);

CREATE INDEX idx_couple_profile_views_viewed_date ON public.couple_profile_views USING btree (viewed_date);

CREATE INDEX idx_couple_profile_views_viewer_profile_id ON public.couple_profile_views USING btree (viewer_profile_id);

CREATE INDEX idx_couple_profiles_bio_trgm ON public.couple_profiles USING gin (bio public.gin_trgm_ops);

CREATE INDEX idx_couple_profiles_is_active ON public.couple_profiles USING btree (is_active);

CREATE INDEX idx_couple_profiles_name_trgm ON public.couple_profiles USING gin (name public.gin_trgm_ops);

CREATE INDEX idx_couple_profiles_nickname ON public.couple_profiles USING btree (nickname);

CREATE INDEX idx_couple_reports_reported ON public.couple_reports USING btree (reported_couple_id);

CREATE INDEX idx_couple_reports_reporter ON public.couple_reports USING btree (reporter_couple_id);

CREATE INDEX idx_couple_reports_status ON public.couple_reports USING btree (status);

CREATE INDEX idx_couple_statistics_couple_id ON public.couple_statistics USING btree (couple_id);

CREATE INDEX idx_couple_statistics_date ON public.couple_statistics USING btree (date);

CREATE INDEX idx_couple_verifications_couple_id ON public.couple_verifications USING btree (couple_id);

CREATE INDEX idx_couple_verifications_status ON public.couple_verifications USING btree (verification_status);

CREATE INDEX idx_couple_verifications_type ON public.couple_verifications USING btree (verification_type);

CREATE INDEX idx_device_tokens_user ON public.user_device_tokens USING btree (user_id, is_active);

CREATE INDEX idx_digital_fingerprints_banned ON public.digital_fingerprints USING btree (is_banned) WHERE (is_banned = true);

CREATE INDEX idx_digital_fingerprints_canvas_hash ON public.digital_fingerprints USING btree (canvas_hash);

CREATE INDEX idx_digital_fingerprints_combined_hash ON public.digital_fingerprints USING btree (combined_hash);

CREATE INDEX idx_digital_fingerprints_is_banned ON public.digital_fingerprints USING btree (is_banned);

CREATE INDEX idx_digital_fingerprints_last_seen ON public.digital_fingerprints USING btree (last_seen_at DESC);

CREATE INDEX idx_digital_fingerprints_user_id ON public.digital_fingerprints USING btree (user_id);

CREATE INDEX idx_digital_fingerprints_worldid_nullifier ON public.digital_fingerprints USING btree (worldid_nullifier_hash) WHERE (worldid_nullifier_hash IS NOT NULL);

CREATE INDEX idx_error_alerts_category ON public.error_alerts USING btree (category);

CREATE INDEX idx_error_alerts_created_at ON public.error_alerts USING btree (created_at DESC);

CREATE INDEX idx_error_alerts_resolved ON public.error_alerts USING btree (resolved);

CREATE INDEX idx_error_alerts_severity ON public.error_alerts USING btree (severity) WHERE (resolved = false);

CREATE INDEX idx_error_alerts_timestamp ON public.error_alerts USING btree ("timestamp" DESC);

CREATE INDEX idx_error_alerts_user_id ON public.error_alerts USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_faq_items_active ON public.faq_items USING btree (is_active);

CREATE INDEX idx_faq_items_category ON public.faq_items USING btree (category);

CREATE INDEX idx_favorites_target_id ON public.favorites USING btree (target_id);

CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id);

CREATE INDEX idx_follows_created_at ON public.follows USING btree (created_at);

CREATE INDEX idx_follows_follower_user_id ON public.follows USING btree (follower_user_id);

CREATE INDEX idx_follows_following_user_id ON public.follows USING btree (following_user_id);

CREATE INDEX idx_fraud_analysis_confidence ON public.fraud_analysis USING btree (confidence);

CREATE INDEX idx_fraud_analysis_created_at ON public.fraud_analysis USING btree (created_at DESC);

CREATE INDEX idx_fraud_analysis_is_fraudulent ON public.fraud_analysis USING btree (is_fraudulent);

CREATE INDEX idx_fraud_analysis_user_id ON public.fraud_analysis USING btree (user_id);

CREATE INDEX idx_frozen_assets_status ON public.frozen_assets USING btree (status);

CREATE INDEX idx_gallery_commissions_created_at ON public.gallery_commissions USING btree (created_at DESC);

CREATE INDEX idx_gallery_commissions_creator_id ON public.gallery_commissions USING btree (creator_id);

CREATE INDEX idx_gallery_commissions_creator_paid ON public.gallery_commissions USING btree (creator_paid) WHERE (creator_paid = false);

CREATE INDEX idx_gallery_commissions_gallery_id ON public.gallery_commissions USING btree (gallery_id);

CREATE INDEX idx_gallery_commissions_transaction_type ON public.gallery_commissions USING btree (transaction_type);

CREATE INDEX idx_gallery_permissions_granted_by ON public.gallery_permissions USING btree (granted_by);

CREATE INDEX idx_image_metadata_url ON public.image_metadata USING btree (image_url);

CREATE INDEX idx_images_is_featured ON public.images USING btree (is_featured);

CREATE INDEX idx_images_is_verified ON public.images USING btree (is_verified);

CREATE INDEX idx_images_sort_order ON public.images USING btree (sort_order);

CREATE INDEX idx_images_uploaded_at ON public.images USING btree (uploaded_at);

CREATE INDEX idx_investment_returns_due_date ON public.investment_returns USING btree (due_date);

CREATE INDEX idx_investment_returns_investment_id ON public.investment_returns USING btree (investment_id);

CREATE INDEX idx_investment_returns_payment_status ON public.investment_returns USING btree (payment_status);

CREATE INDEX idx_investment_returns_status ON public.investment_returns USING btree (status);

CREATE INDEX idx_investment_returns_user_id ON public.investment_returns USING btree (user_id);

CREATE INDEX idx_investment_tiers_active ON public.investment_tiers USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_investment_tiers_display_order ON public.investment_tiers USING btree (display_order);

CREATE INDEX idx_investments_stripe_payment_intent ON public.investments USING btree (stripe_payment_intent_id) WHERE (stripe_payment_intent_id IS NOT NULL);

CREATE INDEX idx_investments_tier ON public.investments USING btree (tier);

CREATE INDEX idx_invitation_analytics_created_at ON public.invitation_analytics USING btree (created_at);

CREATE INDEX idx_invitation_analytics_event_type ON public.invitation_analytics USING btree (event_type);

CREATE INDEX idx_invitation_analytics_invitation_id ON public.invitation_analytics USING btree (invitation_id);

CREATE INDEX idx_invitation_responses_created_at ON public.invitation_responses USING btree (created_at);

CREATE INDEX idx_invitation_responses_invitation_id ON public.invitation_responses USING btree (invitation_id);

CREATE INDEX idx_invitation_responses_response_type ON public.invitation_responses USING btree (response_type);

CREATE INDEX idx_invitation_statistics_created_at ON public.invitation_statistics USING btree (created_at DESC);

CREATE INDEX idx_invitation_statistics_period ON public.invitation_statistics USING btree (period_start, period_end);

CREATE INDEX idx_invitation_templates_created_by ON public.invitation_templates USING btree (created_by);

CREATE INDEX idx_invitation_templates_invitation_type ON public.invitation_templates USING btree (invitation_type);

CREATE INDEX idx_invitation_templates_is_active ON public.invitation_templates USING btree (is_active);

CREATE INDEX idx_invitations_inviter_id ON public.invitations USING btree (inviter_id);

CREATE INDEX idx_likes_target_id ON public.likes USING btree (target_id);

CREATE INDEX idx_likes_target_type ON public.likes USING btree (target_type);

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);

CREATE INDEX idx_matches_mutual ON public.matches USING btree (user1_id, user2_id, created_at DESC);

CREATE INDEX idx_matches_status ON public.matches USING btree (status);

CREATE INDEX idx_matches_user1_created_at ON public.matches USING btree (user1_id, created_at DESC);

CREATE INDEX idx_matches_user2_created_at ON public.matches USING btree (user2_id, created_at DESC);

CREATE INDEX idx_media_access_logs_accessed_at ON public.media_access_logs USING btree (accessed_at DESC);

CREATE INDEX idx_media_access_logs_action ON public.media_access_logs USING btree (action);

CREATE INDEX idx_media_access_logs_created_at ON public.media_access_logs USING btree (created_at);

CREATE INDEX idx_media_access_logs_media_id ON public.media_access_logs USING btree (media_id);

CREATE INDEX idx_media_access_logs_user_id ON public.media_access_logs USING btree (user_id);

CREATE INDEX idx_media_created_at ON public.media USING btree (created_at);

CREATE INDEX idx_media_file_type ON public.media USING btree (file_type);

CREATE INDEX idx_media_is_public ON public.media USING btree (is_public);

CREATE INDEX idx_media_is_verified ON public.media USING btree (is_verified);

CREATE INDEX idx_media_user_id ON public.media USING btree (user_id);

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);

CREATE INDEX idx_messages_room_created_at ON public.messages USING btree (room_id, created_at DESC) WHERE (room_id IS NOT NULL);

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id, created_at DESC) WHERE (sender_id IS NOT NULL);

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);

CREATE INDEX idx_mfa_settings_enabled ON public.mfa_settings USING btree (enabled);

CREATE INDEX idx_mfa_settings_user_id ON public.mfa_settings USING btree (user_id);

CREATE INDEX idx_model_metrics_period ON public.ai_model_metrics USING btree (period_start DESC);

CREATE INDEX idx_model_metrics_version ON public.ai_model_metrics USING btree (model_version);

CREATE INDEX idx_moderation_logs_action_type ON public.moderation_logs USING btree (action_type);

CREATE INDEX idx_moderation_logs_moderator ON public.moderation_logs USING btree (moderator_id, created_at DESC);

CREATE INDEX idx_moderation_logs_severity ON public.moderation_logs USING btree (severity);

CREATE INDEX idx_moderation_logs_target_user ON public.moderation_logs USING btree (target_user_id, created_at DESC);

CREATE INDEX idx_moderator_payments_level ON public.moderator_payments USING btree (moderator_level);

CREATE INDEX idx_moderator_payments_period ON public.moderator_payments USING btree (payment_period_start, payment_period_end);

CREATE INDEX idx_moderator_payments_status ON public.moderator_payments USING btree (payment_status);

CREATE INDEX idx_moderator_sessions_active ON public.moderator_sessions USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_moderator_sessions_is_active ON public.moderator_sessions USING btree (is_active);

CREATE INDEX idx_moderator_sessions_session_start ON public.moderator_sessions USING btree (session_start DESC);

CREATE INDEX idx_moderators_level ON public.moderators USING btree (level);

CREATE INDEX idx_moderators_moderator_id ON public.moderators USING btree (moderator_id);

CREATE INDEX idx_monitoring_sessions_created_at ON public.monitoring_sessions USING btree (created_at DESC);

CREATE INDEX idx_monitoring_sessions_started_at ON public.monitoring_sessions USING btree (started_at DESC);

CREATE INDEX idx_monitoring_sessions_user_id ON public.monitoring_sessions USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_nft_galleries_nft_contract ON public.nft_galleries USING btree (nft_contract_address);

CREATE INDEX idx_nft_gallery_images_is_verified ON public.nft_gallery_images USING btree (is_verified);

CREATE INDEX idx_nft_gallery_images_nft_contract ON public.nft_gallery_images USING btree (nft_contract_address);

CREATE INDEX idx_notification_history_user ON public.notification_history USING btree (user_id, created_at DESC);

CREATE INDEX idx_notification_preferences_enabled ON public.notification_preferences USING btree (enabled);

CREATE INDEX idx_notification_preferences_type ON public.notification_preferences USING btree (notification_type);

CREATE INDEX idx_notification_preferences_user ON public.user_notification_preferences USING btree (user_id);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_pending_rewards_claimed ON public.pending_rewards USING btree (claimed);

CREATE INDEX idx_pending_rewards_user_id ON public.pending_rewards USING btree (user_id);

CREATE INDEX idx_performance_logs_metric ON public.performance_logs USING btree (metric_name);

CREATE INDEX idx_performance_logs_user_id ON public.performance_logs USING btree (user_id);

CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics USING btree (created_at DESC);

CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics USING btree (metric_name);

CREATE INDEX idx_performance_metrics_session_id ON public.performance_metrics USING btree (session_id);

CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics USING btree ("timestamp" DESC);

CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_permanent_bans_active ON public.permanent_bans USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_permanent_bans_canvas_hash ON public.permanent_bans USING btree (canvas_hash) WHERE (canvas_hash IS NOT NULL);

CREATE INDEX idx_permanent_bans_is_active ON public.permanent_bans USING btree (is_active);

CREATE INDEX idx_permanent_bans_worldid_nullifier ON public.permanent_bans USING btree (worldid_nullifier_hash) WHERE (worldid_nullifier_hash IS NOT NULL);

CREATE INDEX idx_post_comments_created_at ON public.post_comments USING btree (created_at DESC);

CREATE INDEX idx_post_comments_parent ON public.post_comments USING btree (parent_comment_id) WHERE (parent_comment_id IS NOT NULL);

CREATE INDEX idx_post_comments_post_id ON public.post_comments USING btree (post_id);

CREATE INDEX idx_post_comments_user_id ON public.post_comments USING btree (user_id);

CREATE INDEX idx_post_likes_created_at ON public.post_likes USING btree (created_at DESC);

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);

CREATE INDEX idx_post_shares_created_at ON public.post_shares USING btree (created_at DESC);

CREATE INDEX idx_post_shares_post_id ON public.post_shares USING btree (post_id);

CREATE INDEX idx_post_shares_user_id ON public.post_shares USING btree (user_id);

CREATE INDEX idx_posts_location ON public.posts USING btree (location) WHERE (location IS NOT NULL);

CREATE INDEX idx_posts_premium ON public.posts USING btree (is_premium) WHERE (is_premium = true);

CREATE INDEX idx_posts_public ON public.posts USING btree (is_public) WHERE (is_public = true);

CREATE INDEX idx_posts_type ON public.posts USING btree (post_type);

CREATE INDEX idx_prediction_logs_error ON public.ai_prediction_logs USING btree (error_message) WHERE (error_message IS NOT NULL);

CREATE INDEX idx_prediction_logs_method ON public.ai_prediction_logs USING btree (method);

CREATE INDEX idx_prediction_logs_timestamp ON public.ai_prediction_logs USING btree ("timestamp" DESC);

CREATE INDEX idx_profile_cache_expires ON public.profile_cache USING btree (expires_at);

CREATE INDEX idx_profile_cache_key ON public.profile_cache USING btree (cache_key);

CREATE INDEX idx_profile_cache_profile_id ON public.profile_cache USING btree (profile_id);

CREATE INDEX idx_profiles_filters_composite ON public.profiles USING btree (is_verified, updated_at DESC) WHERE (is_verified = true);

CREATE INDEX idx_profiles_gender ON public.profiles USING btree (gender) WHERE (gender IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_profiles_id_verified ON public.profiles USING btree (id_verified);

CREATE INDEX idx_profiles_interests_gin ON public.profiles USING gin (interests) WHERE ((interests IS NOT NULL) AND (array_length(interests, 1) > 0));

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);

CREATE INDEX idx_profiles_is_blocked ON public.profiles USING btree (is_blocked);

CREATE INDEX idx_profiles_is_demo_active ON public.profiles USING btree (is_demo, is_active) WHERE (is_active = true);

CREATE INDEX idx_profiles_last_active ON public.profiles USING btree (last_active);

CREATE INDEX idx_profiles_lifestyle_preferences ON public.profiles USING gin (lifestyle_preferences);

CREATE INDEX idx_profiles_location ON public.profiles USING btree (location);

CREATE INDEX idx_profiles_location_preferences ON public.profiles USING gin (location_preferences);

CREATE INDEX idx_profiles_personality_traits ON public.profiles USING gin (personality_traits);

CREATE INDEX IF NOT EXISTS idx_profiles_photo_verified ON public.profiles USING btree (photo_verified);

CREATE INDEX idx_profiles_suspension_end_date ON public.profiles USING btree (suspension_end_date);

CREATE INDEX IF NOT EXISTS idx_profiles_verification_level ON public.profiles USING btree (verification_level);

CREATE INDEX idx_referral_rewards_claimed ON public.referral_rewards USING btree (claimed);

CREATE INDEX idx_referral_rewards_code ON public.referral_rewards USING btree (referral_code);

CREATE INDEX idx_referral_rewards_created_at ON public.referral_rewards USING btree (created_at DESC);

CREATE INDEX idx_referral_rewards_invited_id ON public.referral_rewards USING btree (invited_id);

CREATE INDEX idx_referral_rewards_inviter_id ON public.referral_rewards USING btree (inviter_id);

CREATE INDEX idx_referral_rewards_referral_code ON public.referral_rewards USING btree (referral_code);

CREATE INDEX idx_referral_rewards_reward_type ON public.referral_rewards USING btree (reward_type);

CREATE INDEX idx_referral_rewards_status ON public.referral_rewards USING btree (status);

CREATE INDEX idx_referral_rewards_user_id ON public.referral_rewards USING btree (user_id);

CREATE INDEX idx_referral_statistics_period_end ON public.referral_statistics USING btree (period_end);

CREATE INDEX idx_referral_statistics_period_start ON public.referral_statistics USING btree (period_start);

CREATE INDEX idx_referral_statistics_referral_code ON public.referral_statistics USING btree (referral_code);

CREATE INDEX idx_referral_statistics_user_id ON public.referral_statistics USING btree (user_id);

CREATE INDEX idx_referral_transactions_created_at ON public.referral_transactions USING btree (created_at DESC);

CREATE INDEX idx_referral_transactions_referral_code ON public.referral_transactions USING btree (referral_code);

CREATE INDEX idx_referral_transactions_related_reward_id ON public.referral_transactions USING btree (related_reward_id);

CREATE INDEX idx_referral_transactions_transaction_type ON public.referral_transactions USING btree (transaction_type);

CREATE INDEX idx_referral_transactions_user_id ON public.referral_transactions USING btree (user_id);

CREATE INDEX idx_report_ai_classification_priority ON public.report_ai_classification USING btree (suggested_priority);

CREATE INDEX idx_report_ai_classification_report_id ON public.report_ai_classification USING btree (report_id);

CREATE INDEX idx_report_ai_classification_reviewed ON public.report_ai_classification USING btree (human_reviewed) WHERE (human_reviewed = false);

CREATE INDEX idx_report_ai_classification_severity ON public.report_ai_classification USING btree (ai_severity);

CREATE INDEX idx_reports_ai_classified ON public.reports USING btree (ai_classified) WHERE (ai_classified = false);

CREATE INDEX idx_reports_assigned_to ON public.reports USING btree (assigned_to) WHERE (assigned_to IS NOT NULL);

CREATE INDEX idx_reports_queue_position ON public.reports USING btree (queue_position) WHERE (queue_position IS NOT NULL);

CREATE INDEX idx_reports_reported ON public.reports USING btree (reported_user_id);

CREATE INDEX idx_reports_reported_user_id ON public.reports USING btree (reported_user_id);

CREATE INDEX idx_reports_reporter ON public.reports USING btree (reporter_user_id);

CREATE INDEX idx_reports_reporter_user_id ON public.reports USING btree (reporter_user_id);

CREATE INDEX idx_reports_status_created ON public.reports USING btree (status, created_at) WHERE (status = ANY (ARRAY['pending'::text, 'reviewing'::text]));

CREATE INDEX idx_roles_active ON public.roles USING btree (is_active);

CREATE INDEX idx_room_members_room_id ON public.room_members USING btree (room_id);

CREATE INDEX idx_room_members_user_id ON public.room_members USING btree (user_id);

CREATE INDEX idx_security_alerts_created_at ON public.security_alerts USING btree (created_at);

CREATE INDEX idx_security_alerts_severity ON public.security_alerts USING btree (severity);

CREATE INDEX idx_security_alerts_status ON public.security_alerts USING btree (status);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON public.security_audit_logs USING btree (action);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ip_address ON public.security_audit_logs USING btree (ip_address);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_risk_score ON public.security_audit_logs USING btree (risk_score);

CREATE INDEX idx_security_events_created_at ON public.security_events USING btree (created_at DESC);

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);

CREATE INDEX idx_security_events_resolved ON public.security_events USING btree (resolved);

CREATE INDEX idx_security_events_severity ON public.security_events USING btree (severity);

CREATE INDEX idx_security_events_timestamp ON public.security_events USING btree ("timestamp");

CREATE INDEX idx_security_flags_created_at ON public.security_flags USING btree (created_at DESC);

CREATE INDEX idx_security_flags_flag_type ON public.security_flags USING btree (flag_type);

CREATE INDEX idx_security_flags_is_resolved ON public.security_flags USING btree (is_resolved);

CREATE INDEX idx_security_flags_severity ON public.security_flags USING btree (severity);

CREATE INDEX idx_security_flags_user_id ON public.security_flags USING btree (user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security'
      AND column_name = 'risk_level'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_security_risk_level ON public.security USING btree (risk_level)';
  END IF;
END $$;

CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires_at);

CREATE INDEX idx_sessions_token ON public.sessions USING btree (session_token);

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);

CREATE INDEX idx_staking_records_end_date ON public.staking_records USING btree (end_date);

CREATE INDEX idx_staking_records_is_active ON public.staking_records USING btree (is_active);

CREATE INDEX idx_staking_records_start_date ON public.staking_records USING btree (start_date);

CREATE INDEX idx_staking_records_token_type ON public.staking_records USING btree (token_type);

CREATE INDEX idx_stories_content_type ON public.stories USING btree (content_type);

CREATE INDEX idx_stories_created_at ON public.stories USING btree (created_at DESC);

CREATE INDEX idx_stories_engagement ON public.stories USING btree (created_at DESC, is_public) WHERE (is_public = true);

CREATE INDEX idx_stories_hashtags ON public.stories USING gin (hashtags);

CREATE INDEX idx_stories_is_public ON public.stories USING btree (is_public);

CREATE INDEX idx_stories_public_created_at ON public.stories USING btree (is_public, created_at DESC) WHERE (is_public = true);

CREATE INDEX idx_stories_user_created_at ON public.stories USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_stories_user_id ON public.stories USING btree (user_id);

CREATE INDEX idx_story_comments_created_at ON public.story_comments USING btree (created_at DESC);

CREATE INDEX idx_story_comments_is_deleted ON public.story_comments USING btree (is_deleted);

CREATE INDEX idx_story_comments_parent_comment_id ON public.story_comments USING btree (parent_comment_id);

CREATE INDEX idx_story_likes_created_at ON public.story_likes USING btree (created_at);

CREATE INDEX idx_story_likes_story_user ON public.story_likes USING btree (story_id, user_id);

CREATE INDEX idx_story_reports_created_at ON public.story_reports USING btree (created_at);

CREATE INDEX idx_story_reports_reason ON public.story_reports USING btree (reason);

CREATE INDEX idx_story_reports_reporter_user_id ON public.story_reports USING btree (reporter_user_id);

CREATE INDEX idx_story_reports_status ON public.story_reports USING btree (status);

CREATE INDEX idx_story_reports_story_id ON public.story_reports USING btree (story_id);

CREATE INDEX idx_story_shares_created_at ON public.story_shares USING btree (created_at);

CREATE INDEX idx_story_shares_share_type ON public.story_shares USING btree (share_type);

CREATE INDEX idx_stripe_events_event_type ON public.stripe_events USING btree (event_type);

CREATE INDEX idx_stripe_events_processed ON public.stripe_events USING btree (processed) WHERE (processed = false);

CREATE INDEX idx_stripe_events_stripe_event_id ON public.stripe_events USING btree (stripe_event_id);

CREATE INDEX idx_subscribers_email ON public.subscribers USING btree (email);

CREATE INDEX idx_subscribers_user_id ON public.subscribers USING btree (user_id);

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE INDEX idx_summary_feedback_helpful ON public.summary_feedback USING btree (is_helpful);

CREATE INDEX idx_summary_feedback_summary ON public.summary_feedback USING btree (summary_id);

CREATE INDEX idx_summary_feedback_user ON public.summary_feedback USING btree (user_id);

CREATE INDEX idx_summary_requests_created ON public.summary_requests USING btree (created_at DESC);

CREATE INDEX idx_summary_requests_user ON public.summary_requests USING btree (user_id);

CREATE INDEX idx_summary_requests_user_date ON public.summary_requests USING btree (user_id, created_at);

CREATE INDEX idx_swinger_interests_active ON public.swinger_interests USING btree (is_active);

CREATE INDEX idx_swinger_interests_category ON public.swinger_interests USING btree (category);

CREATE INDEX idx_system_metrics_name ON public.system_metrics USING btree (metric_name);

CREATE INDEX idx_system_metrics_type_time ON public.system_metrics USING btree (metric_type, recorded_at DESC);

CREATE INDEX idx_threat_detections_detected_at ON public.threat_detections USING btree (detected_at);

CREATE INDEX idx_threat_detections_severity ON public.threat_detections USING btree (severity);

CREATE INDEX idx_threat_detections_status ON public.threat_detections USING btree (status);

CREATE INDEX idx_threat_detections_threat_id ON public.threat_detections USING btree (threat_id);

CREATE INDEX idx_token_analytics_period ON public.token_analytics USING btree (period_type, period_start DESC);

CREATE INDEX idx_token_transactions_recent ON public.token_transactions USING btree (created_at DESC);

CREATE INDEX idx_token_transactions_status ON public.token_transactions USING btree (status);

CREATE INDEX idx_token_transactions_token_type ON public.token_transactions USING btree (token_type);

CREATE INDEX idx_token_transactions_transaction_type ON public.token_transactions USING btree (transaction_type);

CREATE INDEX idx_token_transactions_type ON public.token_transactions USING btree (token_type, created_at DESC);

CREATE INDEX idx_tokens_is_active ON public.tokens USING btree (is_active);

CREATE INDEX idx_tokens_token_code ON public.tokens USING btree (token_code);

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at DESC);

CREATE INDEX idx_transactions_type ON public.transactions USING btree (transaction_type);

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);

CREATE INDEX idx_user_activity_type ON public.user_activity USING btree (activity_type);

CREATE INDEX idx_user_activity_user_id ON public.user_activity USING btree (user_id);

CREATE INDEX idx_user_consents_document ON public.user_consents USING btree (document_path, consented_at DESC);

CREATE INDEX idx_user_explicit_preferences_user_id ON public.user_explicit_preferences USING btree (user_id);

CREATE INDEX idx_user_interests_interest_id ON public.user_interests USING btree (interest_id);

CREATE INDEX idx_user_interests_privacy ON public.user_interests USING btree (privacy_level);

CREATE INDEX idx_user_interests_user_id ON public.user_interests USING btree (user_id);

CREATE INDEX idx_user_referral_balances_cmpx_balance ON public.user_referral_balances USING btree (cmpx_balance);

CREATE INDEX idx_user_referral_balances_last_reset_date ON public.user_referral_balances USING btree (last_reset_date);

CREATE INDEX idx_user_referral_balances_referral_code ON public.user_referral_balances USING btree (referral_code);

CREATE INDEX idx_user_referral_balances_referred_by ON public.user_referral_balances USING btree (referred_by);

CREATE INDEX idx_user_referral_balances_total_referrals ON public.user_referral_balances USING btree (total_referrals);

CREATE INDEX idx_user_referral_balances_user_id ON public.user_referral_balances USING btree (user_id);

CREATE INDEX idx_user_roles_is_active ON public.user_roles USING btree (is_active);

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);

CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active);

CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions USING btree (last_activity);

CREATE INDEX idx_user_sessions_session_id ON public.user_sessions USING btree (session_id);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);

CREATE INDEX idx_user_staking_status ON public.user_staking USING btree (status);

CREATE INDEX idx_user_staking_user_id ON public.user_staking USING btree (user_id);

CREATE INDEX idx_user_suspensions_ends_at ON public.user_suspensions USING btree (ends_at);

CREATE INDEX idx_user_suspensions_is_active ON public.user_suspensions USING btree (is_active);

CREATE INDEX idx_user_suspensions_moderator_id ON public.user_suspensions USING btree (moderator_id);

CREATE INDEX idx_user_suspensions_starts_at ON public.user_suspensions USING btree (starts_at);

CREATE INDEX idx_user_token_balances_active ON public.user_token_balances USING btree (cmpx_balance, gtk_balance) WHERE ((cmpx_balance IS NOT NULL) AND (gtk_balance IS NOT NULL));

CREATE INDEX idx_user_token_balances_cmpx_balance ON public.user_token_balances USING btree (cmpx_balance);

CREATE INDEX idx_user_token_balances_gtk_balance ON public.user_token_balances USING btree (gtk_balance);

CREATE INDEX idx_user_token_balances_referral_code ON public.user_token_balances USING btree (referral_code);

CREATE INDEX idx_user_token_balances_referred_by ON public.user_token_balances USING btree (referred_by);

CREATE INDEX idx_user_tokens_referral_code ON public.user_tokens USING btree (referral_code);

CREATE INDEX idx_user_tokens_referred_by ON public.user_tokens USING btree (referred_by);

CREATE INDEX idx_user_tokens_user_id ON public.user_tokens USING btree (user_id);

CREATE INDEX idx_virtual_events_created_by ON public.virtual_events USING btree (created_by);

CREATE INDEX idx_wallet_transactions_hash ON public.wallet_transactions USING btree (transaction_hash);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);

CREATE INDEX idx_web_vitals_history_created_at ON public.web_vitals_history USING btree (created_at DESC);

CREATE INDEX idx_web_vitals_history_user_id ON public.web_vitals_history USING btree (user_id);

CREATE INDEX idx_web_vitals_timestamp ON public.web_vitals_history USING btree ("timestamp" DESC);

CREATE INDEX idx_web_vitals_url ON public.web_vitals_history USING btree (url);

CREATE INDEX idx_web_vitals_user_id ON public.web_vitals_history USING btree (user_id) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_worldid_rewards_claimed ON public.worldid_rewards USING btree (claimed);

CREATE INDEX idx_worldid_rewards_user_id ON public.worldid_rewards USING btree (user_id);

CREATE INDEX idx_worldid_rewards_verification_id ON public.worldid_rewards USING btree (verification_id);

CREATE INDEX idx_worldid_statistics_period ON public.worldid_statistics USING btree (period_start, period_end);

CREATE INDEX idx_worldid_verifications_active ON public.worldid_verifications USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_worldid_verifications_level ON public.worldid_verifications USING btree (verification_level);

CREATE INDEX idx_worldid_verifications_nullifier_hash ON public.worldid_verifications USING btree (nullifier_hash);

CREATE INDEX idx_worldid_verifications_user_id ON public.worldid_verifications USING btree (user_id);

CREATE UNIQUE INDEX image_metadata_pkey ON public.image_metadata USING btree (id);

CREATE UNIQUE INDEX image_permissions_image_id_granted_to_key ON public.image_permissions USING btree (image_id, granted_to);

CREATE UNIQUE INDEX image_permissions_pkey ON public.image_permissions USING btree (id);

CREATE UNIQUE INDEX investment_returns_pkey ON public.investment_returns USING btree (id);

CREATE UNIQUE INDEX invitation_analytics_pkey ON public.invitation_analytics USING btree (id);

CREATE UNIQUE INDEX invitation_responses_invitation_id_key ON public.invitation_responses USING btree (invitation_id);

CREATE UNIQUE INDEX invitation_responses_pkey ON public.invitation_responses USING btree (id);

CREATE UNIQUE INDEX invitations_from_profile_to_profile_type_key ON public.invitations USING btree (from_profile, to_profile, type);

CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (id);

CREATE UNIQUE INDEX match_interactions_pkey ON public.match_interactions USING btree (id);

CREATE UNIQUE INDEX matches_user1_id_user2_id_key ON public.matches USING btree (user1_id, user2_id);

CREATE UNIQUE INDEX media_access_logs_pkey ON public.media_access_logs USING btree (id);

CREATE UNIQUE INDEX media_pkey ON public.media USING btree (id);

CREATE UNIQUE INDEX mfa_settings_pkey ON public.mfa_settings USING btree (id);

CREATE UNIQUE INDEX mfa_settings_user_id_key ON public.mfa_settings USING btree (user_id);

CREATE UNIQUE INDEX moderator_requests_user_id_key ON public.moderator_requests USING btree (user_id);

CREATE UNIQUE INDEX moderators_user_id_key ON public.moderators USING btree (user_id);

CREATE UNIQUE INDEX notification_history_pkey ON public.notification_history USING btree (id);

CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id);

CREATE UNIQUE INDEX notification_preferences_user_id_notification_type_key ON public.notification_preferences USING btree (user_id, notification_type);

CREATE UNIQUE INDEX pending_rewards_pkey ON public.pending_rewards USING btree (id);

CREATE UNIQUE INDEX performance_logs_pkey ON public.performance_logs USING btree (id);

CREATE UNIQUE INDEX post_comments_pkey ON public.post_comments USING btree (id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (id);

CREATE UNIQUE INDEX post_likes_post_id_user_id_key ON public.post_likes USING btree (post_id, user_id);

CREATE UNIQUE INDEX post_shares_pkey ON public.post_shares USING btree (id);

CREATE UNIQUE INDEX post_shares_post_id_user_id_share_type_key ON public.post_shares USING btree (post_id, user_id, share_type);

CREATE UNIQUE INDEX premium_access_pkey ON public.premium_access USING btree (id);

CREATE UNIQUE INDEX profile_cache_pkey ON public.profile_cache USING btree (id);

CREATE UNIQUE INDEX profiles_name_key ON public.profiles USING btree (name);

CREATE UNIQUE INDEX referral_rewards_referral_code_key ON public.referral_rewards USING btree (referral_code);

CREATE UNIQUE INDEX referral_statistics_user_id_period_start_key ON public.referral_statistics USING btree (user_id, period_start);

CREATE UNIQUE INDEX room_members_pkey ON public.room_members USING btree (id);

CREATE UNIQUE INDEX security_alerts_pkey ON public.security_alerts USING btree (id);

CREATE UNIQUE INDEX security_configurations_config_key_key ON public.security_configurations USING btree (config_key);

CREATE UNIQUE INDEX security_configurations_pkey ON public.security_configurations USING btree (id);

CREATE UNIQUE INDEX security_flags_pkey ON public.security_flags USING btree (id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE UNIQUE INDEX sessions_session_token_key ON public.sessions USING btree (session_token);

CREATE UNIQUE INDEX story_reports_pkey ON public.story_reports USING btree (id);

CREATE UNIQUE INDEX story_reports_story_id_reporter_user_id_key ON public.story_reports USING btree (story_id, reporter_user_id);

CREATE UNIQUE INDEX story_shares_story_id_user_id_platform_key ON public.story_shares USING btree (story_id, user_id, platform);

CREATE UNIQUE INDEX stripe_events_pkey ON public.stripe_events USING btree (id);

CREATE UNIQUE INDEX stripe_events_stripe_event_id_key ON public.stripe_events USING btree (stripe_event_id);

CREATE UNIQUE INDEX subscribers_email_key ON public.subscribers USING btree (email);

CREATE UNIQUE INDEX subscribers_pkey ON public.subscribers USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX summary_feedback_pkey ON public.summary_feedback USING btree (id);

CREATE UNIQUE INDEX swinger_interests_name_key ON public.swinger_interests USING btree (name);

CREATE UNIQUE INDEX system_metrics_pkey ON public.system_metrics USING btree (id);

CREATE UNIQUE INDEX threat_detections_pkey ON public.threat_detections USING btree (id);

CREATE UNIQUE INDEX threat_detections_threat_id_key ON public.threat_detections USING btree (threat_id);

CREATE UNIQUE INDEX token_analytics_period_type_period_start_key ON public.token_analytics USING btree (period_type, period_start);

CREATE UNIQUE INDEX tokens_pkey ON public.tokens USING btree (id);

CREATE UNIQUE INDEX tokens_token_code_key ON public.tokens USING btree (token_code);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX two_factor_auth_user_id_method_key ON public.two_factor_auth USING btree (user_id, method);

CREATE UNIQUE INDEX unique_invitation_statistics_user_period ON public.invitation_statistics USING btree (user_id, period_start, period_end);

CREATE UNIQUE INDEX unique_model_period ON public.ai_model_metrics USING btree (model_version, period_start, period_end);

CREATE UNIQUE INDEX unique_profile_cache_key ON public.profile_cache USING btree (profile_id, cache_key);

CREATE UNIQUE INDEX unique_summary_feedback ON public.summary_feedback USING btree (summary_id, user_id);

CREATE UNIQUE INDEX unique_user_couple_profile ON public.couple_profiles USING btree (user_id);

CREATE UNIQUE INDEX unique_user_profile ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX unique_user_reward ON public.pending_rewards USING btree (user_id, reward_type);

CREATE UNIQUE INDEX unique_user_testnet_claim ON public.testnet_token_claims USING btree (user_id);

CREATE UNIQUE INDEX unique_user_tokens ON public.user_tokens USING btree (user_id);

CREATE UNIQUE INDEX user_2fa_settings_pkey ON public.user_2fa_settings USING btree (id);

CREATE UNIQUE INDEX user_2fa_settings_user_id_key ON public.user_2fa_settings USING btree (user_id);

CREATE UNIQUE INDEX user_activity_pkey ON public.user_activity USING btree (id);

CREATE UNIQUE INDEX user_device_tokens_user_id_device_token_key ON public.user_device_tokens USING btree (user_id, device_token);

CREATE UNIQUE INDEX user_explicit_preferences_pkey ON public.user_explicit_preferences USING btree (id);

CREATE UNIQUE INDEX user_explicit_preferences_user_id_preference_id_key ON public.user_explicit_preferences USING btree (user_id, preference_id);

CREATE UNIQUE INDEX user_interests_user_id_interest_id_key ON public.user_interests USING btree (user_id, interest_id);

CREATE UNIQUE INDEX user_likes_pkey ON public.user_likes USING btree (id);

CREATE UNIQUE INDEX user_likes_user_id_liked_user_id_key ON public.user_likes USING btree (user_id, liked_user_id);

CREATE UNIQUE INDEX user_notification_preferences_pkey ON public.user_notification_preferences USING btree (id);

CREATE UNIQUE INDEX user_notification_preferences_user_id_notification_type_del_key ON public.user_notification_preferences USING btree (user_id, notification_type, delivery_method);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);

CREATE UNIQUE INDEX user_staking_pkey ON public.user_staking USING btree (id);

CREATE UNIQUE INDEX user_token_balances_referral_code_key ON public.user_token_balances USING btree (referral_code);

CREATE UNIQUE INDEX user_tokens_pkey ON public.user_tokens USING btree (id);

CREATE UNIQUE INDEX user_tokens_referral_code_key ON public.user_tokens USING btree (referral_code);

CREATE UNIQUE INDEX user_tokens_referral_code_unique ON public.user_tokens USING btree (referral_code);

CREATE UNIQUE INDEX wallet_transactions_pkey ON public.wallet_transactions USING btree (id);

CREATE UNIQUE INDEX worldid_rewards_pkey ON public.worldid_rewards USING btree (id);

CREATE UNIQUE INDEX worldid_statistics_pkey ON public.worldid_statistics USING btree (id);

CREATE UNIQUE INDEX worldid_verifications_nullifier_hash_key ON public.worldid_verifications USING btree (nullifier_hash);

-- CREATE INDEX idx_clubs_location ON public.clubs USING gist (public.ll_to_earth(latitude, longitude));
-- Nota: El tipo earth no existe en el esquema actual

CREATE INDEX idx_consent_verifications_chat_id ON public.consent_verifications USING btree (chat_id);

CREATE INDEX idx_couple_agreements_status ON public.couple_agreements USING btree (status, dispute_deadline) WHERE (status = ANY (ARRAY['ACTIVE'::text, 'DISPUTED'::text]));

CREATE INDEX idx_couple_disputes_agreement_id ON public.couple_disputes USING btree (agreement_id);

CREATE INDEX idx_couple_disputes_created_at ON public.couple_disputes USING btree (deadline_at, status);

CREATE INDEX idx_couple_disputes_deadline ON public.couple_disputes USING btree (created_at) WHERE (resolution_type IS NULL);

CREATE INDEX idx_couple_profiles_status ON public.couple_profiles USING btree (status) WHERE (status <> 'ACTIVE'::text);

CREATE INDEX idx_daily_token_claims_user_date ON public.daily_token_claims USING btree (user_id, claim_date DESC);

CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs USING btree (created_at DESC);

CREATE INDEX idx_moderation_logs_target_id ON public.moderation_logs USING btree (target_id);

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_permanent_bans_banned_at ON public.permanent_bans USING btree (banned_at DESC);

CREATE INDEX idx_permanent_bans_combined_hash ON public.permanent_bans USING btree (combined_hash) WHERE (combined_hash IS NOT NULL);

CREATE INDEX idx_profiles_age ON public.profiles USING btree (age);

CREATE INDEX idx_profiles_s2_active ON public.profiles USING btree (s2_cell_id, updated_at DESC) WHERE ((s2_cell_id IS NOT NULL) AND (blocked_at IS NULL));

CREATE INDEX idx_reports_content_type ON public.reports USING btree (content_type);

CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at);

CREATE INDEX idx_reports_status ON public.reports USING btree (status);

CREATE INDEX idx_roles_name ON public.roles USING btree (name);

CREATE INDEX idx_testnet_token_claims_wallet ON public.testnet_token_claims USING btree (wallet_address) WHERE (wallet_address IS NOT NULL);

CREATE INDEX idx_token_analytics_created_at ON public.token_analytics USING btree (created_at);

CREATE INDEX idx_token_transactions_created_at ON public.token_transactions USING btree (created_at);

CREATE INDEX idx_virtual_events_start_time ON public.virtual_events USING btree (start_time DESC);

CREATE UNIQUE INDEX IF NOT EXISTS roles_name_key ON public.roles USING btree (name);

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_pkey" PRIMARY KEY using index "ai_compatibility_scores_pkey";

alter table "public"."ai_model_metrics" add constraint "ai_model_metrics_pkey" PRIMARY KEY using index "ai_model_metrics_pkey";

alter table "public"."ai_prediction_logs" add constraint "ai_prediction_logs_pkey" PRIMARY KEY using index "ai_prediction_logs_pkey";

alter table "public"."apk_downloads" add constraint "apk_downloads_pkey" PRIMARY KEY using index "apk_downloads_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."automation_rules" add constraint "automation_rules_pkey" PRIMARY KEY using index "automation_rules_pkey";

alter table "public"."biometric_challenges" add constraint "biometric_challenges_pkey" PRIMARY KEY using index "biometric_challenges_pkey";

alter table "public"."biometric_credentials" add constraint "biometric_credentials_pkey" PRIMARY KEY using index "biometric_credentials_pkey";

alter table "public"."biometric_sessions" add constraint "biometric_sessions_pkey" PRIMARY KEY using index "biometric_sessions_pkey";

alter table "public"."blocked_ips" add constraint "blocked_ips_pkey" PRIMARY KEY using index "blocked_ips_pkey";

alter table "public"."blocks" add constraint "blocks_pkey" PRIMARY KEY using index "blocks_pkey";

alter table "public"."chat_invitations" add constraint "chat_invitations_pkey" PRIMARY KEY using index "chat_invitations_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."club_checkins" add constraint "club_checkins_pkey" PRIMARY KEY using index "club_checkins_pkey";

alter table "public"."club_flyers" add constraint "club_flyers_pkey" PRIMARY KEY using index "club_flyers_pkey";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'club_reviews'
      AND c.conname = 'club_reviews_pkey'
  ) THEN
    EXECUTE 'alter table "public"."club_reviews" add constraint "club_reviews_pkey" PRIMARY KEY using index "club_reviews_pkey"';
  END IF;
END $$;

alter table "public"."club_verifications" add constraint "club_verifications_pkey" PRIMARY KEY using index "club_verifications_pkey";

alter table "public"."comment_likes" add constraint "comment_likes_pkey" PRIMARY KEY using index "comment_likes_pkey";

alter table "public"."compatibility_scores" add constraint "compatibility_scores_pkey" PRIMARY KEY using index "compatibility_scores_pkey";

alter table "public"."content_moderation" add constraint "content_moderation_pkey" PRIMARY KEY using index "content_moderation_pkey";

alter table "public"."couple_favorites" add constraint "couple_favorites_pkey" PRIMARY KEY using index "couple_favorites_pkey";

alter table "public"."couple_gifts" add constraint "couple_gifts_pkey" PRIMARY KEY using index "couple_gifts_pkey";

alter table "public"."couple_interactions" add constraint "couple_interactions_pkey" PRIMARY KEY using index "couple_interactions_pkey";

alter table "public"."couple_matches" add constraint "couple_matches_pkey" PRIMARY KEY using index "couple_matches_pkey";

alter table "public"."couple_messages" add constraint "couple_messages_pkey" PRIMARY KEY using index "couple_messages_pkey";

alter table "public"."couple_profile_matches" add constraint "couple_profile_matches_pkey" PRIMARY KEY using index "couple_profile_matches_pkey";

alter table "public"."couple_profile_reports" add constraint "couple_profile_reports_pkey" PRIMARY KEY using index "couple_profile_reports_pkey";

alter table "public"."couple_profile_views" add constraint "couple_profile_views_pkey" PRIMARY KEY using index "couple_profile_views_pkey";

alter table "public"."couple_reports" add constraint "couple_reports_pkey" PRIMARY KEY using index "couple_reports_pkey";

alter table "public"."couple_statistics" add constraint "couple_statistics_pkey" PRIMARY KEY using index "couple_statistics_pkey";

alter table "public"."couple_verifications" add constraint "couple_verifications_pkey" PRIMARY KEY using index "couple_verifications_pkey";

alter table "public"."explicit_preferences" add constraint "explicit_preferences_pkey" PRIMARY KEY using index "explicit_preferences_pkey";

alter table "public"."faq_items" add constraint "faq_items_pkey" PRIMARY KEY using index "faq_items_pkey";

alter table "public"."favorites" add constraint "favorites_pkey" PRIMARY KEY using index "favorites_pkey";

alter table "public"."follows" add constraint "follows_pkey" PRIMARY KEY using index "follows_pkey";

alter table "public"."fraud_analysis" add constraint "fraud_analysis_pkey" PRIMARY KEY using index "fraud_analysis_pkey";

alter table "public"."gallery_access_requests" add constraint "gallery_access_requests_pkey" PRIMARY KEY using index "gallery_access_requests_pkey";

alter table "public"."gallery_unlocks" add constraint "gallery_unlocks_pkey" PRIMARY KEY using index "gallery_unlocks_pkey";

alter table "public"."image_metadata" add constraint "image_metadata_pkey" PRIMARY KEY using index "image_metadata_pkey";

alter table "public"."image_permissions" add constraint "image_permissions_pkey" PRIMARY KEY using index "image_permissions_pkey";

alter table "public"."investment_returns" add constraint "investment_returns_pkey" PRIMARY KEY using index "investment_returns_pkey";

alter table "public"."invitation_analytics" add constraint "invitation_analytics_pkey" PRIMARY KEY using index "invitation_analytics_pkey";

alter table "public"."invitation_responses" add constraint "invitation_responses_pkey" PRIMARY KEY using index "invitation_responses_pkey";

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";

alter table "public"."match_interactions" add constraint "match_interactions_pkey" PRIMARY KEY using index "match_interactions_pkey";

alter table "public"."media" add constraint "media_pkey" PRIMARY KEY using index "media_pkey";

alter table "public"."media_access_logs" add constraint "media_access_logs_pkey" PRIMARY KEY using index "media_access_logs_pkey";

alter table "public"."mfa_settings" add constraint "mfa_settings_pkey" PRIMARY KEY using index "mfa_settings_pkey";

alter table "public"."notification_history" add constraint "notification_history_pkey" PRIMARY KEY using index "notification_history_pkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_pkey" PRIMARY KEY using index "notification_preferences_pkey";

alter table "public"."pending_rewards" add constraint "pending_rewards_pkey" PRIMARY KEY using index "pending_rewards_pkey";

alter table "public"."performance_logs" add constraint "performance_logs_pkey" PRIMARY KEY using index "performance_logs_pkey";

alter table "public"."post_comments" add constraint "post_comments_pkey" PRIMARY KEY using index "post_comments_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."post_shares" add constraint "post_shares_pkey" PRIMARY KEY using index "post_shares_pkey";

alter table "public"."premium_access" add constraint "premium_access_pkey" PRIMARY KEY using index "premium_access_pkey";

alter table "public"."profile_cache" add constraint "profile_cache_pkey" PRIMARY KEY using index "profile_cache_pkey";

alter table "public"."room_members" add constraint "room_members_pkey" PRIMARY KEY using index "room_members_pkey";

alter table "public"."security_alerts" add constraint "security_alerts_pkey" PRIMARY KEY using index "security_alerts_pkey";

alter table "public"."security_configurations" add constraint "security_configurations_pkey" PRIMARY KEY using index "security_configurations_pkey";

alter table "public"."security_flags" add constraint "security_flags_pkey" PRIMARY KEY using index "security_flags_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."story_reports" add constraint "story_reports_pkey" PRIMARY KEY using index "story_reports_pkey";

alter table "public"."stripe_events" add constraint "stripe_events_pkey" PRIMARY KEY using index "stripe_events_pkey";

alter table "public"."subscribers" add constraint "subscribers_pkey" PRIMARY KEY using index "subscribers_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."summary_feedback" add constraint "summary_feedback_pkey" PRIMARY KEY using index "summary_feedback_pkey";

alter table "public"."system_metrics" add constraint "system_metrics_pkey" PRIMARY KEY using index "system_metrics_pkey";

alter table "public"."threat_detections" add constraint "threat_detections_pkey" PRIMARY KEY using index "threat_detections_pkey";

alter table "public"."tokens" add constraint "tokens_pkey" PRIMARY KEY using index "tokens_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."user_2fa_settings" add constraint "user_2fa_settings_pkey" PRIMARY KEY using index "user_2fa_settings_pkey";

alter table "public"."user_activity" add constraint "user_activity_pkey" PRIMARY KEY using index "user_activity_pkey";

alter table "public"."user_explicit_preferences" add constraint "user_explicit_preferences_pkey" PRIMARY KEY using index "user_explicit_preferences_pkey";

alter table "public"."user_likes" add constraint "user_likes_pkey" PRIMARY KEY using index "user_likes_pkey";

alter table "public"."user_notification_preferences" add constraint "user_notification_preferences_pkey" PRIMARY KEY using index "user_notification_preferences_pkey";

alter table "public"."user_sessions" add constraint "user_sessions_pkey" PRIMARY KEY using index "user_sessions_pkey";

alter table "public"."user_staking" add constraint "user_staking_pkey" PRIMARY KEY using index "user_staking_pkey";

alter table "public"."user_tokens" add constraint "user_tokens_pkey" PRIMARY KEY using index "user_tokens_pkey";

alter table "public"."wallet_transactions" add constraint "wallet_transactions_pkey" PRIMARY KEY using index "wallet_transactions_pkey";

alter table "public"."worldid_rewards" add constraint "worldid_rewards_pkey" PRIMARY KEY using index "worldid_rewards_pkey";

alter table "public"."worldid_statistics" add constraint "worldid_statistics_pkey" PRIMARY KEY using index "worldid_statistics_pkey";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_ai_score_check" CHECK (((ai_score IS NULL) OR ((ai_score >= (0)::numeric) AND (ai_score <= (1)::numeric)))) not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_ai_score_check";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_confidence_score_check" CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))) not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_confidence_score_check";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_final_score_check" CHECK (((final_score >= (0)::numeric) AND (final_score <= (1)::numeric))) not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_final_score_check";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_legacy_score_check" CHECK (((legacy_score IS NULL) OR ((legacy_score >= (0)::numeric) AND (legacy_score <= (1)::numeric)))) not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_legacy_score_check";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_prediction_method_check" CHECK (((prediction_method)::text = ANY ((ARRAY['ai'::character varying, 'legacy'::character varying, 'hybrid'::character varying])::text[]))) not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_prediction_method_check";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_user1_id_fkey";

alter table "public"."ai_compatibility_scores" add constraint "ai_compatibility_scores_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."ai_compatibility_scores" validate constraint "ai_compatibility_scores_user2_id_fkey";

alter table "public"."ai_model_metrics" add constraint "ai_model_metrics_accuracy_score_check" CHECK (((accuracy_score >= (0)::numeric) AND (accuracy_score <= (1)::numeric))) not valid;

alter table "public"."ai_model_metrics" validate constraint "ai_model_metrics_accuracy_score_check";

alter table "public"."ai_model_metrics" add constraint "unique_model_period" UNIQUE using index "unique_model_period";

alter table "public"."ai_prediction_logs" add constraint "ai_prediction_logs_method_check" CHECK (((method)::text = ANY ((ARRAY['ai'::character varying, 'legacy'::character varying, 'hybrid'::character varying])::text[]))) not valid;

alter table "public"."ai_prediction_logs" validate constraint "ai_prediction_logs_method_check";

alter table "public"."ai_prediction_logs" add constraint "ai_prediction_logs_prediction_time_ms_check" CHECK ((prediction_time_ms >= 0)) not valid;

alter table "public"."ai_prediction_logs" validate constraint "ai_prediction_logs_prediction_time_ms_check";

alter table "public"."ai_prediction_logs" add constraint "ai_prediction_logs_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."ai_prediction_logs" validate constraint "ai_prediction_logs_user1_id_fkey";

alter table "public"."ai_prediction_logs" add constraint "ai_prediction_logs_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."ai_prediction_logs" validate constraint "ai_prediction_logs_user2_id_fkey";

alter table "public"."analytics_events" add constraint "analytics_events_event_type_check" CHECK ((event_type = ANY (ARRAY['user_behavior'::text, 'system'::text, 'error'::text, 'performance'::text]))) not valid;

alter table "public"."analytics_events" validate constraint "analytics_events_event_type_check";

alter table "public"."apk_downloads" add constraint "apk_downloads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."apk_downloads" validate constraint "apk_downloads_user_id_fkey";

alter table "public"."app_logs" add constraint "app_logs_level_check" CHECK ((level = ANY (ARRAY['debug'::text, 'info'::text, 'warn'::text, 'error'::text]))) not valid;

alter table "public"."app_logs" validate constraint "app_logs_level_check";

alter table "public"."audit_logs" add constraint "audit_logs_action_type_check" CHECK ((action_type = ANY (ARRAY['login'::text, 'logout'::text, 'profile_update'::text, 'token_transaction'::text, 'report_created'::text, 'admin_action'::text, 'security_event'::text, 'api_call'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_action_type_check";

alter table "public"."audit_logs" add constraint "audit_logs_fraud_score_check" CHECK (((fraud_score >= (0)::numeric) AND (fraud_score <= (1)::numeric))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_fraud_score_check";

alter table "public"."audit_logs" add constraint "audit_logs_resource_type_check" CHECK ((resource_type = ANY (ARRAY['user'::text, 'profile'::text, 'token'::text, 'report'::text, 'transaction'::text, 'system'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_resource_type_check";

alter table "public"."audit_logs" add constraint "audit_logs_risk_level_check" CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_risk_level_check";

alter table "public"."audit_logs" add constraint "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_user_id_fkey";

alter table "public"."automation_rules" add constraint "automation_rules_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."automation_rules" validate constraint "automation_rules_created_by_fkey";

alter table "public"."biometric_credentials" add constraint "biometric_credentials_credential_id_key" UNIQUE using index "biometric_credentials_credential_id_key";

alter table "public"."biometric_credentials" add constraint "biometric_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."biometric_credentials" validate constraint "biometric_credentials_user_id_fkey";

alter table "public"."biometric_sessions" add constraint "biometric_sessions_session_id_key" UNIQUE using index "biometric_sessions_session_id_key";

alter table "public"."biometric_sessions" add constraint "biometric_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."biometric_sessions" validate constraint "biometric_sessions_user_id_fkey";

alter table "public"."blocks" add constraint "blocks_blocked_id_fkey" FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."blocks" validate constraint "blocks_blocked_id_fkey";

alter table "public"."blocks" add constraint "blocks_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."blocks" validate constraint "blocks_blocker_id_fkey";

alter table "public"."career_applications" add constraint "career_applications_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) not valid;

alter table "public"."career_applications" validate constraint "career_applications_reviewed_by_fkey";

alter table "public"."chat_invitations" add constraint "chat_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_invitations" validate constraint "chat_invitations_invited_by_fkey";

alter table "public"."chat_invitations" add constraint "chat_invitations_invited_user_fkey" FOREIGN KEY (invited_user) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_invitations" validate constraint "chat_invitations_invited_user_fkey";

alter table "public"."chat_invitations" add constraint "chat_invitations_room_id_fkey" FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE not valid;

alter table "public"."chat_invitations" validate constraint "chat_invitations_room_id_fkey";

alter table "public"."chat_invitations" add constraint "chat_invitations_room_id_invited_user_key" UNIQUE using index "chat_invitations_room_id_invited_user_key";

alter table "public"."chat_invitations" add constraint "chat_invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text]))) not valid;

alter table "public"."chat_invitations" validate constraint "chat_invitations_status_check";

alter table "public"."chat_members" add constraint "chat_members_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_members" validate constraint "chat_members_profile_id_fkey";

alter table "public"."chat_members" add constraint "chat_members_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'moderator'::text, 'member'::text]))) not valid;

alter table "public"."chat_members" validate constraint "chat_members_role_check";

alter table "public"."chat_members" add constraint "chat_members_room_id_fkey" FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE not valid;

alter table "public"."chat_members" validate constraint "chat_members_room_id_fkey";

alter table "public"."chat_members" add constraint "chat_members_room_id_profile_id_key" UNIQUE using index "chat_members_room_id_profile_id_key";

alter table "public"."chat_messages" add constraint "chat_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_sender_id_fkey";

alter table "public"."chat_rooms" add constraint "chat_rooms_type_check" CHECK ((type = ANY (ARRAY['public'::text, 'private'::text, 'group'::text]))) not valid;

alter table "public"."chat_rooms" validate constraint "chat_rooms_type_check";

alter table "public"."chat_summaries" add constraint "chat_summaries_method_check" CHECK (((method)::text = ANY ((ARRAY['gpt4'::character varying, 'bart'::character varying, 'fallback'::character varying])::text[]))) not valid;

alter table "public"."chat_summaries" validate constraint "chat_summaries_method_check";

alter table "public"."chat_summaries" add constraint "chat_summaries_sentiment_check" CHECK (((sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying])::text[]))) not valid;

alter table "public"."chat_summaries" validate constraint "chat_summaries_sentiment_check";

alter table "public"."club_checkins" add constraint "club_checkins_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE not valid;

alter table "public"."club_checkins" validate constraint "club_checkins_club_id_fkey";

alter table "public"."club_checkins" add constraint "club_checkins_distance_meters_check" CHECK ((distance_meters >= (0)::numeric)) not valid;

alter table "public"."club_checkins" validate constraint "club_checkins_distance_meters_check";

alter table "public"."club_checkins" add constraint "club_checkins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."club_checkins" validate constraint "club_checkins_user_id_fkey";

alter table "public"."club_flyers" add constraint "club_flyers_ai_processing_status_check" CHECK ((ai_processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."club_flyers" validate constraint "club_flyers_ai_processing_status_check";

alter table "public"."club_flyers" add constraint "club_flyers_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE not valid;

alter table "public"."club_flyers" validate constraint "club_flyers_club_id_fkey";

alter table "public"."club_flyers" add constraint "club_flyers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."club_flyers" validate constraint "club_flyers_created_by_fkey";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'club_reviews'
      AND column_name = 'checkin_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'club_reviews'
      AND c.conname = 'club_reviews_checkin_id_fkey'
  ) THEN
    EXECUTE 'alter table "public"."club_reviews" add constraint "club_reviews_checkin_id_fkey" FOREIGN KEY (checkin_id) REFERENCES public.club_checkins(id) not valid';
    EXECUTE 'alter table "public"."club_reviews" validate constraint "club_reviews_checkin_id_fkey"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'club_reviews'
      AND column_name = 'club_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'club_reviews'
      AND c.conname = 'club_reviews_club_id_fkey'
  ) THEN
    EXECUTE 'alter table "public"."club_reviews" add constraint "club_reviews_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE not valid';
    EXECUTE 'alter table "public"."club_reviews" validate constraint "club_reviews_club_id_fkey"';
  END IF;
END $$;

alter table "public"."club_reviews" add constraint "club_reviews_club_id_user_id_key" UNIQUE using index "club_reviews_club_id_user_id_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'club_reviews'
      AND c.conname = 'club_reviews_helpful_count_check'
  ) THEN
    EXECUTE 'alter table "public"."club_reviews" add constraint "club_reviews_helpful_count_check" CHECK ((helpful_count >= 0)) not valid';
    EXECUTE 'alter table "public"."club_reviews" validate constraint "club_reviews_helpful_count_check"';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'club_reviews'
      AND c.conname = 'club_reviews_rating_check'
  ) THEN
    EXECUTE 'alter table "public"."club_reviews" add constraint "club_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid';
    EXECUTE 'alter table "public"."club_reviews" validate constraint "club_reviews_rating_check"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'club_reviews'
      AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'club_reviews'
      AND c.conname = 'club_reviews_user_id_fkey'
  ) THEN
    EXECUTE 'alter table "public"."club_reviews" add constraint "club_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid';
    EXECUTE 'alter table "public"."club_reviews" validate constraint "club_reviews_user_id_fkey"';
  END IF;
END $$;

alter table "public"."club_verifications" add constraint "club_verifications_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE not valid;

alter table "public"."club_verifications" validate constraint "club_verifications_club_id_fkey";

alter table "public"."club_verifications" add constraint "club_verifications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'revoked'::text]))) not valid;

alter table "public"."club_verifications" validate constraint "club_verifications_status_check";

alter table "public"."club_verifications" add constraint "club_verifications_verification_type_check" CHECK ((verification_type = ANY (ARRAY['admin'::text, 'partner'::text, 'auto'::text]))) not valid;

alter table "public"."club_verifications" validate constraint "club_verifications_verification_type_check";

alter table "public"."club_verifications" add constraint "club_verifications_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) not valid;

alter table "public"."club_verifications" validate constraint "club_verifications_verified_by_fkey";

alter table "public"."clubs" add constraint "clubs_check_in_count_check" CHECK ((check_in_count >= 0)) not valid;

alter table "public"."clubs" validate constraint "clubs_check_in_count_check";

alter table "public"."clubs" add constraint "clubs_check_in_radius_meters_check" CHECK ((check_in_radius_meters > 0)) not valid;

alter table "public"."clubs" validate constraint "clubs_check_in_radius_meters_check";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'rating_average'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'clubs'
      AND c.conname = 'clubs_rating_average_check'
  ) THEN
    EXECUTE 'alter table "public"."clubs" add constraint "clubs_rating_average_check" CHECK (((rating_average >= (0)::numeric) AND (rating_average <= (5)::numeric))) not valid';
    EXECUTE 'alter table "public"."clubs" validate constraint "clubs_rating_average_check"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'rating_count'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'clubs'
      AND c.conname = 'clubs_rating_count_check'
  ) THEN
    EXECUTE 'alter table "public"."clubs" add constraint "clubs_rating_count_check" CHECK ((rating_count >= 0)) not valid';
    EXECUTE 'alter table "public"."clubs" validate constraint "clubs_rating_count_check"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'review_count'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'clubs'
      AND c.conname = 'clubs_review_count_check'
  ) THEN
    EXECUTE 'alter table "public"."clubs" add constraint "clubs_review_count_check" CHECK ((review_count >= 0)) not valid';
    EXECUTE 'alter table "public"."clubs" validate constraint "clubs_review_count_check"';
  END IF;
END $$;

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_bonus_cmpx_check" CHECK ((bonus_cmpx >= 0)) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_bonus_cmpx_check";

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_cmpx_amount_check" CHECK ((cmpx_amount > 0)) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_cmpx_amount_check";

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_payment_status_check";

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_price_mxn_check" CHECK ((price_mxn > (0)::numeric)) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_price_mxn_check";

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_status_check";

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_total_cmpx_check" CHECK ((total_cmpx > 0)) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_total_cmpx_check";

alter table "public"."cmpx_shop_packages" add constraint "cmpx_shop_packages_bonus_cmpx_check" CHECK ((bonus_cmpx >= 0)) not valid;

alter table "public"."cmpx_shop_packages" validate constraint "cmpx_shop_packages_bonus_cmpx_check";

alter table "public"."cmpx_shop_packages" add constraint "cmpx_shop_packages_cmpx_amount_check" CHECK ((cmpx_amount > 0)) not valid;

alter table "public"."cmpx_shop_packages" validate constraint "cmpx_shop_packages_cmpx_amount_check";

alter table "public"."cmpx_shop_packages" add constraint "cmpx_shop_packages_price_mxn_check" CHECK ((price_mxn > (0)::numeric)) not valid;

alter table "public"."cmpx_shop_packages" validate constraint "cmpx_shop_packages_price_mxn_check";

alter table "public"."comment_likes" add constraint "comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.post_comments(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_comment_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_comment_id_user_id_key" UNIQUE using index "comment_likes_comment_id_user_id_key";

alter table "public"."comment_likes" add constraint "comment_likes_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_profile_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_user_id_fkey";

alter table "public"."compatibility_scores" add constraint "compatibility_scores_compatibility_score_check" CHECK (((compatibility_score >= (0)::numeric) AND (compatibility_score <= (1)::numeric))) not valid;

alter table "public"."compatibility_scores" validate constraint "compatibility_scores_compatibility_score_check";

alter table "public"."compatibility_scores" add constraint "compatibility_scores_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."compatibility_scores" validate constraint "compatibility_scores_user1_id_fkey";

alter table "public"."compatibility_scores" add constraint "compatibility_scores_user1_id_user2_id_key" UNIQUE using index "compatibility_scores_user1_id_user2_id_key";

alter table "public"."compatibility_scores" add constraint "compatibility_scores_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."compatibility_scores" validate constraint "compatibility_scores_user2_id_fkey";

alter table "public"."consent_verifications" add constraint "consent_verifications_confidence_check" CHECK (((confidence >= 0) AND (confidence <= 100))) not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_confidence_check";

alter table "public"."consent_verifications" add constraint "consent_verifications_consent_level_check" CHECK ((consent_level = ANY (ARRAY['explicit'::text, 'implicit'::text, 'ambiguous'::text, 'negative'::text]))) not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_consent_level_check";

alter table "public"."consent_verifications" add constraint "consent_verifications_consent_score_check" CHECK (((consent_score >= 0) AND (consent_score <= 100))) not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_consent_score_check";

alter table "public"."consent_verifications" add constraint "consent_verifications_message_id_fkey" FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_message_id_fkey";

alter table "public"."consent_verifications" add constraint "consent_verifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_recipient_id_fkey";

alter table "public"."consent_verifications" add constraint "consent_verifications_status_check" CHECK ((status = ANY (ARRAY['consent'::text, 'uncertain'::text, 'non_consent'::text, 'insufficient_data'::text]))) not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_status_check";

alter table "public"."consent_verifications" add constraint "consent_verifications_suggested_action_check" CHECK ((suggested_action = ANY (ARRAY['approve'::text, 'review'::text, 'warn'::text, 'block'::text]))) not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_suggested_action_check";

alter table "public"."consent_verifications" add constraint "consent_verifications_user_id1_fkey" FOREIGN KEY (user_id1) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_user_id1_fkey";

alter table "public"."consent_verifications" add constraint "consent_verifications_user_id2_fkey" FOREIGN KEY (user_id2) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_user_id2_fkey";

alter table "public"."consent_verifications" add constraint "consent_verifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."consent_verifications" validate constraint "consent_verifications_user_id_fkey";

alter table "public"."content_moderation" add constraint "content_moderation_content_type_check" CHECK ((content_type = ANY (ARRAY['post'::text, 'message'::text, 'profile'::text, 'image'::text, 'comment'::text]))) not valid;

alter table "public"."content_moderation" validate constraint "content_moderation_content_type_check";

alter table "public"."content_moderation" add constraint "content_moderation_moderator_id_fkey" FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."content_moderation" validate constraint "content_moderation_moderator_id_fkey";

alter table "public"."content_moderation" add constraint "content_moderation_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'flagged'::text, 'auto_approved'::text]))) not valid;

alter table "public"."content_moderation" validate constraint "content_moderation_status_check";

alter table "public"."content_moderation" add constraint "content_moderation_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."content_moderation" validate constraint "content_moderation_user_id_fkey";

alter table "public"."content_moderation" add constraint "valid_ai_confidence" CHECK (((ai_confidence >= (0)::numeric) AND (ai_confidence <= (1)::numeric))) not valid;

alter table "public"."content_moderation" validate constraint "valid_ai_confidence";

alter table "public"."couple_agreements" add constraint "couple_agreements_asset_disposition_clause_check" CHECK ((asset_disposition_clause = ANY (ARRAY['SPLIT_50_50'::text, 'ADMIN_FORFEIT'::text, 'CUSTOM'::text]))) not valid;

alter table "public"."couple_agreements" validate constraint "couple_agreements_asset_disposition_clause_check";

alter table "public"."couple_disputes" add constraint "couple_disputes_proposed_winner_id_fkey" FOREIGN KEY (proposed_winner_id) REFERENCES public.profiles(id) not valid;

alter table "public"."couple_disputes" validate constraint "couple_disputes_proposed_winner_id_fkey";

alter table "public"."couple_disputes" add constraint "couple_disputes_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES public.profiles(id) not valid;

alter table "public"."couple_disputes" validate constraint "couple_disputes_resolved_by_fkey";

alter table "public"."couple_disputes" add constraint "couple_disputes_winner_accepted_by_fkey" FOREIGN KEY (winner_accepted_by) REFERENCES public.profiles(id) not valid;

alter table "public"."couple_disputes" validate constraint "couple_disputes_winner_accepted_by_fkey";

alter table "public"."couple_events" add constraint "couple_events_cmpx_reward_check" CHECK ((cmpx_reward >= 0)) not valid;

alter table "public"."couple_events" validate constraint "couple_events_cmpx_reward_check";

alter table "public"."couple_events" add constraint "couple_events_co2_saved_check" CHECK ((co2_saved >= (0)::numeric)) not valid;

alter table "public"."couple_events" validate constraint "couple_events_co2_saved_check";

alter table "public"."couple_events" add constraint "couple_events_current_participants_check" CHECK ((current_participants >= 0)) not valid;

alter table "public"."couple_events" validate constraint "couple_events_current_participants_check";

alter table "public"."couple_events" add constraint "couple_events_event_type_check" CHECK ((event_type = ANY (ARRAY['meetup'::text, 'party'::text, 'dinner'::text, 'travel'::text, 'other'::text]))) not valid;

alter table "public"."couple_events" validate constraint "couple_events_event_type_check";

alter table "public"."couple_events" add constraint "couple_events_organizer_id_fkey" FOREIGN KEY (organizer_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."couple_events" validate constraint "couple_events_organizer_id_fkey";

alter table "public"."couple_favorites" add constraint "couple_favorites_couple_id_favorite_couple_id_key" UNIQUE using index "couple_favorites_couple_id_favorite_couple_id_key";

alter table "public"."couple_gifts" add constraint "couple_gifts_gift_type_check" CHECK ((gift_type = ANY (ARRAY['virtual'::text, 'real'::text, 'experience'::text]))) not valid;

alter table "public"."couple_gifts" validate constraint "couple_gifts_gift_type_check";

alter table "public"."couple_interactions" add constraint "couple_interactions_interaction_type_check" CHECK ((interaction_type = ANY (ARRAY['view'::text, 'like'::text, 'message'::text, 'wink'::text, 'gift'::text]))) not valid;

alter table "public"."couple_interactions" validate constraint "couple_interactions_interaction_type_check";

alter table "public"."couple_matches" add constraint "couple_matches_match_score_check" CHECK (((match_score >= (0)::numeric) AND (match_score <= (1)::numeric))) not valid;

alter table "public"."couple_matches" validate constraint "couple_matches_match_score_check";

alter table "public"."couple_matches" add constraint "couple_matches_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text]))) not valid;

alter table "public"."couple_matches" validate constraint "couple_matches_status_check";

alter table "public"."couple_messages" add constraint "couple_messages_message_type_check" CHECK ((message_type = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'gift'::text]))) not valid;

alter table "public"."couple_messages" validate constraint "couple_messages_message_type_check";

alter table "public"."couple_nft_requests" add constraint "couple_nft_requests_check" CHECK (((partner1_address)::text <> (partner2_address)::text)) not valid;

alter table "public"."couple_nft_requests" validate constraint "couple_nft_requests_check";

alter table "public"."couple_nft_requests" add constraint "couple_nft_requests_check1" CHECK ((((initiator_address)::text = (partner1_address)::text) OR ((initiator_address)::text = (partner2_address)::text))) not valid;

alter table "public"."couple_nft_requests" validate constraint "couple_nft_requests_check1";

alter table "public"."couple_profile_likes" add constraint "couple_profile_likes_couple_profile_id_liker_profile_id_key" UNIQUE using index "couple_profile_likes_couple_profile_id_liker_profile_id_key";

alter table "public"."couple_profile_likes" add constraint "couple_profile_likes_liker_profile_id_fkey" FOREIGN KEY (liker_profile_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."couple_profile_likes" validate constraint "couple_profile_likes_liker_profile_id_fkey";

alter table "public"."couple_profile_matches" add constraint "couple_profile_matches_check" CHECK ((couple_profile1_id <> couple_profile2_id)) not valid;

alter table "public"."couple_profile_matches" validate constraint "couple_profile_matches_check";

alter table "public"."couple_profile_matches" add constraint "couple_profile_matches_couple_profile1_id_couple_profile2_i_key" UNIQUE using index "couple_profile_matches_couple_profile1_id_couple_profile2_i_key";

alter table "public"."couple_profile_reports" add constraint "couple_profile_reports_couple_profile_id_reporter_profile_i_key" UNIQUE using index "couple_profile_reports_couple_profile_id_reporter_profile_i_key";

alter table "public"."couple_profile_reports" add constraint "couple_profile_reports_reason_check" CHECK (((reason)::text = ANY ((ARRAY['fake'::character varying, 'inappropriate'::character varying, 'harassment'::character varying, 'spam'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."couple_profile_reports" validate constraint "couple_profile_reports_reason_check";

alter table "public"."couple_profile_reports" add constraint "couple_profile_reports_reporter_profile_id_fkey" FOREIGN KEY (reporter_profile_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."couple_profile_reports" validate constraint "couple_profile_reports_reporter_profile_id_fkey";

alter table "public"."couple_profile_reports" add constraint "couple_profile_reports_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."couple_profile_reports" validate constraint "couple_profile_reports_reviewed_by_fkey";

alter table "public"."couple_profile_reports" add constraint "couple_profile_reports_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))) not valid;

alter table "public"."couple_profile_reports" validate constraint "couple_profile_reports_status_check";

alter table "public"."couple_profile_views" add constraint "couple_profile_views_couple_profile_id_viewer_profile_id_vi_key" UNIQUE using index "couple_profile_views_couple_profile_id_viewer_profile_id_vi_key";

alter table "public"."couple_profile_views" add constraint "couple_profile_views_viewer_profile_id_fkey" FOREIGN KEY (viewer_profile_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."couple_profile_views" validate constraint "couple_profile_views_viewer_profile_id_fkey";

alter table "public"."couple_profiles" add constraint "couple_profiles_nickname_key" UNIQUE using index "couple_profiles_nickname_key";

alter table "public"."couple_profiles" add constraint "couple_profiles_status_check" CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'FROZEN_DISPUTE'::text, 'DISSOLVED'::text]))) not valid;

alter table "public"."couple_profiles" validate constraint "couple_profiles_status_check";

alter table "public"."couple_profiles" add constraint "unique_user_couple_profile" UNIQUE using index "unique_user_couple_profile";

alter table "public"."couple_reports" add constraint "couple_reports_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."couple_reports" validate constraint "couple_reports_resolved_by_fkey";

alter table "public"."couple_reports" add constraint "couple_reports_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text]))) not valid;

alter table "public"."couple_reports" validate constraint "couple_reports_status_check";

alter table "public"."couple_statistics" add constraint "couple_statistics_couple_id_date_key" UNIQUE using index "couple_statistics_couple_id_date_key";

alter table "public"."couple_verifications" add constraint "couple_verifications_verification_status_check" CHECK ((verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."couple_verifications" validate constraint "couple_verifications_verification_status_check";

alter table "public"."couple_verifications" add constraint "couple_verifications_verification_type_check" CHECK ((verification_type = ANY (ARRAY['identity'::text, 'relationship'::text, 'photos'::text, 'video'::text]))) not valid;

alter table "public"."couple_verifications" validate constraint "couple_verifications_verification_type_check";

alter table "public"."couple_verifications" add constraint "couple_verifications_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) not valid;

alter table "public"."couple_verifications" validate constraint "couple_verifications_verified_by_fkey";

alter table "public"."event_participations" add constraint "event_participations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.couple_events(id) ON DELETE CASCADE not valid;

alter table "public"."event_participations" validate constraint "event_participations_event_id_fkey";

alter table "public"."event_participations" add constraint "event_participations_event_id_user_id_key" UNIQUE using index "event_participations_event_id_user_id_key";

alter table "public"."event_participations" add constraint "event_participations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."event_participations" validate constraint "event_participations_user_id_fkey";

alter table "public"."explicit_preferences" add constraint "explicit_preferences_name_key" UNIQUE using index "explicit_preferences_name_key";

alter table "public"."favorites" add constraint "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_user_id_fkey";

alter table "public"."follows" add constraint "follows_check" CHECK ((follower_user_id <> following_user_id)) not valid;

alter table "public"."follows" validate constraint "follows_check";

alter table "public"."follows" add constraint "follows_follower_user_id_fkey" FOREIGN KEY (follower_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_follower_user_id_fkey";

alter table "public"."follows" add constraint "follows_follower_user_id_following_user_id_key" UNIQUE using index "follows_follower_user_id_following_user_id_key";

alter table "public"."follows" add constraint "follows_following_user_id_fkey" FOREIGN KEY (following_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."follows" validate constraint "follows_following_user_id_fkey";

alter table "public"."fraud_analysis" add constraint "fraud_analysis_confidence_check" CHECK (((confidence >= (0)::numeric) AND (confidence <= (100)::numeric))) not valid;

alter table "public"."fraud_analysis" validate constraint "fraud_analysis_confidence_check";

alter table "public"."fraud_analysis" add constraint "fraud_analysis_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."fraud_analysis" validate constraint "fraud_analysis_user_id_fkey";

alter table "public"."frozen_assets" add constraint "frozen_assets_status_check" CHECK ((status = ANY (ARRAY['FROZEN'::text, 'UNFROZEN'::text, 'TRANSFERRED'::text]))) not valid;

alter table "public"."frozen_assets" validate constraint "frozen_assets_status_check";

alter table "public"."gallery_access_requests" add constraint "gallery_access_requests_requested_from_fkey" FOREIGN KEY (requested_from) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_access_requests" validate constraint "gallery_access_requests_requested_from_fkey";

alter table "public"."gallery_access_requests" add constraint "gallery_access_requests_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_access_requests" validate constraint "gallery_access_requests_requester_id_fkey";

alter table "public"."gallery_access_requests" add constraint "gallery_access_requests_requester_id_requested_from_key" UNIQUE using index "gallery_access_requests_requester_id_requested_from_key";

alter table "public"."gallery_access_requests" add constraint "gallery_access_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text]))) not valid;

alter table "public"."gallery_access_requests" validate constraint "gallery_access_requests_status_check";

alter table "public"."gallery_commissions" add constraint "gallery_commissions_amount_cmpx_check" CHECK ((amount_cmpx > 0)) not valid;

alter table "public"."gallery_commissions" validate constraint "gallery_commissions_amount_cmpx_check";

alter table "public"."gallery_commissions" add constraint "gallery_commissions_commission_amount_cmpx_check" CHECK ((commission_amount_cmpx >= 0)) not valid;

alter table "public"."gallery_commissions" validate constraint "gallery_commissions_commission_amount_cmpx_check";

alter table "public"."gallery_commissions" add constraint "gallery_commissions_commission_percentage_check" CHECK (((commission_percentage >= (0)::numeric) AND (commission_percentage <= (100)::numeric))) not valid;

alter table "public"."gallery_commissions" validate constraint "gallery_commissions_commission_percentage_check";

alter table "public"."gallery_commissions" add constraint "gallery_commissions_creator_amount_cmpx_check" CHECK ((creator_amount_cmpx >= 0)) not valid;

alter table "public"."gallery_commissions" validate constraint "gallery_commissions_creator_amount_cmpx_check";

alter table "public"."gallery_commissions" add constraint "gallery_commissions_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['view'::text, 'like'::text, 'super_like'::text, 'purchase'::text, 'tip'::text]))) not valid;

alter table "public"."gallery_commissions" validate constraint "gallery_commissions_transaction_type_check";

alter table "public"."gallery_permissions" add constraint "gallery_permissions_gallery_owner_id_fkey" FOREIGN KEY (gallery_owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."gallery_permissions" validate constraint "gallery_permissions_gallery_owner_id_fkey";

alter table "public"."gallery_permissions" add constraint "gallery_permissions_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_permissions" validate constraint "gallery_permissions_granted_by_fkey";

alter table "public"."gallery_permissions" add constraint "gallery_permissions_granted_to_fkey" FOREIGN KEY (granted_to) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_permissions" validate constraint "gallery_permissions_granted_to_fkey";

alter table "public"."gallery_permissions" add constraint "gallery_permissions_permission_type_check" CHECK ((permission_type = ANY (ARRAY['view'::text, 'download'::text, 'share'::text]))) not valid;

alter table "public"."gallery_permissions" validate constraint "gallery_permissions_permission_type_check";

alter table "public"."gallery_permissions" add constraint "gallery_permissions_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_permissions" validate constraint "gallery_permissions_profile_id_fkey";

alter table "public"."gallery_permissions" add constraint "gallery_permissions_profile_id_granted_to_permission_type_key" UNIQUE using index "gallery_permissions_profile_id_granted_to_permission_type_key";

alter table "public"."gallery_unlocks" add constraint "gallery_unlocks_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_unlocks" validate constraint "gallery_unlocks_profile_id_fkey";

alter table "public"."gallery_unlocks" add constraint "gallery_unlocks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_unlocks" validate constraint "gallery_unlocks_user_id_fkey";

alter table "public"."image_permissions" add constraint "image_permissions_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."image_permissions" validate constraint "image_permissions_granted_by_fkey";

alter table "public"."image_permissions" add constraint "image_permissions_granted_to_fkey" FOREIGN KEY (granted_to) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."image_permissions" validate constraint "image_permissions_granted_to_fkey";

alter table "public"."image_permissions" add constraint "image_permissions_image_id_fkey" FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE not valid;

alter table "public"."image_permissions" validate constraint "image_permissions_image_id_fkey";

alter table "public"."image_permissions" add constraint "image_permissions_image_id_granted_to_key" UNIQUE using index "image_permissions_image_id_granted_to_key";

alter table "public"."images" add constraint "images_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."images" validate constraint "images_profile_id_fkey";

alter table "public"."images" add constraint "images_type_check" CHECK ((type = ANY (ARRAY['profile'::text, 'gallery'::text, 'avatar'::text]))) not valid;

alter table "public"."images" validate constraint "images_type_check";

alter table "public"."investment_returns" add constraint "investment_returns_investment_id_fkey" FOREIGN KEY (investment_id) REFERENCES public.investments(id) ON DELETE CASCADE not valid;

alter table "public"."investment_returns" validate constraint "investment_returns_investment_id_fkey";

alter table "public"."investment_returns" add constraint "investment_returns_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."investment_returns" validate constraint "investment_returns_payment_status_check";

alter table "public"."investment_returns" add constraint "investment_returns_return_amount_mxn_check" CHECK ((return_amount_mxn >= (0)::numeric)) not valid;

alter table "public"."investment_returns" validate constraint "investment_returns_return_amount_mxn_check";

alter table "public"."investment_returns" add constraint "investment_returns_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'due'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text]))) not valid;

alter table "public"."investment_returns" validate constraint "investment_returns_status_check";

alter table "public"."investment_returns" add constraint "investment_returns_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."investment_returns" validate constraint "investment_returns_user_id_fkey";

alter table "public"."investment_tiers" add constraint "investment_tiers_tier_key_check" CHECK ((tier_key = ANY (ARRAY['basic_10k'::text, 'premium_25k'::text, 'vip_50k'::text]))) not valid;

alter table "public"."investment_tiers" validate constraint "investment_tiers_tier_key_check";

alter table "public"."investments" add constraint "investments_amount_mxn_check" CHECK ((amount_mxn > (0)::numeric)) not valid;

alter table "public"."investments" validate constraint "investments_amount_mxn_check";

alter table "public"."investments" add constraint "investments_cmpx_tokens_rewarded_check" CHECK ((cmpx_tokens_rewarded >= 0)) not valid;

alter table "public"."investments" validate constraint "investments_cmpx_tokens_rewarded_check";

alter table "public"."investments" add constraint "investments_equity_percentage_check" CHECK (((equity_percentage >= (0)::numeric) AND (equity_percentage <= (100)::numeric))) not valid;

alter table "public"."investments" validate constraint "investments_equity_percentage_check";

alter table "public"."investments" add constraint "investments_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."investments" validate constraint "investments_payment_status_check";

alter table "public"."investments" add constraint "investments_return_percentage_check" CHECK ((return_percentage >= (0)::numeric)) not valid;

alter table "public"."investments" validate constraint "investments_return_percentage_check";

alter table "public"."investments" add constraint "investments_return_type_check" CHECK ((return_type = ANY (ARRAY['annual'::text, 'monthly'::text, 'one_time'::text]))) not valid;

alter table "public"."investments" validate constraint "investments_return_type_check";

alter table "public"."investments" add constraint "investments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text]))) not valid;

alter table "public"."investments" validate constraint "investments_status_check";

alter table "public"."investments" add constraint "investments_tier_check" CHECK ((tier = ANY (ARRAY['basic_10k'::text, 'premium_25k'::text, 'vip_50k'::text, 'custom'::text]))) not valid;

alter table "public"."investments" validate constraint "investments_tier_check";

alter table "public"."invitation_analytics" add constraint "invitation_analytics_event_type_check" CHECK (((event_type)::text = ANY ((ARRAY['sent'::character varying, 'viewed'::character varying, 'responded'::character varying, 'expired'::character varying, 'reminder_sent'::character varying])::text[]))) not valid;

alter table "public"."invitation_analytics" validate constraint "invitation_analytics_event_type_check";

alter table "public"."invitation_analytics" add constraint "invitation_analytics_invitation_id_fkey" FOREIGN KEY (invitation_id) REFERENCES public.invitations(id) ON DELETE CASCADE not valid;

alter table "public"."invitation_analytics" validate constraint "invitation_analytics_invitation_id_fkey";

alter table "public"."invitation_responses" add constraint "invitation_responses_counter_invitation_id_fkey" FOREIGN KEY (counter_invitation_id) REFERENCES public.invitations(id) not valid;

alter table "public"."invitation_responses" validate constraint "invitation_responses_counter_invitation_id_fkey";

alter table "public"."invitation_responses" add constraint "invitation_responses_invitation_id_fkey" FOREIGN KEY (invitation_id) REFERENCES public.invitations(id) ON DELETE CASCADE not valid;

alter table "public"."invitation_responses" validate constraint "invitation_responses_invitation_id_fkey";

alter table "public"."invitation_responses" add constraint "invitation_responses_invitation_id_key" UNIQUE using index "invitation_responses_invitation_id_key";

alter table "public"."invitation_responses" add constraint "invitation_responses_response_type_check" CHECK (((response_type)::text = ANY ((ARRAY['accept'::character varying, 'decline'::character varying, 'counter_invite'::character varying])::text[]))) not valid;

alter table "public"."invitation_responses" validate constraint "invitation_responses_response_type_check";

alter table "public"."invitation_statistics" add constraint "invitation_statistics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."invitation_statistics" validate constraint "invitation_statistics_user_id_fkey";

alter table "public"."invitation_statistics" add constraint "unique_invitation_statistics_user_period" UNIQUE using index "unique_invitation_statistics_user_period";

alter table "public"."invitation_templates" add constraint "invitation_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) not valid;

alter table "public"."invitation_templates" validate constraint "invitation_templates_created_by_fkey";

alter table "public"."invitation_templates" add constraint "invitation_templates_invitation_type_check" CHECK (((invitation_type)::text = ANY ((ARRAY['profile'::character varying, 'gallery'::character varying, 'chat'::character varying, 'event'::character varying, 'meetup'::character varying])::text[]))) not valid;

alter table "public"."invitation_templates" validate constraint "invitation_templates_invitation_type_check";

alter table "public"."invitations" add constraint "invitations_from_profile_fkey" FOREIGN KEY (from_profile) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."invitations" validate constraint "invitations_from_profile_fkey";

alter table "public"."invitations" add constraint "invitations_from_profile_to_profile_type_key" UNIQUE using index "invitations_from_profile_to_profile_type_key";

alter table "public"."invitations" add constraint "invitations_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."invitations" validate constraint "invitations_inviter_id_fkey";

alter table "public"."invitations" add constraint "invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'expired'::text]))) not valid;

alter table "public"."invitations" validate constraint "invitations_status_check";

alter table "public"."invitations" add constraint "invitations_to_profile_fkey" FOREIGN KEY (to_profile) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."invitations" validate constraint "invitations_to_profile_fkey";

alter table "public"."invitations" add constraint "invitations_type_check" CHECK ((type = ANY (ARRAY['connection'::text, 'event'::text, 'group'::text]))) not valid;

alter table "public"."invitations" validate constraint "invitations_type_check";

alter table "public"."likes" add constraint "likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_user_id_fkey";

alter table "public"."match_interactions" add constraint "match_interactions_interaction_type_check" CHECK ((interaction_type = ANY (ARRAY['like'::text, 'super_like'::text, 'pass'::text, 'block'::text]))) not valid;

alter table "public"."match_interactions" validate constraint "match_interactions_interaction_type_check";

alter table "public"."match_interactions" add constraint "match_interactions_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE not valid;

alter table "public"."match_interactions" validate constraint "match_interactions_match_id_fkey";

alter table "public"."match_interactions" add constraint "match_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."match_interactions" validate constraint "match_interactions_user_id_fkey";

alter table "public"."matches" add constraint "matches_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'blocked'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_status_check";

alter table "public"."matches" add constraint "matches_user1_id_fkey" FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_user1_id_fkey";

alter table "public"."matches" add constraint "matches_user1_id_user2_id_key" UNIQUE using index "matches_user1_id_user2_id_key";

alter table "public"."matches" add constraint "matches_user2_id_fkey" FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_user2_id_fkey";

alter table "public"."media" add constraint "media_file_type_check" CHECK (((file_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'audio'::character varying, 'document'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."media" validate constraint "media_file_type_check";

alter table "public"."media" add constraint "media_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_user_id_fkey";

alter table "public"."media_access_logs" add constraint "media_access_logs_action_check" CHECK (((action)::text = ANY ((ARRAY['view'::character varying, 'download'::character varying, 'denied'::character varying, 'upload'::character varying, 'delete'::character varying])::text[]))) not valid;

alter table "public"."media_access_logs" validate constraint "media_access_logs_action_check";

alter table "public"."media_access_logs" add constraint "media_access_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."media_access_logs" validate constraint "media_access_logs_user_id_fkey";

alter table "public"."messages" add constraint "messages_message_type_check" CHECK ((message_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'system'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_message_type_check";

alter table "public"."messages" add constraint "messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_room_id_fkey";

alter table "public"."mfa_settings" add constraint "mfa_settings_user_id_key" UNIQUE using index "mfa_settings_user_id_key";

alter table "public"."moderation_logs" add constraint "moderation_logs_action_type_check" CHECK ((action_type = ANY (ARRAY['report_resolved'::text, 'user_warned'::text, 'user_suspended'::text, 'user_banned'::text, 'content_removed'::text, 'account_verified'::text, 'token_adjustment'::text, 'system_action'::text]))) not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_action_type_check";

alter table "public"."moderation_logs" add constraint "moderation_logs_moderator_id_fkey" FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_moderator_id_fkey";

alter table "public"."moderation_logs" add constraint "moderation_logs_severity_check" CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))) not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_severity_check";

alter table "public"."moderation_logs" add constraint "moderation_logs_target_type_check" CHECK ((target_type = ANY (ARRAY['user'::text, 'report'::text, 'content'::text, 'transaction'::text, 'system'::text]))) not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_target_type_check";

alter table "public"."moderation_logs" add constraint "moderation_logs_target_user_id_fkey" FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_target_user_id_fkey";

alter table "public"."moderator_payments" add constraint "moderator_payments_moderator_level_check" CHECK ((moderator_level = ANY (ARRAY['trainee'::text, 'junior'::text, 'senior'::text, 'elite'::text, 'superadmin'::text]))) not valid;

alter table "public"."moderator_payments" validate constraint "moderator_payments_moderator_level_check";

alter table "public"."moderator_payments" add constraint "moderator_payments_payment_amount_mxn_check" CHECK ((payment_amount_mxn >= (0)::numeric)) not valid;

alter table "public"."moderator_payments" validate constraint "moderator_payments_payment_amount_mxn_check";

alter table "public"."moderator_payments" add constraint "moderator_payments_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."moderator_payments" validate constraint "moderator_payments_payment_status_check";

alter table "public"."moderator_payments" add constraint "moderator_payments_quality_score_check" CHECK (((quality_score >= (0)::numeric) AND (quality_score <= (100)::numeric))) not valid;

alter table "public"."moderator_payments" validate constraint "moderator_payments_quality_score_check";

alter table "public"."moderator_payments" add constraint "moderator_payments_revenue_percentage_check" CHECK (((revenue_percentage >= (0)::numeric) AND (revenue_percentage <= (100)::numeric))) not valid;

alter table "public"."moderator_payments" validate constraint "moderator_payments_revenue_percentage_check";

alter table "public"."moderator_requests" add constraint "moderator_requests_disponibilidad_horas_check" CHECK ((disponibilidad_horas > 0)) not valid;

alter table "public"."moderator_requests" validate constraint "moderator_requests_disponibilidad_horas_check";

alter table "public"."moderator_requests" add constraint "moderator_requests_edad_check" CHECK ((edad >= 18)) not valid;

alter table "public"."moderator_requests" validate constraint "moderator_requests_edad_check";

alter table "public"."moderator_requests" add constraint "moderator_requests_user_id_key" UNIQUE using index "moderator_requests_user_id_key";

alter table "public"."moderators" add constraint "moderators_level_check" CHECK (((level)::text = ANY ((ARRAY['junior'::character varying, 'senior'::character varying, 'lead'::character varying])::text[]))) not valid;

alter table "public"."moderators" validate constraint "moderators_level_check";

alter table "public"."moderators" add constraint "moderators_role_check" CHECK ((role = ANY (ARRAY['moderator'::text, 'senior_moderator'::text, 'admin'::text]))) not valid;

alter table "public"."moderators" validate constraint "moderators_role_check";

alter table "public"."moderators" add constraint "moderators_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'inactive'::text]))) not valid;

alter table "public"."moderators" validate constraint "moderators_status_check";

alter table "public"."moderators" add constraint "moderators_user_id_key" UNIQUE using index "moderators_user_id_key";

alter table "public"."nft_staking" add constraint "nft_staking_rarity_multiplier_check" CHECK (((rarity_multiplier >= 100) AND (rarity_multiplier <= 300))) not valid;

alter table "public"."nft_staking" validate constraint "nft_staking_rarity_multiplier_check";

alter table "public"."nft_staking" add constraint "nft_staking_vesting_period_days_check" CHECK (((vesting_period_days >= 30) AND (vesting_period_days <= 365))) not valid;

alter table "public"."nft_staking" validate constraint "nft_staking_vesting_period_days_check";

alter table "public"."nft_verifications" add constraint "nft_verifications_staking_record_id_fkey" FOREIGN KEY (staking_record_id) REFERENCES public.staking_records(id) ON DELETE SET NULL not valid;

alter table "public"."nft_verifications" validate constraint "nft_verifications_staking_record_id_fkey";

alter table "public"."notification_history" add constraint "notification_history_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text]))) not valid;

alter table "public"."notification_history" validate constraint "notification_history_status_check";

alter table "public"."notification_history" add constraint "notification_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notification_history" validate constraint "notification_history_user_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notification_preferences" validate constraint "notification_preferences_user_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_user_id_notification_type_key" UNIQUE using index "notification_preferences_user_id_notification_type_key";

alter table "public"."pending_rewards" add constraint "pending_rewards_amount_check" CHECK ((amount > 0)) not valid;

alter table "public"."pending_rewards" validate constraint "pending_rewards_amount_check";

alter table "public"."pending_rewards" add constraint "pending_rewards_reward_type_check" CHECK ((reward_type = ANY (ARRAY['world_id_verification'::text, 'referral_bonus'::text, 'beta_feedback'::text, 'daily_login'::text, 'profile_completion'::text, 'first_match'::text]))) not valid;

alter table "public"."pending_rewards" validate constraint "pending_rewards_reward_type_check";

alter table "public"."pending_rewards" add constraint "pending_rewards_token_type_check" CHECK ((token_type = ANY (ARRAY['CMPX'::text, 'GTK'::text]))) not valid;

alter table "public"."pending_rewards" validate constraint "pending_rewards_token_type_check";

alter table "public"."pending_rewards" add constraint "pending_rewards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pending_rewards" validate constraint "pending_rewards_user_id_fkey";

alter table "public"."pending_rewards" add constraint "unique_user_reward" UNIQUE using index "unique_user_reward";

alter table "public"."performance_logs" add constraint "performance_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."performance_logs" validate constraint "performance_logs_user_id_fkey";

alter table "public"."permanent_bans" add constraint "permanent_bans_appeal_reviewed_by_fkey" FOREIGN KEY (appeal_reviewed_by) REFERENCES auth.users(id) not valid;

alter table "public"."permanent_bans" validate constraint "permanent_bans_appeal_reviewed_by_fkey";

alter table "public"."permanent_bans" add constraint "permanent_bans_ban_type_check" CHECK ((ban_type = ANY (ARRAY['manual'::text, 'automatic'::text, 'appeal_rejected'::text]))) not valid;

alter table "public"."permanent_bans" validate constraint "permanent_bans_ban_type_check";

alter table "public"."permanent_bans" add constraint "permanent_bans_banned_by_fkey" FOREIGN KEY (banned_by) REFERENCES auth.users(id) not valid;

alter table "public"."permanent_bans" validate constraint "permanent_bans_banned_by_fkey";

alter table "public"."permanent_bans" add constraint "permanent_bans_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."permanent_bans" validate constraint "permanent_bans_severity_check";

alter table "public"."permanent_bans" add constraint "permanent_bans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."permanent_bans" validate constraint "permanent_bans_user_id_fkey";

alter table "public"."post_comments" add constraint "comments_content_length" CHECK (((char_length(content) >= 1) AND (char_length(content) <= 500))) not valid;

alter table "public"."post_comments" validate constraint "comments_content_length";

alter table "public"."post_comments" add constraint "post_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.post_comments(id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_parent_comment_id_fkey";

alter table "public"."post_comments" add constraint "post_comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_post_id_fkey";

alter table "public"."post_comments" add constraint "post_comments_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_profile_id_fkey";

alter table "public"."post_comments" add constraint "post_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."post_comments" validate constraint "post_comments_user_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_user_id_key" UNIQUE using index "post_likes_post_id_user_id_key";

alter table "public"."post_likes" add constraint "post_likes_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_profile_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."post_likes" validate constraint "post_likes_user_id_fkey";

alter table "public"."post_shares" add constraint "post_shares_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_shares" validate constraint "post_shares_post_id_fkey";

alter table "public"."post_shares" add constraint "post_shares_post_id_user_id_share_type_key" UNIQUE using index "post_shares_post_id_user_id_share_type_key";

alter table "public"."post_shares" add constraint "post_shares_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."post_shares" validate constraint "post_shares_profile_id_fkey";

alter table "public"."post_shares" add constraint "post_shares_share_type_check" CHECK (((share_type)::text = ANY ((ARRAY['share'::character varying, 'repost'::character varying])::text[]))) not valid;

alter table "public"."post_shares" validate constraint "post_shares_share_type_check";

alter table "public"."post_shares" add constraint "post_shares_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."post_shares" validate constraint "post_shares_user_id_fkey";

alter table "public"."posts" add constraint "posts_content_length" CHECK (((char_length(content) >= 1) AND (char_length(content) <= 2000))) not valid;

alter table "public"."posts" validate constraint "posts_content_length";

alter table "public"."posts" add constraint "posts_post_type_check" CHECK (((post_type)::text = ANY ((ARRAY['text'::character varying, 'photo'::character varying, 'video'::character varying])::text[]))) not valid;

alter table "public"."posts" validate constraint "posts_post_type_check";

alter table "public"."posts" add constraint "posts_valid_media" CHECK (((((post_type)::text = 'text'::text) AND (image_url IS NULL) AND (video_url IS NULL)) OR (((post_type)::text = 'photo'::text) AND (image_url IS NOT NULL) AND (video_url IS NULL)) OR (((post_type)::text = 'video'::text) AND (video_url IS NOT NULL) AND (image_url IS NULL)))) not valid;

alter table "public"."posts" validate constraint "posts_valid_media";

alter table "public"."profile_cache" add constraint "profile_cache_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."profile_cache" validate constraint "profile_cache_profile_id_fkey";

alter table "public"."profile_cache" add constraint "unique_profile_cache_key" UNIQUE using index "unique_profile_cache_key";

alter table "public"."profiles" add constraint "profiles_account_type_check" CHECK ((account_type = ANY (ARRAY['single'::text, 'couple'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_account_type_check";

alter table "public"."profiles" add constraint "profiles_name_key" UNIQUE using index "profiles_name_key";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'moderator'::text, 'premium'::text, 'user'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "unique_user_profile" UNIQUE using index "unique_user_profile";

alter table "public"."referral_rewards" add constraint "referral_rewards_invited_id_fkey" FOREIGN KEY (invited_id) REFERENCES auth.users(id) not valid;

alter table "public"."referral_rewards" validate constraint "referral_rewards_invited_id_fkey";

alter table "public"."referral_rewards" add constraint "referral_rewards_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES auth.users(id) not valid;

alter table "public"."referral_rewards" validate constraint "referral_rewards_inviter_id_fkey";

alter table "public"."referral_rewards" add constraint "referral_rewards_referral_code_key" UNIQUE using index "referral_rewards_referral_code_key";

alter table "public"."referral_rewards" add constraint "referral_rewards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."referral_rewards" validate constraint "referral_rewards_user_id_fkey";

alter table "public"."referral_statistics" add constraint "referral_statistics_user_id_period_start_key" UNIQUE using index "referral_statistics_user_id_period_start_key";

alter table "public"."referral_transactions" add constraint "referral_transactions_related_reward_id_fkey" FOREIGN KEY (related_reward_id) REFERENCES public.referral_rewards(id) not valid;

alter table "public"."referral_transactions" validate constraint "referral_transactions_related_reward_id_fkey";

alter table "public"."referral_transactions" add constraint "referral_transactions_transaction_type_check" CHECK (((transaction_type)::text = ANY ((ARRAY['referral_earn'::character varying, 'referral_spend'::character varying, 'monthly_reset'::character varying, 'bonus_grant'::character varying])::text[]))) not valid;

alter table "public"."referral_transactions" validate constraint "referral_transactions_transaction_type_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_ai_confidence_check" CHECK (((ai_confidence >= (0)::numeric) AND (ai_confidence <= (100)::numeric))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_ai_confidence_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_ai_severity_check" CHECK ((ai_severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_ai_severity_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_detected_explicit_check" CHECK (((detected_explicit >= (0)::numeric) AND (detected_explicit <= (100)::numeric))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_detected_explicit_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_detected_harassment_check" CHECK (((detected_harassment >= (0)::numeric) AND (detected_harassment <= (100)::numeric))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_detected_harassment_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_detected_spam_check" CHECK (((detected_spam >= (0)::numeric) AND (detected_spam <= (100)::numeric))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_detected_spam_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_detected_toxicity_check" CHECK (((detected_toxicity >= (0)::numeric) AND (detected_toxicity <= (100)::numeric))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_detected_toxicity_check";

alter table "public"."report_ai_classification" add constraint "report_ai_classification_suggested_priority_check" CHECK ((suggested_priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."report_ai_classification" validate constraint "report_ai_classification_suggested_priority_check";

alter table "public"."reports" add constraint "reports_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) not valid;

alter table "public"."reports" validate constraint "reports_assigned_to_fkey";

alter table "public"."reports" add constraint "reports_content_type_check" CHECK ((content_type = ANY (ARRAY['profile'::text, 'story'::text, 'post'::text]))) not valid;

alter table "public"."reports" validate constraint "reports_content_type_check";

alter table "public"."reports" add constraint "reports_reviewing_check" CHECK ((reviewing = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text]))) not valid;

alter table "public"."reports" validate constraint "reports_reviewing_check";

alter table "public"."room_members" add constraint "room_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."room_members" validate constraint "room_members_user_id_fkey";

alter table "public"."security" add constraint "security_event_type_check" CHECK ((event_type = ANY (ARRAY['login'::text, 'logout'::text, 'failed_login'::text, 'password_change'::text, 'suspicious_activity'::text, 'account_locked'::text, 'data_access'::text]))) not valid;

alter table "public"."security" validate constraint "security_event_type_check";

alter table "public"."security_alerts" add constraint "security_alerts_acknowledged_by_fkey" FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id) not valid;

alter table "public"."security_alerts" validate constraint "security_alerts_acknowledged_by_fkey";

alter table "public"."security_alerts" add constraint "security_alerts_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."security_alerts" validate constraint "security_alerts_resolved_by_fkey";

alter table "public"."security_alerts" add constraint "security_alerts_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."security_alerts" validate constraint "security_alerts_severity_check";

alter table "public"."security_alerts" add constraint "security_alerts_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'acknowledged'::text, 'resolved'::text]))) not valid;

alter table "public"."security_alerts" validate constraint "security_alerts_status_check";

alter table "public"."security_audit_logs" add constraint "security_audit_logs_risk_score_check" CHECK (((risk_score >= 0) AND (risk_score <= 100))) not valid;

alter table "public"."security_audit_logs" validate constraint "security_audit_logs_risk_score_check";

alter table "public"."security_audit_logs" add constraint "security_audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."security_audit_logs" validate constraint "security_audit_logs_user_id_fkey";

alter table "public"."security_configurations" add constraint "security_configurations_config_key_key" UNIQUE using index "security_configurations_config_key_key";

alter table "public"."security_configurations" add constraint "security_configurations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."security_configurations" validate constraint "security_configurations_updated_by_fkey";

alter table "public"."security_events" add constraint "security_events_event_type_check" CHECK ((event_type = ANY (ARRAY['login'::text, 'logout'::text, 'suspicious_activity'::text, 'failed_login'::text, 'data_access'::text, 'admin_action'::text]))) not valid;

alter table "public"."security_events" validate constraint "security_events_event_type_check";

alter table "public"."security_events" add constraint "security_events_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."security_events" validate constraint "security_events_resolved_by_fkey";

alter table "public"."security_events" add constraint "security_events_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."security_events" validate constraint "security_events_severity_check";

alter table "public"."security_flags" add constraint "security_flags_confidence_check" CHECK (((confidence >= 0) AND (confidence <= 100))) not valid;

alter table "public"."security_flags" validate constraint "security_flags_confidence_check";

alter table "public"."security_flags" add constraint "security_flags_flag_type_check" CHECK (((flag_type)::text = ANY ((ARRAY['suspicious_login'::character varying, 'multiple_devices'::character varying, 'unusual_activity'::character varying, 'fraud_pattern'::character varying, 'account_compromise'::character varying])::text[]))) not valid;

alter table "public"."security_flags" validate constraint "security_flags_flag_type_check";

alter table "public"."security_flags" add constraint "security_flags_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."security_flags" validate constraint "security_flags_resolved_by_fkey";

alter table "public"."security_flags" add constraint "security_flags_severity_check" CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))) not valid;

alter table "public"."security_flags" validate constraint "security_flags_severity_check";

alter table "public"."security_flags" add constraint "security_flags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."security_flags" validate constraint "security_flags_user_id_fkey";

alter table "public"."sessions" add constraint "sessions_session_token_key" UNIQUE using index "sessions_session_token_key";

alter table "public"."sessions" add constraint "sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_user_id_fkey";

alter table "public"."sessions" add constraint "valid_expiry" CHECK ((expires_at > created_at)) not valid;

alter table "public"."sessions" validate constraint "valid_expiry";

alter table "public"."staking_records" add constraint "staking_records_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."staking_records" validate constraint "staking_records_status_check";

alter table "public"."staking_records" add constraint "staking_records_token_type_check" CHECK (((token_type)::text = ANY ((ARRAY['CMPX'::character varying, 'GTK'::character varying])::text[]))) not valid;

alter table "public"."staking_records" validate constraint "staking_records_token_type_check";

alter table "public"."stories" add constraint "stories_content_type_check" CHECK (((content_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'text'::character varying])::text[]))) not valid;

alter table "public"."stories" validate constraint "stories_content_type_check";

alter table "public"."story_comments" add constraint "story_comments_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE not valid;

alter table "public"."story_comments" validate constraint "story_comments_story_id_fkey";

alter table "public"."story_likes" add constraint "story_likes_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE not valid;

alter table "public"."story_likes" validate constraint "story_likes_story_id_fkey";

alter table "public"."story_reports" add constraint "story_reports_reason_check" CHECK (((reason)::text = ANY ((ARRAY['spam'::character varying, 'inappropriate'::character varying, 'harassment'::character varying, 'fake'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."story_reports" validate constraint "story_reports_reason_check";

alter table "public"."story_reports" add constraint "story_reports_reporter_user_id_fkey" FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."story_reports" validate constraint "story_reports_reporter_user_id_fkey";

alter table "public"."story_reports" add constraint "story_reports_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) not valid;

alter table "public"."story_reports" validate constraint "story_reports_reviewed_by_fkey";

alter table "public"."story_reports" add constraint "story_reports_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))) not valid;

alter table "public"."story_reports" validate constraint "story_reports_status_check";

alter table "public"."story_reports" add constraint "story_reports_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE not valid;

alter table "public"."story_reports" validate constraint "story_reports_story_id_fkey";

alter table "public"."story_reports" add constraint "story_reports_story_id_reporter_user_id_key" UNIQUE using index "story_reports_story_id_reporter_user_id_key";

alter table "public"."story_shares" add constraint "story_shares_share_type_check" CHECK (((share_type)::text = ANY ((ARRAY['share'::character varying, 'repost'::character varying])::text[]))) not valid;

alter table "public"."story_shares" validate constraint "story_shares_share_type_check";

alter table "public"."story_shares" add constraint "story_shares_story_id_fkey" FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE not valid;

alter table "public"."story_shares" validate constraint "story_shares_story_id_fkey";

alter table "public"."story_shares" add constraint "story_shares_story_id_user_id_platform_key" UNIQUE using index "story_shares_story_id_user_id_platform_key";

alter table "public"."stripe_events" add constraint "stripe_events_stripe_event_id_key" UNIQUE using index "stripe_events_stripe_event_id_key";

alter table "public"."subscribers" add constraint "subscribers_email_key" UNIQUE using index "subscribers_email_key";

alter table "public"."subscribers" add constraint "subscribers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscribers" validate constraint "subscribers_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."summary_feedback" add constraint "summary_feedback_summary_id_fkey" FOREIGN KEY (summary_id) REFERENCES public.chat_summaries(id) ON DELETE CASCADE not valid;

alter table "public"."summary_feedback" validate constraint "summary_feedback_summary_id_fkey";

alter table "public"."summary_feedback" add constraint "summary_feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."summary_feedback" validate constraint "summary_feedback_user_id_fkey";

alter table "public"."summary_feedback" add constraint "unique_summary_feedback" UNIQUE using index "unique_summary_feedback";

alter table "public"."summary_requests" add constraint "summary_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."summary_requests" validate constraint "summary_requests_user_id_fkey";

alter table "public"."swinger_interests" add constraint "swinger_interests_name_key" UNIQUE using index "swinger_interests_name_key";

alter table "public"."system_metrics" add constraint "system_metrics_metric_type_check" CHECK ((metric_type = ANY (ARRAY['response_time'::text, 'query_count'::text, 'error_rate'::text, 'active_users'::text, 'token_transactions'::text, 'report_activity'::text, 'memory_usage'::text, 'cpu_usage'::text]))) not valid;

alter table "public"."system_metrics" validate constraint "system_metrics_metric_type_check";

alter table "public"."system_metrics" add constraint "system_metrics_metric_unit_check" CHECK ((metric_unit = ANY (ARRAY['ms'::text, 'count'::text, 'percentage'::text, 'bytes'::text, 'users'::text]))) not valid;

alter table "public"."system_metrics" validate constraint "system_metrics_metric_unit_check";

alter table "public"."testnet_token_claims" add constraint "unique_user_testnet_claim" UNIQUE using index "unique_user_testnet_claim";

alter table "public"."threat_detections" add constraint "threat_detections_confidence_check" CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))) not valid;

alter table "public"."threat_detections" validate constraint "threat_detections_confidence_check";

alter table "public"."threat_detections" add constraint "threat_detections_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."threat_detections" validate constraint "threat_detections_resolved_by_fkey";

alter table "public"."threat_detections" add constraint "threat_detections_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."threat_detections" validate constraint "threat_detections_severity_check";

alter table "public"."threat_detections" add constraint "threat_detections_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'investigating'::text, 'resolved'::text, 'false_positive'::text]))) not valid;

alter table "public"."threat_detections" validate constraint "threat_detections_status_check";

alter table "public"."threat_detections" add constraint "threat_detections_threat_id_key" UNIQUE using index "threat_detections_threat_id_key";

alter table "public"."threat_detections" add constraint "threat_detections_threat_type_check" CHECK ((threat_type = ANY (ARRAY['brute_force'::text, 'data_breach'::text, 'suspicious_pattern'::text, 'unauthorized_access'::text, 'malware'::text]))) not valid;

alter table "public"."threat_detections" validate constraint "threat_detections_threat_type_check";

alter table "public"."token_analytics" add constraint "token_analytics_period_type_period_start_key" UNIQUE using index "token_analytics_period_type_period_start_key";

alter table "public"."token_staking" add constraint "token_staking_amount_staked_check" CHECK ((amount_staked > 0)) not valid;

alter table "public"."token_staking" validate constraint "token_staking_amount_staked_check";

alter table "public"."token_staking" add constraint "token_staking_vesting_period_days_check" CHECK (((vesting_period_days >= 30) AND (vesting_period_days <= 365))) not valid;

alter table "public"."token_staking" validate constraint "token_staking_vesting_period_days_check";

alter table "public"."token_transactions" add constraint "token_transactions_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]))) not valid;

alter table "public"."token_transactions" validate constraint "token_transactions_status_check";

alter table "public"."token_transactions" add constraint "token_transactions_token_type_check" CHECK (((token_type)::text = ANY ((ARRAY['CMPX'::character varying, 'GTK'::character varying])::text[]))) not valid;

alter table "public"."token_transactions" validate constraint "token_transactions_token_type_check";

alter table "public"."token_transactions" add constraint "token_transactions_transaction_type_check" CHECK (((transaction_type)::text = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying, 'transfer'::character varying, 'reward'::character varying, 'penalty'::character varying])::text[]))) not valid;

alter table "public"."token_transactions" validate constraint "token_transactions_transaction_type_check";

alter table "public"."tokens" add constraint "tokens_token_code_key" UNIQUE using index "tokens_token_code_key";

alter table "public"."transactions" add constraint "transactions_related_user_id_fkey" FOREIGN KEY (related_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."transactions" validate constraint "transactions_related_user_id_fkey";

alter table "public"."transactions" add constraint "transactions_token_type_check" CHECK ((token_type = ANY (ARRAY['CMPX'::text, 'GTK'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_token_type_check";

alter table "public"."transactions" add constraint "transactions_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['referral_bonus'::text, 'welcome_bonus'::text, 'world_id_bonus'::text, 'staking_reward'::text, 'premium_purchase'::text, 'beta_reward'::text, 'stake_tokens'::text, 'unstake_tokens'::text, 'manual_adjustment'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_transaction_type_check";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

alter table "public"."transactions" add constraint "valid_amount" CHECK ((amount <> 0)) not valid;

alter table "public"."transactions" validate constraint "valid_amount";

alter table "public"."two_factor_auth" add constraint "two_factor_auth_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."two_factor_auth" validate constraint "two_factor_auth_user_id_fkey";

alter table "public"."two_factor_auth" add constraint "two_factor_auth_user_id_method_key" UNIQUE using index "two_factor_auth_user_id_method_key";

alter table "public"."user_2fa_settings" add constraint "user_2fa_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_2fa_settings" validate constraint "user_2fa_settings_user_id_fkey";

alter table "public"."user_2fa_settings" add constraint "user_2fa_settings_user_id_key" UNIQUE using index "user_2fa_settings_user_id_key";

alter table "public"."user_activity" add constraint "user_activity_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_activity" validate constraint "user_activity_user_id_fkey";

alter table "public"."user_device_tokens" add constraint "user_device_tokens_device_type_check" CHECK ((device_type = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text]))) not valid;

alter table "public"."user_device_tokens" validate constraint "user_device_tokens_device_type_check";

alter table "public"."user_device_tokens" add constraint "user_device_tokens_user_id_device_token_key" UNIQUE using index "user_device_tokens_user_id_device_token_key";

alter table "public"."user_device_tokens" add constraint "user_device_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_device_tokens" validate constraint "user_device_tokens_user_id_fkey";

alter table "public"."user_explicit_preferences" add constraint "user_explicit_preferences_preference_id_fkey" FOREIGN KEY (preference_id) REFERENCES public.explicit_preferences(id) ON DELETE CASCADE not valid;

alter table "public"."user_explicit_preferences" validate constraint "user_explicit_preferences_preference_id_fkey";

alter table "public"."user_explicit_preferences" add constraint "user_explicit_preferences_privacy_level_check" CHECK (((privacy_level)::text = ANY ((ARRAY['public'::character varying, 'friends'::character varying, 'private'::character varying, 'hidden'::character varying])::text[]))) not valid;

alter table "public"."user_explicit_preferences" validate constraint "user_explicit_preferences_privacy_level_check";

alter table "public"."user_explicit_preferences" add constraint "user_explicit_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_explicit_preferences" validate constraint "user_explicit_preferences_user_id_fkey";

alter table "public"."user_explicit_preferences" add constraint "user_explicit_preferences_user_id_preference_id_key" UNIQUE using index "user_explicit_preferences_user_id_preference_id_key";

-- alter table "public"."user_interests" add constraint "user_interests_interest_id_fkey" FOREIGN KEY (interest_id) REFERENCES public.swinger_interests(id) ON DELETE CASCADE not valid;
-- Nota: Tipos incompatibles - interest_id es integer pero swinger_interests.id es uuid

-- alter table "public"."user_interests" validate constraint "user_interests_interest_id_fkey";
-- Nota: No se puede validar la constraint debido a incompatibilidad de tipos

alter table "public"."user_interests" add constraint "user_interests_privacy_level_check" CHECK (((privacy_level)::text = ANY ((ARRAY['public'::character varying, 'friends'::character varying, 'private'::character varying, 'hidden'::character varying])::text[]))) not valid;

alter table "public"."user_interests" validate constraint "user_interests_privacy_level_check";

alter table "public"."user_interests" add constraint "user_interests_user_id_interest_id_key" UNIQUE using index "user_interests_user_id_interest_id_key";

alter table "public"."user_likes" add constraint "user_likes_liked_user_id_fkey" FOREIGN KEY (liked_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_likes" validate constraint "user_likes_liked_user_id_fkey";

alter table "public"."user_likes" add constraint "user_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_likes" validate constraint "user_likes_user_id_fkey";

alter table "public"."user_likes" add constraint "user_likes_user_id_liked_user_id_key" UNIQUE using index "user_likes_user_id_liked_user_id_key";

alter table "public"."user_nfts" add constraint "user_nfts_network_check" CHECK (((network)::text = ANY ((ARRAY['mumbai'::character varying, 'polygon'::character varying])::text[]))) not valid;

alter table "public"."user_nfts" validate constraint "user_nfts_network_check";

alter table "public"."user_notification_preferences" add constraint "user_notification_preferences_delivery_method_check" CHECK ((delivery_method = ANY (ARRAY['push'::text, 'email'::text, 'in_app'::text, 'sms'::text]))) not valid;

alter table "public"."user_notification_preferences" validate constraint "user_notification_preferences_delivery_method_check";

alter table "public"."user_notification_preferences" add constraint "user_notification_preferences_notification_type_check" CHECK ((notification_type = ANY (ARRAY['report_resolved'::text, 'token_transaction'::text, 'moderation_action'::text, 'system_alert'::text, 'match_notification'::text, 'message_notification'::text]))) not valid;

alter table "public"."user_notification_preferences" validate constraint "user_notification_preferences_notification_type_check";

alter table "public"."user_notification_preferences" add constraint "user_notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_notification_preferences" validate constraint "user_notification_preferences_user_id_fkey";

alter table "public"."user_notification_preferences" add constraint "user_notification_preferences_user_id_notification_type_del_key" UNIQUE using index "user_notification_preferences_user_id_notification_type_del_key";

alter table "public"."user_referral_balances" add constraint "user_referral_balances_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_referral_balances" validate constraint "user_referral_balances_referred_by_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

alter table "public"."user_sessions" add constraint "user_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sessions" validate constraint "user_sessions_user_id_fkey";

alter table "public"."user_staking" add constraint "user_staking_amount_check" CHECK ((amount > 0)) not valid;

alter table "public"."user_staking" validate constraint "user_staking_amount_check";

alter table "public"."user_staking" add constraint "user_staking_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."user_staking" validate constraint "user_staking_status_check";

alter table "public"."user_staking" add constraint "user_staking_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_staking" validate constraint "user_staking_user_id_fkey";

alter table "public"."user_staking" add constraint "valid_staking_period" CHECK ((end_date > start_date)) not valid;

alter table "public"."user_staking" validate constraint "valid_staking_period";

alter table "public"."user_suspensions" add constraint "user_suspensions_moderator_id_fkey" FOREIGN KEY (moderator_id) REFERENCES public.moderators(id) ON DELETE SET NULL not valid;

alter table "public"."user_suspensions" validate constraint "user_suspensions_moderator_id_fkey";

alter table "public"."user_suspensions" add constraint "user_suspensions_suspension_type_check" CHECK (((suspension_type)::text = ANY ((ARRAY['temporary'::character varying, 'permanent'::character varying])::text[]))) not valid;

alter table "public"."user_suspensions" validate constraint "user_suspensions_suspension_type_check";

alter table "public"."user_suspensions" add constraint "user_suspensions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_suspensions" validate constraint "user_suspensions_user_id_fkey";

alter table "public"."user_themes" add constraint "user_themes_animation_speed_check" CHECK ((animation_speed = ANY (ARRAY['slow'::text, 'normal'::text, 'fast'::text]))) not valid;

alter table "public"."user_themes" validate constraint "user_themes_animation_speed_check";

alter table "public"."user_themes" add constraint "user_themes_glow_level_check" CHECK ((glow_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."user_themes" validate constraint "user_themes_glow_level_check";

alter table "public"."user_themes" add constraint "user_themes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_themes" validate constraint "user_themes_user_id_fkey";

alter table "public"."user_token_balances" add constraint "user_token_balances_referral_code_key" UNIQUE using index "user_token_balances_referral_code_key";

alter table "public"."user_token_balances" add constraint "user_token_balances_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_token_balances" validate constraint "user_token_balances_referred_by_fkey";

alter table "public"."user_tokens" add constraint "unique_user_tokens" UNIQUE using index "unique_user_tokens";

alter table "public"."user_tokens" add constraint "user_tokens_referral_code_key" UNIQUE using index "user_tokens_referral_code_key";

alter table "public"."user_tokens" add constraint "user_tokens_referral_code_unique" UNIQUE using index "user_tokens_referral_code_unique";

alter table "public"."user_tokens" add constraint "user_tokens_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_tokens" validate constraint "user_tokens_referred_by_fkey";

alter table "public"."user_tokens" add constraint "user_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_tokens" validate constraint "user_tokens_user_id_fkey";

alter table "public"."user_tokens" add constraint "valid_balances" CHECK (((cmpx_balance >= 0) AND (gtk_balance >= 0) AND (cmpx_staked >= 0))) not valid;

alter table "public"."user_tokens" validate constraint "valid_balances";

alter table "public"."user_tokens" add constraint "valid_monthly" CHECK (((monthly_earned >= 0) AND (monthly_earned <= monthly_limit))) not valid;

alter table "public"."user_tokens" validate constraint "valid_monthly";

alter table "public"."virtual_events" add constraint "virtual_events_event_type_check" CHECK ((event_type = ANY (ARRAY['webinar'::text, 'workshop'::text, 'meetup'::text, 'tournament'::text, 'other'::text]))) not valid;

alter table "public"."virtual_events" validate constraint "virtual_events_event_type_check";

alter table "public"."virtual_events" add constraint "virtual_events_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."virtual_events" validate constraint "virtual_events_status_check";

alter table "public"."wallet_transactions" add constraint "wallet_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."wallet_transactions" validate constraint "wallet_transactions_user_id_fkey";

alter table "public"."worldid_rewards" add constraint "worldid_rewards_reward_type_check" CHECK (((reward_type)::text = ANY ((ARRAY['cmpx'::character varying, 'gtk'::character varying])::text[]))) not valid;

alter table "public"."worldid_rewards" validate constraint "worldid_rewards_reward_type_check";

alter table "public"."worldid_rewards" add constraint "worldid_rewards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."worldid_rewards" validate constraint "worldid_rewards_user_id_fkey";

alter table "public"."worldid_rewards" add constraint "worldid_rewards_verification_id_fkey" FOREIGN KEY (verification_id) REFERENCES public.worldid_verifications(id) ON DELETE CASCADE not valid;

alter table "public"."worldid_rewards" validate constraint "worldid_rewards_verification_id_fkey";

alter table "public"."worldid_verifications" add constraint "worldid_verifications_nullifier_hash_key" UNIQUE using index "worldid_verifications_nullifier_hash_key";

alter table "public"."worldid_verifications" add constraint "worldid_verifications_verification_level_check" CHECK (((verification_level)::text = ANY ((ARRAY['orb'::character varying, 'device'::character varying])::text[]))) not valid;

alter table "public"."worldid_verifications" validate constraint "worldid_verifications_verification_level_check";

alter table "public"."app_logs" add constraint "app_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."app_logs" validate constraint "app_logs_user_id_fkey";

alter table "public"."blockchain_transactions" add constraint "blockchain_transactions_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'failed'::character varying])::text[]))) not valid;

alter table "public"."blockchain_transactions" validate constraint "blockchain_transactions_status_check";

alter table "public"."career_applications" add constraint "career_applications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."career_applications" validate constraint "career_applications_status_check";

alter table "public"."chat_rooms" add constraint "chat_rooms_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_rooms" validate constraint "chat_rooms_created_by_fkey";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'clubs'
      AND c.conname = 'clubs_created_by_fkey'
  ) THEN
    EXECUTE 'alter table "public"."clubs" add constraint "clubs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid';
    EXECUTE 'alter table "public"."clubs" validate constraint "clubs_created_by_fkey"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clubs'
      AND column_name = 'verified_by'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'clubs'
      AND c.conname = 'clubs_verified_by_fkey'
  ) THEN
    EXECUTE 'alter table "public"."clubs" add constraint "clubs_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) not valid';
    EXECUTE 'alter table "public"."clubs" validate constraint "clubs_verified_by_fkey"';
  END IF;
END $$;

alter table "public"."cmpx_purchases" add constraint "cmpx_purchases_package_id_fkey" FOREIGN KEY (package_id) REFERENCES public.cmpx_shop_packages(id) not valid;

alter table "public"."cmpx_purchases" validate constraint "cmpx_purchases_package_id_fkey";

alter table "public"."couple_nft_requests" add constraint "couple_nft_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'minted'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[]))) not valid;

alter table "public"."couple_nft_requests" validate constraint "couple_nft_requests_status_check";

alter table "public"."couple_profiles" add constraint "couple_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."couple_profiles" validate constraint "couple_profiles_user_id_fkey";

alter table "public"."error_alerts" add constraint "error_alerts_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."error_alerts" validate constraint "error_alerts_resolved_by_fkey";

alter table "public"."error_alerts" add constraint "error_alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."error_alerts" validate constraint "error_alerts_user_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."moderators" add constraint "moderators_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."moderators" validate constraint "moderators_created_by_fkey";

alter table "public"."monitoring_sessions" add constraint "monitoring_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."monitoring_sessions" validate constraint "monitoring_sessions_user_id_fkey";

alter table "public"."nft_galleries" add constraint "nft_galleries_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."nft_galleries" validate constraint "nft_galleries_profile_id_fkey";

alter table "public"."performance_metrics" add constraint "performance_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."performance_metrics" validate constraint "performance_metrics_user_id_fkey";

alter table "public"."posts" add constraint "posts_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_profile_id_fkey";

alter table "public"."reports" add constraint "reports_reported_user_id_fkey" FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_reported_user_id_fkey";

alter table "public"."reports" add constraint "reports_reporter_user_id_fkey" FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_reporter_user_id_fkey";

alter table "public"."reports" add constraint "reports_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text]))) not valid;

alter table "public"."reports" validate constraint "reports_status_check";

alter table "public"."security" add constraint "security_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."security" validate constraint "security_user_id_fkey";

alter table "public"."stories" add constraint "stories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."stories" validate constraint "stories_user_id_fkey";

alter table "public"."story_comments" add constraint "story_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.story_comments(id) not valid;

alter table "public"."story_comments" validate constraint "story_comments_parent_comment_id_fkey";

alter table "public"."two_factor_auth" add constraint "two_factor_auth_method_check" CHECK (((method)::text = ANY ((ARRAY['2fa_app'::character varying, 'sms'::character varying, 'email'::character varying])::text[]))) not valid;

alter table "public"."two_factor_auth" validate constraint "two_factor_auth_method_check";

alter table "public"."user_nfts" add constraint "user_nfts_rarity_check" CHECK (((rarity)::text = ANY ((ARRAY['common'::character varying, 'rare'::character varying, 'epic'::character varying, 'legendary'::character varying])::text[]))) not valid;

alter table "public"."user_nfts" validate constraint "user_nfts_rarity_check";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'moderator'::text, 'user'::text, 'premium'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."web_vitals_history" add constraint "web_vitals_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."web_vitals_history" validate constraint "web_vitals_history_user_id_fkey";

set check_function_bodies = off;

create or replace view "public"."active_security_flags" as  SELECT sf.id,
    sf.user_id,
    sf.flag_type,
    sf.severity,
    sf.description,
    sf.confidence,
    sf.created_at,
    'Usuario'::text AS first_name,
    'Anónimo'::text AS last_name
   FROM public.security_flags sf
  WHERE (sf.is_resolved = false)
  ORDER BY sf.severity DESC, sf.confidence DESC;


create or replace view "public"."active_worldid_verifications" as  SELECT v.id,
    v.user_id,
    v.nullifier_hash,
    v.verification_level,
    v.proof,
    v.merkle_root,
    v.action_id,
    v.signal_hash,
    v.verified_at,
    v.expires_at,
    v.is_active,
    v.metadata,
    v.created_at,
    v.updated_at,
    r.reward_amount,
    r.claimed,
    r.claimed_at
   FROM (public.worldid_verifications v
     LEFT JOIN public.worldid_rewards r ON ((v.id = r.verification_id)))
  WHERE ((v.is_active = true) AND ((v.expires_at IS NULL) OR (v.expires_at > now())));


CREATE OR REPLACE FUNCTION public.audit_suspicious_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Alertar sobre transacciones grandes
    IF ABS(NEW.amount) > 1000 THEN
        -- Log de auditoría simple (sin tabla audit_logs por ahora)
        RAISE NOTICE 'Transacción grande detectada: % tokens para usuario %', NEW.amount, NEW.user_id;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_forfeit_expired_disputes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si la disputa expiró sin resolución, aplicar forfeit automático
    IF NEW.dispute_deadline < NOW() AND OLD.status = 'DISPUTED' THEN
        NEW.status = 'FORFEITED';

        -- Crear registro de disputa resuelta automáticamente
        INSERT INTO couple_disputes (
            couple_agreement_id,
            initiated_by,
            dispute_reason,
            resolution_type,
            resolved_at
        ) VALUES (
            NEW.id,
            NEW.partner_1_id, -- Arbitrario, fue resolución automática
            'Auto-forfeit por expiración de plazo (30 días)',
            'ADMIN_FORFEIT',
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.award_cmpx_tokens_on_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si el pago se completó y los tokens aún no se han otorgado
  IF NEW.payment_status = 'succeeded' AND NEW.status = 'completed'
     AND OLD.payment_status != 'succeeded'
     AND NEW.tokens_awarded = false THEN

    -- Otorgar tokens al usuario
    UPDATE user_token_balances
    SET cmpx_balance = cmpx_balance + NEW.total_cmpx,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- Registrar transacción
    INSERT INTO token_transactions (
      user_id,
      transaction_type,
      token_type,
      amount,
      balance_after,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'purchase',
      'cmpx',
      NEW.total_cmpx,
      (SELECT cmpx_balance FROM user_token_balances WHERE user_id = NEW.user_id),
      'Compra de tokens CMPX',
      jsonb_build_object('purchase_id', NEW.id, 'package_id', NEW.package_id)
    );

    -- Marcar tokens como otorgados
    NEW.tokens_awarded := true;
    NEW.tokens_awarded_at := NOW();
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_compatibility(user1_uuid uuid, user2_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  shared_count INTEGER;
  total_user1 INTEGER;
  total_user2 INTEGER;
  compatibility DECIMAL(3,2);
BEGIN
  -- Contar intereses compartidos
  SELECT COUNT(*) INTO shared_count
  FROM public.user_interests ui1
  JOIN public.user_interests ui2 ON ui1.interest_id = ui2.interest_id
  WHERE ui1.user_id = user1_uuid
    AND ui2.user_id = user2_uuid
    AND ui1.privacy_level IN ('public', 'friends')
    AND ui2.privacy_level IN ('public', 'friends');

  -- Contar total de intereses del usuario 1
  SELECT COUNT(*) INTO total_user1
  FROM public.user_interests
  WHERE user_id = user1_uuid AND privacy_level IN ('public', 'friends');

  -- Contar total de intereses del usuario 2
  SELECT COUNT(*) INTO total_user2
  FROM public.user_interests
  WHERE user_id = user2_uuid AND privacy_level IN ('public', 'friends');

  -- Calcular compatibilidad (Jaccard similarity)
  IF (total_user1 + total_user2 - shared_count) > 0 THEN
    compatibility := shared_count::DECIMAL / (total_user1 + total_user2 - shared_count);
  ELSE
    compatibility := 0;
  END IF;

  -- Insertar o actualizar el score
  INSERT INTO public.compatibility_scores (user1_id, user2_id, compatibility_score, shared_interests, total_interests)
  VALUES (user1_uuid, user2_uuid, compatibility, shared_count, total_user1 + total_user2 - shared_count)
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET
    compatibility_score = compatibility,
    shared_interests = shared_count,
    total_interests = total_user1 + total_user2 - shared_count,
    last_calculated = NOW();

  RETURN compatibility;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gallery_commission(p_amount_cmpx integer, p_commission_percentage numeric DEFAULT 10.00)
 RETURNS TABLE(commission_amount integer, creator_amount integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  commission INTEGER;
  creator_amount INTEGER;
BEGIN
  commission := FLOOR(p_amount_cmpx * (p_commission_percentage / 100.0));
  creator_amount := p_amount_cmpx - commission;

  RETURN QUERY SELECT commission, creator_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gallery_commission(p_amount_cmpx numeric, p_commission_percentage numeric DEFAULT 10.0)
 RETURNS TABLE(commission_amount numeric, creator_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (p_amount_cmpx * p_commission_percentage / 100)::NUMERIC(18, 8) as commission_amount,
    (p_amount_cmpx * (100 - p_commission_percentage) / 100)::NUMERIC(18, 8) as creator_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_moderator_payment(p_moderator_id uuid, p_period_start timestamp with time zone, p_period_end timestamp with time zone)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  moderator_level TEXT;
  revenue_percentage NUMERIC;
  total_revenue NUMERIC;
  payment_amount NUMERIC;
  total_minutes INTEGER;
BEGIN
  -- Obtener nivel del moderador (asumiendo tabla moderators o profiles)
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM profiles WHERE id = p_moderator_id AND is_admin = true) THEN 'superadmin'
      ELSE 'junior' -- Default, debería venir de tabla moderators
    END INTO moderator_level;

  -- Porcentajes por nivel
  revenue_percentage := CASE moderator_level
    WHEN 'superadmin' THEN 30.00
    WHEN 'elite' THEN 8.00
    WHEN 'senior' THEN 5.00
    WHEN 'junior' THEN 3.00
    WHEN 'trainee' THEN 0.00 -- Trainee recibe tokens CMPX, no dinero
    ELSE 1.00
  END;

  -- Calcular revenue total del período (de inversiones, suscripciones, etc.)
  SELECT COALESCE(SUM(amount_mxn), 0) INTO total_revenue
  FROM investments
  WHERE created_at >= p_period_start AND created_at < p_period_end
    AND payment_status = 'succeeded';

  -- Agregar revenue de suscripciones premium
  -- TODO: Calcular desde tabla subscriptions

  -- Calcular minutos trabajados
  SELECT COALESCE(SUM(total_minutes), 0) INTO total_minutes
  FROM moderator_sessions
  WHERE moderator_id = p_moderator_id
    AND session_start >= p_period_start
    AND session_start < p_period_end;

  -- Calcular pago
  payment_amount := total_revenue * (revenue_percentage / 100.0);

  -- Mínimo de horas trabajadas requeridas (20 horas = 1200 minutos)
  IF total_minutes < 1200 THEN
    payment_amount := payment_amount * (total_minutes::NUMERIC / 1200.0);
  END IF;

  RETURN payment_amount;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_agreement_complete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.partner_1_signature = TRUE AND NEW.partner_2_signature = TRUE THEN
    NEW.status = 'ACTIVE';
    NEW.signed_at = NOW();
    NEW.dispute_deadline = NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_fingerprint_banned(p_canvas_hash character varying DEFAULT NULL::character varying, p_worldid_nullifier_hash character varying DEFAULT NULL::character varying, p_combined_hash character varying DEFAULT NULL::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  is_banned BOOLEAN := false;
BEGIN
  -- Verificar por canvas hash
  IF p_canvas_hash IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM digital_fingerprints
      WHERE canvas_hash = p_canvas_hash AND is_banned = true
    ) INTO is_banned;

    IF is_banned THEN
      RETURN true;
    END IF;
  END IF;

  -- Verificar por WorldID nullifier hash
  IF p_worldid_nullifier_hash IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM permanent_bans
      WHERE worldid_nullifier_hash = p_worldid_nullifier_hash
        AND is_active = true
    ) INTO is_banned;

    IF is_banned THEN
      RETURN true;
    END IF;

    -- También verificar en digital_fingerprints
    SELECT EXISTS (
      SELECT 1 FROM digital_fingerprints
      WHERE worldid_nullifier_hash = p_worldid_nullifier_hash
        AND is_banned = true
    ) INTO is_banned;

    IF is_banned THEN
      RETURN true;
    END IF;
  END IF;

  -- Verificar por combined hash
  IF p_combined_hash IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM digital_fingerprints
      WHERE combined_hash = p_combined_hash AND is_banned = true
    ) INTO is_banned;

    IF is_banned THEN
      RETURN true;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM permanent_bans
      WHERE combined_hash = p_combined_hash AND is_active = true
    ) INTO is_banned;
  END IF;

  RETURN is_banned;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_summary_rate_limit(p_user_id uuid, p_max_per_day integer DEFAULT 10)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM summary_requests
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;

  RETURN v_count < p_max_per_day;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_world_id_reward(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_tokens RECORD;
    world_id_amount INTEGER := 100;
BEGIN
    -- Obtener datos del usuario
    SELECT * INTO user_tokens FROM public.user_tokens WHERE user_id = user_id_param;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuario no encontrado'
        );
    END IF;

    -- Verificar si ya reclamó
    IF user_tokens.world_id_claimed THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Ya has reclamado tu recompensa de World ID'
        );
    END IF;

    -- Verificar límite mensual
    IF (user_tokens.monthly_earned + world_id_amount) > user_tokens.monthly_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Límite mensual alcanzado (' || user_tokens.monthly_limit || ' CMPX)'
        );
    END IF;

    -- Actualizar tokens
    UPDATE public.user_tokens
    SET
        cmpx_balance = cmpx_balance + world_id_amount,
        monthly_earned = monthly_earned + world_id_amount,
        world_id_claimed = true,
        updated_at = NOW()
    WHERE user_id = user_id_param;

    -- Registrar transacción
    INSERT INTO public.transactions (
        user_id, transaction_type, token_type, amount,
        balance_before, balance_after, description
    ) VALUES (
        user_id_param, 'world_id_bonus', 'CMPX', world_id_amount,
        user_tokens.cmpx_balance, user_tokens.cmpx_balance + world_id_amount,
        'Recompensa por verificación World ID'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Recompensa de World ID reclamada: ' || world_id_amount || ' CMPX',
        'amount', world_id_amount,
        'new_balance', user_tokens.cmpx_balance + world_id_amount
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_expired_cache()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM public.profile_cache WHERE expires_at < NOW();
    DELETE FROM public.sessions WHERE expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_couple_data()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Eliminar interacciones de más de 1 año
  DELETE FROM couple_interactions
  WHERE created_at < NOW() - INTERVAL '1 year';

  -- Eliminar mensajes de más de 6 meses
  DELETE FROM couple_messages
  WHERE created_at < NOW() - INTERVAL '6 months';

  -- Eliminar estadísticas de más de 2 años
  DELETE FROM couple_statistics
  WHERE date < CURRENT_DATE - INTERVAL '2 years';

  -- Eliminar eventos pasados de más de 1 mes
  DELETE FROM couple_events
  WHERE date < NOW() - INTERVAL '1 month';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_summaries()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM chat_summaries
  WHERE created_at < NOW() - INTERVAL '90 days';

  DELETE FROM summary_requests
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_couple_agreement()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si ambos partners han firmado, activar el acuerdo
    IF NEW.partner_1_signature = true AND NEW.partner_2_signature = true THEN
        NEW.status = 'ACTIVE';
        NEW.signed_at = NOW();
        NEW.dispute_deadline = NOW() + INTERVAL '30 days';
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_staking(staking_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    staking_record RECORD;
    reward_amount INTEGER;
    total_return INTEGER;
BEGIN
    -- Obtener registro de staking
    SELECT * INTO staking_record
    FROM public.user_staking
    WHERE id = staking_id_param AND status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Staking no encontrado o ya completado');
    END IF;

    -- Verificar si ya terminó el período
    IF NOW() < staking_record.end_date THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'El staking termina el ' || staking_record.end_date::DATE
        );
    END IF;

    -- Calcular recompensa
    reward_amount := ROUND(staking_record.amount * staking_record.reward_percentage / 100);
    total_return := staking_record.amount + reward_amount;

    -- Actualizar balance del usuario
    UPDATE public.user_tokens
    SET
        cmpx_balance = cmpx_balance + total_return,
        cmpx_staked = cmpx_staked - staking_record.amount,
        updated_at = NOW()
    WHERE user_id = staking_record.user_id;

    -- Marcar staking como completado
    UPDATE public.user_staking
    SET
        status = 'completed',
        reward_claimed = true
    WHERE id = staking_id_param;

    -- Registrar transacciones
    INSERT INTO public.transactions (
        user_id, transaction_type, token_type, amount,
        balance_before, balance_after, description
    )
    SELECT
        staking_record.user_id, 'unstake_tokens', 'CMPX', staking_record.amount,
        ut.cmpx_balance - total_return, ut.cmpx_balance - reward_amount,
        'Recuperación de tokens en staking'
    FROM public.user_tokens ut WHERE ut.user_id = staking_record.user_id;

    INSERT INTO public.transactions (
        user_id, transaction_type, token_type, amount,
        balance_before, balance_after, description
    )
    SELECT
        staking_record.user_id, 'staking_reward', 'CMPX', reward_amount,
        ut.cmpx_balance - reward_amount, ut.cmpx_balance,
        'Recompensa por staking (' || staking_record.reward_percentage || '%)'
    FROM public.user_tokens ut WHERE ut.user_id = staking_record.user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Staking completado. Recuperaste ' || staking_record.amount || ' CMPX + ' || reward_amount || ' CMPX de recompensa',
        'original_amount', staking_record.amount,
        'reward_amount', reward_amount,
        'total_return', total_return
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_annual_returns(investment_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  inv_record investments%ROWTYPE;
  return_amount NUMERIC;
  current_year INTEGER;
  i INTEGER;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
  due_date TIMESTAMPTZ;
BEGIN
  -- Obtener datos de la inversión
  SELECT * INTO inv_record
  FROM investments
  WHERE id = investment_uuid AND status = 'active';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calcular monto de retorno anual
  return_amount := inv_record.amount_mxn * (inv_record.return_percentage / 100.0);

  -- Crear retornos para los próximos 5 años
  current_year := EXTRACT(YEAR FROM NOW());

  FOR i IN 1..5 LOOP
    start_date := DATE_TRUNC('year', NOW()) + (i - 1) * INTERVAL '1 year';
    end_date := start_date + INTERVAL '1 year' - INTERVAL '1 day';
    due_date := start_date + INTERVAL '1 year';

    INSERT INTO investment_returns (
      investment_id,
      user_id,
      return_amount_mxn,
      return_percentage,
      return_period_start,
      return_period_end,
      due_date,
      status
    ) VALUES (
      investment_uuid,
      inv_record.user_id,
      return_amount,
      inv_record.return_percentage,
      start_date,
      end_date,
      due_date,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_couple_match()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if there's a mutual like
    IF EXISTS (
        SELECT 1 FROM couple_profile_likes cpl1
        JOIN couple_profile_likes cpl2 ON cpl1.couple_profile_id = cpl2.liker_profile_id
        WHERE cpl1.liker_profile_id = NEW.couple_profile_id
        AND cpl2.couple_profile_id = NEW.liker_profile_id
    ) THEN
        -- Create match if it doesn't exist
        INSERT INTO couple_profile_matches (couple_profile1_id, couple_profile2_id)
        VALUES (NEW.couple_profile_id, NEW.liker_profile_id)
        ON CONFLICT (couple_profile1_id, couple_profile2_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(notification_type text, title text, body text, user_id uuid, data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
BEGIN
    INSERT INTO notification_history (
        notification_type,
        title,
        body,
        user_id,
        data,
        delivery_method,
        status
    ) VALUES (
        notification_type,
        title,
        body,
        user_id,
        data,
        'push',
        'pending'
    );

    result := jsonb_build_object(
        'success', true,
        'message', 'Notificación creada exitosamente'
    );

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_permanent_ban(p_user_id uuid, p_canvas_hash character varying, p_combined_hash character varying, p_ban_reason text, p_banned_by uuid, p_worldid_nullifier_hash character varying DEFAULT NULL::character varying, p_severity text DEFAULT 'high'::text, p_evidence jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  ban_id UUID;
  fingerprint_id UUID;
BEGIN
  -- Crear o actualizar fingerprint
  INSERT INTO digital_fingerprints (
    user_id,
    canvas_hash,
    worldid_nullifier_hash,
    combined_hash,
    is_banned,
    banned_at,
    ban_reason
  ) VALUES (
    p_user_id,
    p_canvas_hash,
    p_worldid_nullifier_hash,
    p_combined_hash,
    true,
    NOW(),
    p_ban_reason
  )
  ON CONFLICT (combined_hash) DO UPDATE SET
    is_banned = true,
    banned_at = NOW(),
    ban_reason = p_ban_reason,
    updated_at = NOW()
  RETURNING id INTO fingerprint_id;

  -- Crear baneo permanente
  INSERT INTO permanent_bans (
    user_id,
    fingerprint_ids,
    ban_reason,
    ban_type,
    severity,
    banned_by,
    worldid_nullifier_hash,
    canvas_hash,
    combined_hash,
    evidence
  ) VALUES (
    p_user_id,
    ARRAY[fingerprint_id],
    p_ban_reason,
    'manual',
    p_severity,
    p_banned_by,
    p_worldid_nullifier_hash,
    p_canvas_hash,
    p_combined_hash,
    p_evidence
  )
  RETURNING id INTO ban_id;

  -- Marcar usuario como baneado en profiles
  UPDATE profiles
  SET is_blocked = true,
      blocked_at = NOW(),
      blocked_reason = p_ban_reason
  WHERE id = p_user_id;

  RETURN ban_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_policy_safe(p_policy_name text, p_table_name text, p_policy_definition text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_policy_exists BOOLEAN;
    v_table_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = p_table_name
    ) INTO v_table_exists;

    -- Si la tabla no existe, salir
    IF NOT v_table_exists THEN
        RETURN;
    END IF;

    -- Verificar si la política ya existe
    SELECT EXISTS(
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = p_table_name
        AND policyname = p_policy_name
    ) INTO v_policy_exists;

    -- Si no existe, crearla
    IF NOT v_policy_exists THEN
        BEGIN
            EXECUTE p_policy_definition;
        EXCEPTION WHEN OTHERS THEN
            -- Ignorar errores de políticas (columnas faltantes, etc.)
            NULL;
        END;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_post(p_user_id uuid, p_profile_id uuid, p_content text, p_post_type text DEFAULT 'text'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_post_id UUID;
    result JSON;
BEGIN
    INSERT INTO public.posts (user_id, profile_id, content, post_type)
    VALUES (p_user_id, p_profile_id, p_content, p_post_type)
    RETURNING id INTO new_post_id;

    SELECT json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'content', p.content,
        'post_type', p.post_type,
        'likes_count', p.likes_count,
        'created_at', p.created_at
    ) INTO result
    FROM public.posts p
    WHERE p.id = new_post_id;

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_post(p_user_id uuid, p_profile_id uuid, p_content text, p_post_type text DEFAULT 'text'::text, p_image_url text DEFAULT NULL::text, p_video_url text DEFAULT NULL::text, p_location text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, user_id uuid, profile_id uuid, content text, post_type text, image_url text, video_url text, location text, likes_count integer, comments_count integer, shares_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, profile_name text, profile_avatar text, is_verified boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        new_post_id UUID;
    BEGIN
        INSERT INTO public.posts (
            user_id, profile_id, content, post_type,
            image_url, video_url, location
        ) VALUES (
            p_user_id, p_profile_id, p_content, p_post_type,
            p_image_url, p_video_url, p_location
        ) RETURNING posts.id INTO new_post_id;

        RETURN QUERY
        SELECT
            p.id,
            p.user_id,
            p.profile_id,
            p.content,
            p.post_type,
            p.image_url,
            p.video_url,
            p.location,
            p.likes_count,
            p.comments_count,
            p.shares_count,
            p.created_at,
            p.updated_at,
            pr.first_name as profile_name,
            pr.avatar_url as profile_avatar,
            pr.is_verified
        FROM public.posts p
        LEFT JOIN public.profiles pr ON p.profile_id = pr.id
        WHERE p.id = new_post_id;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.create_user_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Intentamos insertar el token, pero si ya existe, no hacemos nada (DO NOTHING)
  INSERT INTO public.user_tokens (user_id, referral_code, cmpx_balance, gtk_balance)
  VALUES (NEW.id, generate_referral_code(NEW.id), 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

create or replace view "public"."current_token_metrics" as  SELECT sum(user_token_balances.cmpx_balance) AS total_cmpx_balance,
    sum(user_token_balances.gtk_balance) AS total_gtk_balance,
    count(DISTINCT user_token_balances.user_id) AS active_users,
    count(DISTINCT
        CASE
            WHEN (user_token_balances.updated_at > (now() - '24:00:00'::interval)) THEN user_token_balances.user_id
            ELSE NULL::uuid
        END) AS active_users_24h
   FROM public.user_token_balances;


CREATE OR REPLACE FUNCTION public.date_trunc_day(ts timestamp with time zone)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT DATE(ts AT TIME ZONE 'UTC');
$function$
;

CREATE OR REPLACE FUNCTION public.expire_old_sessions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Mark sessions as inactive if they've expired
    -- Only if expires_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'user_sessions' AND column_name = 'expires_at') THEN
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE expires_at < NOW() AND is_active = TRUE;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_couple_report(couple_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
  couple_data RECORD;
  stats_data RECORD;
  recent_interactions INTEGER;
  recent_matches INTEGER;
BEGIN
  -- Obtener datos de la pareja
  SELECT * INTO couple_data
  FROM couple_profiles
  WHERE id = couple_id_param;

  -- Obtener estadísticas
  SELECT
    SUM(views) as total_views,
    SUM(likes) as total_likes,
    SUM(matches) as total_matches,
    SUM(messages) as total_messages
  INTO stats_data
  FROM couple_statistics
  WHERE couple_id = couple_id_param;

  -- Obtener interacciones recientes
  SELECT COUNT(*) INTO recent_interactions
  FROM couple_interactions
  WHERE couple_id = couple_id_param
  AND created_at >= NOW() - INTERVAL '30 days';

  -- Obtener matches recientes
  SELECT COUNT(*) INTO recent_matches
  FROM couple_matches
  WHERE (couple1_id = couple_id_param OR couple2_id = couple_id_param)
  AND created_at >= NOW() - INTERVAL '30 days';

  -- Construir resultado
  result := jsonb_build_object(
    'couple_id', couple_id_param,
    'couple_name', couple_data.couple_name,
    'total_views', COALESCE(stats_data.total_views, 0),
    'total_likes', COALESCE(stats_data.total_likes, 0),
    'total_matches', COALESCE(stats_data.total_matches, 0),
    'total_messages', COALESCE(stats_data.total_messages, 0),
    'recent_interactions', recent_interactions,
    'recent_matches', recent_matches,
    'profile_completeness', couple_data.statistics->>'profile_completeness',
    'last_active', couple_data.statistics->>'last_active'
  );

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    code TEXT;
    exists_code BOOLEAN;
BEGIN
    LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
        SELECT EXISTS(SELECT 1 FROM user_tokens WHERE referral_code = code) INTO exists_code;
        EXIT WHEN NOT exists_code;
    END LOOP;
    RETURN code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generar código basado en UUID + contador
        code := 'CMPX' || UPPER(SUBSTRING(REPLACE(user_uuid::TEXT, '-', ''), 1, 4)) ||
                LPAD(counter::TEXT, 2, '0');

        -- Verificar si ya existe
        IF NOT EXISTS (SELECT 1 FROM public.user_tokens WHERE referral_code = code) THEN
            RETURN code;
        END IF;

        counter := counter + 1;
        IF counter > 99 THEN
            RAISE EXCEPTION 'No se pudo generar código de referido único';
        END IF;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_ai_compatibility_score(p_user1_id uuid, p_user2_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_score DECIMAL(3,2);
BEGIN
  SELECT final_score INTO v_score
  FROM ai_compatibility_scores
  WHERE (
    (user1_id = p_user1_id AND user2_id = p_user2_id) OR
    (user1_id = p_user2_id AND user2_id = p_user1_id)
  )
  AND created_at > NOW() - INTERVAL '1 hour'
  LIMIT 1;

  RETURN v_score;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cached_summary(p_chat_id uuid)
 RETURNS TABLE(id uuid, summary text, sentiment character varying, topics jsonb, message_count integer, method character varying, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.summary,
    cs.sentiment,
    cs.topics,
    cs.message_count,
    cs.method,
    cs.created_at
  FROM chat_summaries cs
  WHERE cs.chat_id = p_chat_id
    AND cs.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY cs.created_at DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_couple_profile_by_user_id(user_uuid uuid)
 RETURNS TABLE(id uuid, couple_name text, couple_bio text, relationship_type public.relationship_type, partner1_id uuid, partner2_id uuid, couple_images text[], is_verified boolean, is_premium boolean, created_at timestamp with time zone, updated_at timestamp with time zone, partner1_first_name text, partner1_last_name text, partner1_age integer, partner1_bio text, partner1_gender text, partner2_first_name text, partner2_last_name text, partner2_age integer, partner2_bio text, partner2_gender text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT cpwp.*
    FROM couple_profiles_with_partners cpwp
    WHERE cpwp.partner1_id IN (SELECT id FROM profiles WHERE user_id = user_uuid)
       OR cpwp.partner2_id IN (SELECT id FROM profiles WHERE user_id = user_uuid);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_model_stats(p_model_version character varying, p_period_hours integer DEFAULT 24)
 RETURNS TABLE(total_predictions bigint, avg_score numeric, cache_hit_rate numeric, error_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_predictions,
    AVG(score)::DECIMAL(3,2) as avg_score,
    (SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0))::DECIMAL(5,4) as cache_hit_rate,
    SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END)::BIGINT as error_count
  FROM ai_prediction_logs
  WHERE model_version = p_model_version
    AND timestamp > NOW() - (p_period_hours || ' hours')::INTERVAL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_post_comments(post_uuid uuid, page_limit integer DEFAULT 10, page_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, profile_id uuid, parent_comment_id uuid, content text, likes_count integer, created_at timestamp with time zone, profile_name text, profile_avatar text, user_liked boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY
        SELECT
            c.id,
            c.user_id,
            c.profile_id,
            c.parent_comment_id,
            c.content,
            c.likes_count,
            c.created_at,
            pr.first_name as profile_name,
            pr.avatar_url as profile_avatar,
            EXISTS(
                SELECT 1 FROM public.comment_likes cl
                WHERE cl.comment_id = c.id AND cl.user_id = auth.uid()
            ) as user_liked
        FROM public.post_comments c
        LEFT JOIN public.profiles pr ON c.profile_id = pr.id
        WHERE c.post_id = post_uuid
        AND c.deleted_at IS NULL
        ORDER BY c.created_at ASC
        LIMIT page_limit OFFSET page_offset;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.get_potential_matches(user_id_param uuid, limit_param integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'age', p.age,
            'bio', p.bio,
            'avatar_url', p.avatar_url,
            'interests', p.interests,
            'compatibility_score', RANDOM() * 100 -- Simulado por ahora
        )
    ) INTO result
    FROM profiles p
    WHERE p.id != user_id_param
    AND p.is_active = true
    AND p.is_blocked = false
    AND NOT EXISTS (
        SELECT 1 FROM matches m
        WHERE (m.user1_id = user_id_param AND m.user2_id = p.id)
        OR (m.user1_id = p.id AND m.user2_id = user_id_param)
    )
    LIMIT limit_param;

    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_summary_stats(p_period_days integer DEFAULT 7)
 RETURNS TABLE(total_summaries bigint, gpt4_count bigint, bart_count bigint, fallback_count bigint, avg_message_count numeric, positive_sentiment_pct numeric, neutral_sentiment_pct numeric, negative_sentiment_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_summaries,
    SUM(CASE WHEN method = 'gpt4' THEN 1 ELSE 0 END)::BIGINT as gpt4_count,
    SUM(CASE WHEN method = 'bart' THEN 1 ELSE 0 END)::BIGINT as bart_count,
    SUM(CASE WHEN method = 'fallback' THEN 1 ELSE 0 END)::BIGINT as fallback_count,
    AVG(message_count)::DECIMAL as avg_message_count,
    (SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as positive_sentiment_pct,
    (SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as neutral_sentiment_pct,
    (SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as negative_sentiment_pct
  FROM chat_summaries
  WHERE created_at > NOW() - (p_period_days || ' days')::INTERVAL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_active_consents(p_user_id uuid)
 RETURNS TABLE(consent_type text, document_path text, consented_at timestamp with time zone, expires_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        uc.consent_type,
        uc.document_path,
        uc.consented_at,
        uc.expires_at
    FROM user_consents uc
    WHERE uc.user_id = p_user_id
      AND uc.is_active = true
      AND (uc.expires_at IS NULL OR uc.expires_at > NOW())
    ORDER BY uc.consented_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_feed(user_id_param uuid, limit_param integer DEFAULT 20, offset_param integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'user_id', p.user_id,
            'content', p.content,
            'post_type', p.post_type,
            'image_url', p.image_url,
            'likes_count', p.likes_count,
            'comments_count', p.comments_count,
            'created_at', p.created_at,
            'profile_name', pr.first_name,
            'profile_avatar', pr.avatar_url
        )
    ) INTO result
    FROM public.posts p
    LEFT JOIN public.profiles pr ON p.profile_id = pr.id
    WHERE p.deleted_at IS NULL AND (p.is_public = true OR p.user_id = user_id_param)
    ORDER BY p.created_at DESC
    LIMIT limit_param OFFSET offset_param;

    RETURN COALESCE(result, '[]'::json);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_matches(user_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'user1_id', m.user1_id,
            'user2_id', m.user2_id,
            'compatibility_score', m.compatibility_score,
            'status', m.status,
            'created_at', m.created_at
        )
    ) INTO result
    FROM matches m
    WHERE (m.user1_id = user_id_param OR m.user2_id = user_id_param)
    AND m.status = 'active';

    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_worldid_verification_reward()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  reward_amt NUMERIC(20, 2);
BEGIN
  -- Recompensa base: 50 CMPX por orb, 25 CMPX por device
  reward_amt := CASE
    WHEN NEW.verification_level = 'orb' THEN 50.00
    WHEN NEW.verification_level = 'device' THEN 25.00
    ELSE 10.00
  END;

  -- Crear registro de recompensa
  INSERT INTO worldid_rewards (
    verification_id,
    user_id,
    reward_type,
    reward_amount,
    claimed,
    metadata
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'cmpx',
    reward_amt,
    false,
    jsonb_build_object(
      'verification_level', NEW.verification_level,
      'verified_at', NEW.verified_at
    )
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_active_couple_agreement(p_couple_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    agreement_exists BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM couple_agreements
        WHERE couple_id = p_couple_id
          AND status = 'ACTIVE'
          AND partner_1_signature = true
          AND partner_2_signature = true
    ) INTO agreement_exists;

    RETURN agreement_exists;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_risk_level text DEFAULT 'low'::text, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security (user_id, event_type, risk_level, details)
    VALUES (p_user_id, p_event_type, p_risk_level, p_details)
    RETURNING id INTO event_id;

    RETURN event_id;
END;
$function$
;

create or replace view "public"."performance_metrics_daily" as  SELECT date(performance_metrics."timestamp") AS date,
    performance_metrics.metric_name,
    avg(performance_metrics.value) AS avg_value,
    min(performance_metrics.value) AS min_value,
    max(performance_metrics.value) AS max_value,
    percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY ((performance_metrics.value)::double precision)) AS median_value,
    percentile_cont((0.95)::double precision) WITHIN GROUP (ORDER BY ((performance_metrics.value)::double precision)) AS p95_value,
    count(*) AS total_count
   FROM public.performance_metrics
  GROUP BY (date(performance_metrics."timestamp")), performance_metrics.metric_name
  ORDER BY (date(performance_metrics."timestamp")) DESC, performance_metrics.metric_name;


create or replace view "public"."popular_hashtags" as  SELECT hashtag.hashtag,
    count(*) AS story_count,
    sum(COALESCE(sl.likes_count, (0)::bigint)) AS total_likes,
    sum(COALESCE(sc.comments_count, (0)::bigint)) AS total_comments,
    sum(COALESCE(ss.shares_count, (0)::bigint)) AS total_shares
   FROM (((public.stories s
     LEFT JOIN ( SELECT story_likes.story_id,
            count(*) AS likes_count
           FROM public.story_likes
          GROUP BY story_likes.story_id) sl ON ((s.id = sl.story_id)))
     LEFT JOIN ( SELECT story_comments.story_id,
            count(*) AS comments_count
           FROM public.story_comments
          GROUP BY story_comments.story_id) sc ON ((s.id = sc.story_id)))
     LEFT JOIN ( SELECT story_shares.story_id,
            count(*) AS shares_count
           FROM public.story_shares
          GROUP BY story_shares.story_id) ss ON ((s.id = ss.story_id))),
    LATERAL unnest(COALESCE(s.hashtags, ARRAY[]::text[])) hashtag(hashtag)
  WHERE ((s.is_public = true) AND (hashtag.hashtag IS NOT NULL) AND (hashtag.hashtag <> ''::text))
  GROUP BY hashtag.hashtag
  ORDER BY (count(*)) DESC, (sum(COALESCE(sl.likes_count, (0)::bigint))) DESC;


CREATE OR REPLACE FUNCTION public.process_referral_reward(referral_code_param text, new_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    inviter_record RECORD;
    inviter_tokens RECORD;
    new_user_tokens RECORD;
    referral_amount INTEGER := 50;
    welcome_amount INTEGER := 50;
    result JSONB;
BEGIN
    -- Buscar invitador por código
    SELECT ut.*, u.email
    INTO inviter_record
    FROM public.user_tokens ut
    JOIN auth.users u ON ut.user_id = u.id
    WHERE ut.referral_code = referral_code_param;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Código de referido inválido'
        );
    END IF;

    -- Verificar que no se auto-refiera
    IF inviter_record.user_id = new_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No puedes referirte a ti mismo'
        );
    END IF;

    -- Verificar límite mensual del invitador
    IF (inviter_record.monthly_earned + referral_amount) > inviter_record.monthly_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Límite mensual alcanzado (' || inviter_record.monthly_limit || ' CMPX)'
        );
    END IF;

    -- Actualizar tokens del invitador
    UPDATE public.user_tokens
    SET
        cmpx_balance = cmpx_balance + referral_amount,
        monthly_earned = monthly_earned + referral_amount,
        total_referrals = total_referrals + 1,
        updated_at = NOW()
    WHERE user_id = inviter_record.user_id;

    -- Actualizar tokens del nuevo usuario
    UPDATE public.user_tokens
    SET
        cmpx_balance = cmpx_balance + welcome_amount,
        referred_by = inviter_record.user_id,
        updated_at = NOW()
    WHERE user_id = new_user_id;

    -- Registrar transacciones
    INSERT INTO public.transactions (
        user_id, transaction_type, token_type, amount,
        balance_before, balance_after, description, related_user_id
    ) VALUES
    (
        inviter_record.user_id, 'referral_bonus', 'CMPX', referral_amount,
        inviter_record.cmpx_balance, inviter_record.cmpx_balance + referral_amount,
        'Recompensa por referir usuario', new_user_id
    ),
    (
        new_user_id, 'welcome_bonus', 'CMPX', welcome_amount,
        0, welcome_amount,
        'Bono de bienvenida por registro', inviter_record.user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Recompensas asignadas: ' || referral_amount || ' CMPX para invitador, ' || welcome_amount || ' CMPX de bienvenida',
        'inviter_reward', referral_amount,
        'welcome_bonus', welcome_amount
    );
END;
$function$
;

create or replace view "public"."recent_transactions" as  SELECT transactions.user_id,
    transactions.transaction_type,
    transactions.token_type,
    transactions.amount,
    transactions.balance_before,
    transactions.balance_after,
    transactions.description,
    transactions.created_at
   FROM public.transactions
  WHERE ((auth.uid() = transactions.user_id) AND (transactions.created_at >= (now() - '30 days'::interval)))
  ORDER BY transactions.created_at DESC
 LIMIT 50;


CREATE OR REPLACE FUNCTION public.record_gallery_commission(p_gallery_id uuid, p_creator_id uuid, p_transaction_type text, p_amount_cmpx integer, p_commission_percentage numeric DEFAULT 10.00)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  commission_result RECORD;
  commission_id UUID;
BEGIN
  -- Calcular comisión
  SELECT * INTO commission_result
  FROM calculate_gallery_commission(p_amount_cmpx, p_commission_percentage);

  -- Crear registro de comisión
  INSERT INTO gallery_commissions (
    gallery_id,
    creator_id,
    transaction_type,
    amount_cmpx,
    commission_percentage,
    commission_amount_cmpx,
    creator_amount_cmpx
  ) VALUES (
    p_gallery_id,
    p_creator_id,
    p_transaction_type,
    p_amount_cmpx,
    p_commission_percentage,
    commission_result.commission_amount,
    commission_result.creator_amount
  )
  RETURNING id INTO commission_id;

  -- Otorgar tokens al creador (90%)
  UPDATE user_token_balances
  SET cmpx_balance = cmpx_balance + commission_result.creator_amount,
      updated_at = NOW()
  WHERE user_id = p_creator_id;

  -- Registrar transacción para el creador
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    token_type,
    amount,
    balance_after,
    description,
    metadata
  ) VALUES (
    p_creator_id,
    'earn',
    'cmpx',
    commission_result.creator_amount,
    (SELECT cmpx_balance FROM user_token_balances WHERE user_id = p_creator_id),
    'Comisión de galería (90%)',
    jsonb_build_object('gallery_id', p_gallery_id, 'transaction_type', p_transaction_type)
  );

  RETURN commission_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_gallery_commission_internal(p_gallery_id uuid, p_creator_id uuid, p_transaction_type character varying, p_amount_cmpx numeric, p_commission_percentage numeric DEFAULT 10.0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_commission_id UUID;
  v_commission_amount NUMERIC;
  v_creator_amount NUMERIC;
BEGIN
  -- Calculate commission
  SELECT commission_amount, creator_amount INTO v_commission_amount, v_creator_amount
  FROM calculate_gallery_commission(p_amount_cmpx, p_commission_percentage);

  -- Insert commission record
  INSERT INTO gallery_commissions (
    gallery_id,
    creator_id,
    transaction_type,
    amount_cmpx,
    commission_percentage,
    commission_amount_cmpx,
    creator_amount_cmpx
  ) VALUES (
    p_gallery_id,
    p_creator_id,
    p_transaction_type,
    p_amount_cmpx,
    p_commission_percentage,
    v_commission_amount,
    v_creator_amount
  ) RETURNING id INTO v_commission_id;

  -- Award tokens to creator (assuming user_token_balances table exists)
  -- This would be handled by the RPC function record_gallery_commission
  -- which calls this function and then updates the token balance

  RETURN v_commission_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.remove_post_like(p_post_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.post_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = p_post_id AND likes_count > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_monthly_limits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.user_tokens
    SET
        monthly_earned = 0,
        last_reset_date = NOW()
    WHERE last_reset_date < DATE_TRUNC('month', NOW());
END;
$function$
;

create or replace view "public"."security_metrics" as  SELECT count(*) AS total_audit_logs,
    count(
        CASE
            WHEN (security_audit_logs.risk_score > 70) THEN 1
            ELSE NULL::integer
        END) AS high_risk_events,
    count(
        CASE
            WHEN (security_audit_logs.created_at > (now() - '24:00:00'::interval)) THEN 1
            ELSE NULL::integer
        END) AS events_24h,
    count(DISTINCT security_audit_logs.user_id) AS affected_users,
    avg(security_audit_logs.risk_score) AS avg_risk_score
   FROM public.security_audit_logs;


CREATE OR REPLACE FUNCTION public.set_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at_reports()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."staking_metrics" as  SELECT count(*) AS total_staking_positions,
    sum(staking_records.amount) AS total_staked_amount,
    count(
        CASE
            WHEN ((staking_records.status)::text = 'active'::text) THEN 1
            ELSE NULL::integer
        END) AS active_positions,
    count(
        CASE
            WHEN ((staking_records.status)::text = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_positions
   FROM public.staking_records;


CREATE OR REPLACE FUNCTION public.start_staking(user_id_param uuid, amount_param integer, duration_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_tokens RECORD;
    end_date_calc TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Obtener datos del usuario
    SELECT * INTO user_tokens FROM public.user_tokens WHERE user_id = user_id_param;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuario no encontrado');
    END IF;

    -- Verificar balance suficiente
    IF user_tokens.cmpx_balance < amount_param THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Balance insuficiente. Tienes ' || user_tokens.cmpx_balance || ' CMPX'
        );
    END IF;

    -- Calcular fecha de fin
    end_date_calc := NOW() + (duration_days || ' days')::INTERVAL;

    -- Actualizar balance (mover a staking)
    UPDATE public.user_tokens
    SET
        cmpx_balance = cmpx_balance - amount_param,
        cmpx_staked = cmpx_staked + amount_param,
        updated_at = NOW()
    WHERE user_id = user_id_param;

    -- Crear registro de staking
    INSERT INTO public.user_staking (
        user_id, amount, end_date, reward_percentage
    ) VALUES (
        user_id_param, amount_param, end_date_calc, 10.00
    );

    -- Registrar transacción
    INSERT INTO public.transactions (
        user_id, transaction_type, token_type, amount,
        balance_before, balance_after, description
    ) VALUES (
        user_id_param, 'stake_tokens', 'CMPX', -amount_param,
        user_tokens.cmpx_balance, user_tokens.cmpx_balance - amount_param,
        'Tokens puestos en staking por ' || duration_days || ' días'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Staking iniciado: ' || amount_param || ' CMPX por ' || duration_days || ' días',
        'amount', amount_param,
        'end_date', end_date_calc,
        'reward_percentage', 10.00
    );
END;
$function$
;

create or replace view "public"."story_engagement_metrics" as  SELECT s.id,
    s.description AS content,
    s.content_type AS post_type,
    COALESCE(sl.likes_count, (0)::bigint) AS likes_count,
    COALESCE(sc.comments_count, (0)::bigint) AS comments_count,
    COALESCE(ss.shares_count, (0)::bigint) AS shares_count,
    s.views_count,
    s.created_at,
    'Usuario'::text AS first_name,
    'Anónimo'::text AS last_name,
    'No especificado'::text AS gender,
    ((COALESCE(sl.likes_count, (0)::bigint) + COALESCE(sc.comments_count, (0)::bigint)) + COALESCE(ss.shares_count, (0)::bigint)) AS total_engagement,
        CASE
            WHEN (s.views_count > 0) THEN ((((COALESCE(sl.likes_count, (0)::bigint) + COALESCE(sc.comments_count, (0)::bigint)) + COALESCE(ss.shares_count, (0)::bigint)))::double precision / (s.views_count)::double precision)
            ELSE (0)::double precision
        END AS engagement_rate
   FROM (((public.stories s
     LEFT JOIN ( SELECT story_likes.story_id,
            count(*) AS likes_count
           FROM public.story_likes
          GROUP BY story_likes.story_id) sl ON ((s.id = sl.story_id)))
     LEFT JOIN ( SELECT story_comments.story_id,
            count(*) AS comments_count
           FROM public.story_comments
          GROUP BY story_comments.story_id) sc ON ((s.id = sc.story_id)))
     LEFT JOIN ( SELECT story_shares.story_id,
            count(*) AS shares_count
           FROM public.story_shares
          GROUP BY story_shares.story_id) ss ON ((s.id = ss.story_id)))
  WHERE (s.is_public = true);


CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    existing_like_id UUID;
    profile_id_var UUID;
BEGIN
    SELECT id INTO profile_id_var FROM public.profiles WHERE user_id = p_user_id LIMIT 1;
    SELECT id INTO existing_like_id FROM public.post_likes WHERE post_id = p_post_id AND user_id = p_user_id;

    IF existing_like_id IS NOT NULL THEN
        DELETE FROM public.post_likes WHERE id = existing_like_id;
        UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = p_post_id;
        RETURN FALSE;
    ELSE
        INSERT INTO public.post_likes (post_id, user_id, profile_id) VALUES (p_post_id, p_user_id, profile_id_var);
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
        RETURN TRUE;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_create_investment_returns()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si el status cambió a 'active' y return_type es 'annual'
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.return_type = 'annual' THEN
    PERFORM create_annual_returns(NEW.id);
  END IF;

  RETURN NEW;
END;
$function$
;

create or replace view "public"."two_factor_stats" as  SELECT count(*) AS total_2fa_setups,
    count(
        CASE
            WHEN (two_factor_auth.is_enabled = true) THEN 1
            ELSE NULL::integer
        END) AS active_2fa_users,
    count(
        CASE
            WHEN ((two_factor_auth.method)::text = '2fa_app'::text) THEN 1
            ELSE NULL::integer
        END) AS app_based_2fa,
    count(
        CASE
            WHEN ((two_factor_auth.method)::text = 'sms'::text) THEN 1
            ELSE NULL::integer
        END) AS sms_based_2fa,
    count(
        CASE
            WHEN ((two_factor_auth.method)::text = 'email'::text) THEN 1
            ELSE NULL::integer
        END) AS email_based_2fa
   FROM public.two_factor_auth;


create or replace view "public"."unresolved_errors_summary" as  SELECT error_alerts.severity,
    error_alerts.category,
    count(*) AS total_errors,
    max(error_alerts."timestamp") AS last_error_at
   FROM public.error_alerts
  WHERE (error_alerts.resolved = false)
  GROUP BY error_alerts.severity, error_alerts.category
  ORDER BY
        CASE error_alerts.severity
            WHEN 'critical'::text THEN 1
            WHEN 'high'::text THEN 2
            WHEN 'medium'::text THEN 3
            WHEN 'low'::text THEN 4
            ELSE NULL::integer
        END, (count(*)) DESC;


CREATE OR REPLACE FUNCTION public.update_ai_scores_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_automation_rules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_banner_config_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_chat_summaries_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_club_checkin_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE clubs
  SET
    check_in_count = (
      SELECT COUNT(DISTINCT user_id)
      FROM club_checkins
      WHERE club_id = NEW.club_id AND is_verified = true
    ),
    updated_at = NOW()
  WHERE id = NEW.club_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE story_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE story_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_couple_statistics()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Actualizar estadísticas diarias
  INSERT INTO couple_statistics (couple_id, date, views, likes, matches, messages)
  VALUES (
    NEW.couple_id,
    CURRENT_DATE,
    CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.interaction_type = 'like' THEN 1 ELSE 0 END,
    0,
    0
  )
  ON CONFLICT (couple_id, date) DO UPDATE SET
    views = couple_statistics.views + CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END,
    likes = couple_statistics.likes + CASE WHEN NEW.interaction_type = 'like' THEN 1 ELSE 0 END;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_fingerprint_last_seen()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.last_seen_at = NOW();
  NEW.seen_count = COALESCE(OLD.seen_count, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_gallery_commissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_media_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_mfa_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_moderator_session_minutes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    NEW.total_minutes := EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
    NEW.is_active := false;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_monitoring_session_end()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.posts
            SET comments_count = comments_count + 1,
                updated_at = NOW()
            WHERE id = NEW.post_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.posts
            SET comments_count = GREATEST(comments_count - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.post_id;
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.posts
            SET likes_count = likes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.post_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.posts
            SET likes_count = GREATEST(likes_count - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.post_id;
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.update_post_shares_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.posts
            SET shares_count = shares_count + 1,
                updated_at = NOW()
            WHERE id = NEW.post_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.posts
            SET shares_count = GREATEST(shares_count - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.post_id;
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $function$
;

CREATE OR REPLACE FUNCTION public.update_story_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE stories SET comments_count = comments_count - 1 WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_story_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE stories SET likes_count = likes_count - 1 WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_story_shares_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE stories SET shares_count = shares_count + 1 WHERE id = NEW.story_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE stories SET shares_count = shares_count - 1 WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_swinger_interests_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_token_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update user_token_balances table based on transaction
    INSERT INTO user_token_balances (user_id, cmpx_balance, gtk_balance, updated_at)
    VALUES (
        NEW.user_id,
        CASE WHEN NEW.token_type = 'CMPX' AND NEW.transaction_type = 'deposit' THEN NEW.amount ELSE 0 END,
        CASE WHEN NEW.token_type = 'GTK' AND NEW.transaction_type = 'deposit' THEN NEW.amount ELSE 0 END,
        NEW.created_at
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        cmpx_balance = CASE
            WHEN NEW.token_type = 'CMPX' AND NEW.transaction_type = 'deposit' THEN user_token_balances.cmpx_balance + NEW.amount
            WHEN NEW.token_type = 'CMPX' AND NEW.transaction_type = 'withdrawal' THEN user_token_balances.cmpx_balance - NEW.amount
            ELSE user_token_balances.cmpx_balance
        END,
        gtk_balance = CASE
            WHEN NEW.token_type = 'GTK' AND NEW.transaction_type = 'deposit' THEN user_token_balances.gtk_balance + NEW.amount
            WHEN NEW.token_type = 'GTK' AND NEW.transaction_type = 'withdrawal' THEN user_token_balances.gtk_balance - NEW.amount
            ELSE user_token_balances.gtk_balance
        END,
        updated_at = NEW.created_at;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_tokens_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_viewed_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.viewed_date = DATE(NEW.viewed_at);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_worldid_statistics_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_worldid_verifications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."user_staking_summary" as  SELECT us.user_id,
    sum(us.amount) AS total_staked,
    count(*) AS total_stakes,
    avg(us.reward_percentage) AS avg_reward_percentage,
    count(
        CASE
            WHEN (us.status = 'active'::text) THEN 1
            ELSE NULL::integer
        END) AS active_stakes,
    count(
        CASE
            WHEN (us.status = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_stakes
   FROM public.user_staking us
  WHERE (auth.uid() = us.user_id)
  GROUP BY us.user_id;


create or replace view "public"."user_story_stats" as  SELECT s.user_id,
    'Usuario'::text AS first_name,
    'Anónimo'::text AS last_name,
    count(s.id) AS total_stories,
    sum(COALESCE(sl.likes_count, (0)::bigint)) AS total_likes_received,
    sum(COALESCE(sc.comments_count, (0)::bigint)) AS total_comments_received,
    sum(COALESCE(ss.shares_count, (0)::bigint)) AS total_shares_received,
    avg(COALESCE(sl.likes_count, (0)::bigint)) AS avg_likes_per_story,
    max(s.created_at) AS last_story_date
   FROM (((public.stories s
     LEFT JOIN ( SELECT story_likes.story_id,
            count(*) AS likes_count
           FROM public.story_likes
          GROUP BY story_likes.story_id) sl ON ((s.id = sl.story_id)))
     LEFT JOIN ( SELECT story_comments.story_id,
            count(*) AS comments_count
           FROM public.story_comments
          GROUP BY story_comments.story_id) sc ON ((s.id = sc.story_id)))
     LEFT JOIN ( SELECT story_shares.story_id,
            count(*) AS shares_count
           FROM public.story_shares
          GROUP BY story_shares.story_id) ss ON ((s.id = ss.story_id)))
  WHERE (s.is_public = true)
  GROUP BY s.user_id;


CREATE OR REPLACE FUNCTION public.validate_token_modification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo permitir modificaciones desde funciones específicas o admins
    IF NOT (
        current_setting('application_name', true) LIKE '%supabase%'
    ) THEN
        RAISE EXCEPTION 'Modificación de tokens no autorizada';
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_checkin_distance(p_club_id uuid, p_latitude double precision, p_longitude double precision)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  club_lat DOUBLE PRECISION;
  club_lng DOUBLE PRECISION;
  club_radius INTEGER;
  distance_m NUMERIC;
BEGIN
  SELECT latitude, longitude, check_in_radius_meters
  INTO club_lat, club_lng, club_radius
  FROM clubs
  WHERE id = p_club_id AND is_active = true;

  IF club_lat IS NULL THEN
    RETURN false;
  END IF;

  -- Intentar usar earthdistance si está disponible
  BEGIN
    distance_m := (
      earth_distance(
        ll_to_earth(club_lat, club_lng),
        ll_to_earth(p_latitude, p_longitude)
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Fallback a fórmula Haversine manual
      distance_m := (
        6371000 * acos(
          LEAST(1.0,
            cos(radians(club_lat)) *
            cos(radians(p_latitude)) *
            cos(radians(p_longitude) - radians(club_lng)) +
            sin(radians(club_lat)) *
            sin(radians(p_latitude))
          )
        )
      );
  END;

  RETURN distance_m <= club_radius;
END;
$function$
;

create or replace view "public"."web_vitals_daily" as  SELECT date(web_vitals_history."timestamp") AS date,
    avg(web_vitals_history.lcp) AS avg_lcp,
    avg(web_vitals_history.fcp) AS avg_fcp,
    avg(web_vitals_history.fid) AS avg_fid,
    avg(web_vitals_history.cls) AS avg_cls,
    avg(web_vitals_history.ttfb) AS avg_ttfb,
    count(*) AS total_measurements,
    sum(
        CASE
            WHEN (web_vitals_history.lcp <= (2500)::numeric) THEN 1
            ELSE 0
        END) AS good_lcp_count,
    sum(
        CASE
            WHEN (web_vitals_history.fcp <= (1800)::numeric) THEN 1
            ELSE 0
        END) AS good_fcp_count,
    sum(
        CASE
            WHEN (web_vitals_history.fid <= (100)::numeric) THEN 1
            ELSE 0
        END) AS good_fid_count,
    sum(
        CASE
            WHEN (web_vitals_history.cls <= 0.1) THEN 1
            ELSE 0
        END) AS good_cls_count,
    sum(
        CASE
            WHEN (web_vitals_history.ttfb <= (800)::numeric) THEN 1
            ELSE 0
        END) AS good_ttfb_count
   FROM public.web_vitals_history
  GROUP BY (date(web_vitals_history."timestamp"))
  ORDER BY (date(web_vitals_history."timestamp")) DESC;


CREATE OR REPLACE FUNCTION public.audit_profile_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.security_audit_log (
            user_id,
            action,
            resource,
            details,
            severity
        ) VALUES (
            NEW.user_id,
            'PROFILE_UPDATED',
            'profiles',
            jsonb_build_object(
                'old_email', mask_email(OLD.email),
                'new_email', mask_email(NEW.email),
                'changes', jsonb_build_object(
                    'is_verified', OLD.is_verified IS DISTINCT FROM NEW.is_verified
                )
            ),
            'info'
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.security_audit_log (
            user_id,
            action,
            resource,
            details,
            severity
        ) VALUES (
            NEW.user_id,
            'PROFILE_CREATED',
            'profiles',
            jsonb_build_object(
                'email', mask_email(NEW.email)
            ),
            'info'
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.block_ip(p_ip_address text, p_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Crear registro de bloqueo
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, is_blocked)
    VALUES (p_ip_address, 'BLOCKED', 999999, TRUE);

    RAISE NOTICE 'IP bloqueada: % - Razón: %', p_ip_address, p_reason;

    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_couple_agreement_signatures()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.partner_1_signature = TRUE AND NEW.partner_2_signature = TRUE THEN
        NEW.status = 'ACTIVE';
        NEW.dispute_deadline = NOW() + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_ip_address text, p_endpoint text, p_max_requests integer DEFAULT 100)
 RETURNS TABLE(allowed boolean, remaining_requests integer, reset_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_window_end TIMESTAMP WITH TIME ZONE;
    v_request_count INTEGER;
    v_remaining INTEGER;
    v_allowed BOOLEAN;
BEGIN
    -- Definir ventana de tiempo (1 minuto)
    v_window_start := date_trunc('minute', NOW());
    v_window_end := v_window_start + INTERVAL '1 minute';

    -- Buscar o crear registro de rate limit
    SELECT
        request_count,
        CASE
            WHEN request_count < p_max_requests THEN TRUE
            ELSE FALSE
        END,
        p_max_requests - request_count,
        window_end
    INTO
        v_request_count,
        v_allowed,
        v_remaining,
        v_window_end
    FROM public.rate_limits
    WHERE
        user_id = p_user_id
        AND window_start = v_window_start
        AND endpoint = p_endpoint;

    -- Si no existe registro, crear uno nuevo
    IF NOT FOUND THEN
        INSERT INTO public.rate_limits (
            user_id,
            ip_address,
            endpoint,
            request_count,
            window_start,
            window_end
        ) VALUES (
            p_user_id,
            p_ip_address,
            p_endpoint,
            1,
            v_window_start,
            v_window_end
        );

        v_allowed := TRUE;
        v_remaining := p_max_requests - 1;
        v_window_end := v_window_start + INTERVAL '1 minute';
    ELSE
        -- Incrementar contador si está permitido
        IF v_allowed THEN
            UPDATE public.rate_limits
            SET
                request_count = request_count + 1,
                updated_at = NOW()
            WHERE
                user_id = p_user_id
                AND window_start = v_window_start
                AND endpoint = p_endpoint;
        END IF;
    END IF;

    RETURN QUERY SELECT
        v_allowed AS allowed,
        v_remaining AS remaining_requests,
        v_window_end AS reset_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_couple_requests()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE couple_nft_requests
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(p_user_id uuid)
 RETURNS TABLE(is_suspicious boolean, reason text, severity text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_suspicious BOOLEAN := FALSE;
    v_reason TEXT := '';
    v_severity TEXT := 'low';
    v_multiple_ips INTEGER;
    v_high_request_rate INTEGER;
BEGIN
    -- Verificar múltiples IPs en corto tiempo
    SELECT COUNT(DISTINCT ip_address) INTO v_multiple_ips
    FROM public.rate_limits
    WHERE
        user_id = p_user_id
        AND window_start > NOW() - INTERVAL '1 hour';

    IF v_multiple_ips > 5 THEN
        v_suspicious := TRUE;
        v_reason := 'Múltiples IPs detectadas en 1 hora: ' || v_multiple_ips;
        v_severity := 'high';
    END IF;

    -- Verificar alta tasa de requests
    SELECT COUNT(*) INTO v_high_request_rate
    FROM public.rate_limits
    WHERE
        user_id = p_user_id
        AND window_start > NOW() - INTERVAL '5 minutes';

    IF v_high_request_rate > 500 THEN
        v_suspicious := TRUE;
        v_reason := COALESCE(v_reason || ', ', '') || 'Alta tasa de requests: ' || v_high_request_rate;
        v_severity := 'high';
    END IF;

    RETURN QUERY SELECT
        v_suspicious AS is_suspicious,
        v_reason AS reason,
        v_severity AS severity;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.escape_html(text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF text IS NULL THEN
        RETURN NULL;
    END IF;

    -- Escapar caracteres HTML peligrosos
    RETURN replace(
        replace(
            replace(
                replace(
                    replace(text, '&', '&amp;'),
                    '<', '&lt;'
                ),
                '>', '&gt;'
            ),
            '"', '&quot;'
        ),
        '''', '&#39;'
    );
END;
$function$
;

create or replace view "public"."geographic_hotspots" as  SELECT profiles.s2_cell_id,
    count(*) AS active_users,
    profiles.s2_level,
    round(avg(profiles.age), 1) AS avg_age,
    max(profiles.updated_at) AS last_activity
   FROM public.profiles
  WHERE ((profiles.s2_cell_id IS NOT NULL) AND (profiles.updated_at > (now() - '7 days'::interval)))
  GROUP BY profiles.s2_cell_id, profiles.s2_level
 HAVING (count(*) >= 5)
  ORDER BY (count(*)) DESC;


CREATE OR REPLACE FUNCTION public.get_testnet_stats()
 RETURNS TABLE(total_users_claimed integer, total_amount_claimed bigint, total_daily_claims integer, avg_daily_claim numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(DISTINCT user_id) FROM testnet_token_claims)::INTEGER,
        (SELECT COALESCE(SUM(amount_claimed), 0) FROM testnet_token_claims),
        (SELECT COUNT(*) FROM daily_token_claims)::INTEGER,
        (SELECT COALESCE(AVG(amount_claimed), 0) FROM daily_token_claims);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_access_to_sensitive_data(p_target_user_id uuid, p_data_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- El usuario siempre puede acceder a sus propios datos
    IF p_target_user_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- Los admins pueden acceder a cualquier dato
    IF EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() AND is_active = TRUE
    ) THEN
        RETURN TRUE;
    END IF;

    -- Para datos específicos, verificar permisos adicionales
    CASE p_data_type
        WHEN 'email' THEN
            -- Solo el propio usuario y admins pueden ver emails
            RETURN FALSE;
        WHEN 'phone' THEN
            -- Solo el propio usuario y admins pueden ver teléfonos
            RETURN FALSE;
        WHEN 'financial' THEN
            -- Solo el propio usuario y admins pueden ver datos financieros
            RETURN FALSE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_blocked BOOLEAN;
BEGIN
    SELECT is_blocked INTO v_blocked
    FROM public.rate_limits
    WHERE
        ip_address = p_ip_address
        AND is_blocked = TRUE
        AND window_end > NOW()
    LIMIT 1;

    RETURN COALESCE(v_blocked, FALSE);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_valid_email(email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_valid_uuid(uuid text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_ip_address text, p_action text, p_resource text, p_details jsonb, p_severity text DEFAULT 'info'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        ip_address,
        action,
        resource,
        details,
        severity
    ) VALUES (
        p_user_id,
        p_ip_address,
        p_action,
        p_resource,
        p_details,
        p_severity
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mask_email(email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    local_part TEXT;
    domain TEXT;
BEGIN
    IF email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Extraer local part y domain
    local_part := split_part(email, '@', 1);
    domain := split_part(email, '@', 2);

    -- Enmascarar local part (mostrar solo primeros 2 caracteres)
    IF length(local_part) > 2 THEN
        local_part := substring(local_part, 1, 2) || '***';
    ELSE
        local_part := '***';
    END IF;

    RETURN local_part || '@' || domain;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mask_sensitive_data(data text, data_type text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;

    CASE data_type
        WHEN 'email' THEN
            RETURN mask_email(data);
        WHEN 'phone' THEN
            -- Enmascarar número de teléfono
            IF length(data) > 4 THEN
                RETURN '***' || substring(data, length(data) - 3);
            ELSE
                RETURN '***';
            END IF;
        WHEN 'credit_card' THEN
            -- Enmascarar tarjeta de crédito
            IF length(data) > 4 THEN
                RETURN '****-****-****-' || substring(data, length(data) - 3);
            ELSE
                RETURN '****';
            END IF;
        ELSE
            RETURN '***';
    END CASE;
END;
$function$
;

create or replace view "public"."profiles_safe" as  SELECT profiles.id,
    profiles.user_id,
    profiles.is_verified,
    profiles.is_premium,
    profiles.created_at,
    profiles.updated_at
   FROM public.profiles;


CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Eliminar caracteres peligrosos
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '''', '', 'g'),
            ';', '', 'g'
        ),
        '--', '', 'g'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sanitize_profile_inputs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Sanitizar campos de texto (solo si existen)
    IF NEW.first_name IS NOT NULL THEN
        NEW.first_name := sanitize_input(NEW.first_name);
    END IF;

    IF NEW.last_name IS NOT NULL THEN
        NEW.last_name := sanitize_input(NEW.last_name);
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sanitize_user_content(content text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF content IS NULL THEN
        RETURN NULL;
    END IF;

    -- Sanitizar contra inyección SQL y XSS
    RETURN escape_html(sanitize_input(content));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_couple_agreements_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_gallery_permissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_images_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_invitations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_two_factor_auth_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_consents_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_profile_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.email IS NOT NULL AND NOT is_valid_email(NEW.email) THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."ai_compatibility_scores" to "anon";

grant insert on table "public"."ai_compatibility_scores" to "anon";

grant references on table "public"."ai_compatibility_scores" to "anon";

grant select on table "public"."ai_compatibility_scores" to "anon";

grant trigger on table "public"."ai_compatibility_scores" to "anon";

grant truncate on table "public"."ai_compatibility_scores" to "anon";

grant update on table "public"."ai_compatibility_scores" to "anon";

grant delete on table "public"."ai_compatibility_scores" to "authenticated";

grant insert on table "public"."ai_compatibility_scores" to "authenticated";

grant references on table "public"."ai_compatibility_scores" to "authenticated";

grant select on table "public"."ai_compatibility_scores" to "authenticated";

grant trigger on table "public"."ai_compatibility_scores" to "authenticated";

grant truncate on table "public"."ai_compatibility_scores" to "authenticated";

grant update on table "public"."ai_compatibility_scores" to "authenticated";

grant delete on table "public"."ai_compatibility_scores" to "service_role";

grant insert on table "public"."ai_compatibility_scores" to "service_role";

grant references on table "public"."ai_compatibility_scores" to "service_role";

grant select on table "public"."ai_compatibility_scores" to "service_role";

grant trigger on table "public"."ai_compatibility_scores" to "service_role";

grant truncate on table "public"."ai_compatibility_scores" to "service_role";

grant update on table "public"."ai_compatibility_scores" to "service_role";

grant delete on table "public"."ai_model_metrics" to "anon";

grant insert on table "public"."ai_model_metrics" to "anon";

grant references on table "public"."ai_model_metrics" to "anon";

grant select on table "public"."ai_model_metrics" to "anon";

grant trigger on table "public"."ai_model_metrics" to "anon";

grant truncate on table "public"."ai_model_metrics" to "anon";

grant update on table "public"."ai_model_metrics" to "anon";

grant delete on table "public"."ai_model_metrics" to "authenticated";

grant insert on table "public"."ai_model_metrics" to "authenticated";

grant references on table "public"."ai_model_metrics" to "authenticated";

grant select on table "public"."ai_model_metrics" to "authenticated";

grant trigger on table "public"."ai_model_metrics" to "authenticated";

grant truncate on table "public"."ai_model_metrics" to "authenticated";

grant update on table "public"."ai_model_metrics" to "authenticated";

grant delete on table "public"."ai_model_metrics" to "service_role";

grant insert on table "public"."ai_model_metrics" to "service_role";

grant references on table "public"."ai_model_metrics" to "service_role";

grant select on table "public"."ai_model_metrics" to "service_role";

grant trigger on table "public"."ai_model_metrics" to "service_role";

grant truncate on table "public"."ai_model_metrics" to "service_role";

grant update on table "public"."ai_model_metrics" to "service_role";

grant delete on table "public"."ai_prediction_logs" to "anon";

grant insert on table "public"."ai_prediction_logs" to "anon";

grant references on table "public"."ai_prediction_logs" to "anon";

grant select on table "public"."ai_prediction_logs" to "anon";

grant trigger on table "public"."ai_prediction_logs" to "anon";

grant truncate on table "public"."ai_prediction_logs" to "anon";

grant update on table "public"."ai_prediction_logs" to "anon";

grant delete on table "public"."ai_prediction_logs" to "authenticated";

grant insert on table "public"."ai_prediction_logs" to "authenticated";

grant references on table "public"."ai_prediction_logs" to "authenticated";

grant select on table "public"."ai_prediction_logs" to "authenticated";

grant trigger on table "public"."ai_prediction_logs" to "authenticated";

grant truncate on table "public"."ai_prediction_logs" to "authenticated";

grant update on table "public"."ai_prediction_logs" to "authenticated";

grant delete on table "public"."ai_prediction_logs" to "service_role";

grant insert on table "public"."ai_prediction_logs" to "service_role";

grant references on table "public"."ai_prediction_logs" to "service_role";

grant select on table "public"."ai_prediction_logs" to "service_role";

grant trigger on table "public"."ai_prediction_logs" to "service_role";

grant truncate on table "public"."ai_prediction_logs" to "service_role";

grant update on table "public"."ai_prediction_logs" to "service_role";

grant delete on table "public"."apk_downloads" to "anon";

grant insert on table "public"."apk_downloads" to "anon";

grant references on table "public"."apk_downloads" to "anon";

grant select on table "public"."apk_downloads" to "anon";

grant trigger on table "public"."apk_downloads" to "anon";

grant truncate on table "public"."apk_downloads" to "anon";

grant update on table "public"."apk_downloads" to "anon";

grant delete on table "public"."apk_downloads" to "authenticated";

grant insert on table "public"."apk_downloads" to "authenticated";

grant references on table "public"."apk_downloads" to "authenticated";

grant select on table "public"."apk_downloads" to "authenticated";

grant trigger on table "public"."apk_downloads" to "authenticated";

grant truncate on table "public"."apk_downloads" to "authenticated";

grant update on table "public"."apk_downloads" to "authenticated";

grant delete on table "public"."apk_downloads" to "service_role";

grant insert on table "public"."apk_downloads" to "service_role";

grant references on table "public"."apk_downloads" to "service_role";

grant select on table "public"."apk_downloads" to "service_role";

grant trigger on table "public"."apk_downloads" to "service_role";

grant truncate on table "public"."apk_downloads" to "service_role";

grant update on table "public"."apk_downloads" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."automation_rules" to "anon";

grant insert on table "public"."automation_rules" to "anon";

grant references on table "public"."automation_rules" to "anon";

grant select on table "public"."automation_rules" to "anon";

grant trigger on table "public"."automation_rules" to "anon";

grant truncate on table "public"."automation_rules" to "anon";

grant update on table "public"."automation_rules" to "anon";

grant delete on table "public"."automation_rules" to "authenticated";

grant insert on table "public"."automation_rules" to "authenticated";

grant references on table "public"."automation_rules" to "authenticated";

grant select on table "public"."automation_rules" to "authenticated";

grant trigger on table "public"."automation_rules" to "authenticated";

grant truncate on table "public"."automation_rules" to "authenticated";

grant update on table "public"."automation_rules" to "authenticated";

grant delete on table "public"."automation_rules" to "service_role";

grant insert on table "public"."automation_rules" to "service_role";

grant references on table "public"."automation_rules" to "service_role";

grant select on table "public"."automation_rules" to "service_role";

grant trigger on table "public"."automation_rules" to "service_role";

grant truncate on table "public"."automation_rules" to "service_role";

grant update on table "public"."automation_rules" to "service_role";

grant delete on table "public"."biometric_challenges" to "anon";

grant insert on table "public"."biometric_challenges" to "anon";

grant references on table "public"."biometric_challenges" to "anon";

grant select on table "public"."biometric_challenges" to "anon";

grant trigger on table "public"."biometric_challenges" to "anon";

grant truncate on table "public"."biometric_challenges" to "anon";

grant update on table "public"."biometric_challenges" to "anon";

grant delete on table "public"."biometric_challenges" to "authenticated";

grant insert on table "public"."biometric_challenges" to "authenticated";

grant references on table "public"."biometric_challenges" to "authenticated";

grant select on table "public"."biometric_challenges" to "authenticated";

grant trigger on table "public"."biometric_challenges" to "authenticated";

grant truncate on table "public"."biometric_challenges" to "authenticated";

grant update on table "public"."biometric_challenges" to "authenticated";

grant delete on table "public"."biometric_challenges" to "service_role";

grant insert on table "public"."biometric_challenges" to "service_role";

grant references on table "public"."biometric_challenges" to "service_role";

grant select on table "public"."biometric_challenges" to "service_role";

grant trigger on table "public"."biometric_challenges" to "service_role";

grant truncate on table "public"."biometric_challenges" to "service_role";

grant update on table "public"."biometric_challenges" to "service_role";

grant delete on table "public"."biometric_credentials" to "anon";

grant insert on table "public"."biometric_credentials" to "anon";

grant references on table "public"."biometric_credentials" to "anon";

grant select on table "public"."biometric_credentials" to "anon";

grant trigger on table "public"."biometric_credentials" to "anon";

grant truncate on table "public"."biometric_credentials" to "anon";

grant update on table "public"."biometric_credentials" to "anon";

grant delete on table "public"."biometric_credentials" to "authenticated";

grant insert on table "public"."biometric_credentials" to "authenticated";

grant references on table "public"."biometric_credentials" to "authenticated";

grant select on table "public"."biometric_credentials" to "authenticated";

grant trigger on table "public"."biometric_credentials" to "authenticated";

grant truncate on table "public"."biometric_credentials" to "authenticated";

grant update on table "public"."biometric_credentials" to "authenticated";

grant delete on table "public"."biometric_credentials" to "service_role";

grant insert on table "public"."biometric_credentials" to "service_role";

grant references on table "public"."biometric_credentials" to "service_role";

grant select on table "public"."biometric_credentials" to "service_role";

grant trigger on table "public"."biometric_credentials" to "service_role";

grant truncate on table "public"."biometric_credentials" to "service_role";

grant update on table "public"."biometric_credentials" to "service_role";

grant delete on table "public"."biometric_sessions" to "anon";

grant insert on table "public"."biometric_sessions" to "anon";

grant references on table "public"."biometric_sessions" to "anon";

grant select on table "public"."biometric_sessions" to "anon";

grant trigger on table "public"."biometric_sessions" to "anon";

grant truncate on table "public"."biometric_sessions" to "anon";

grant update on table "public"."biometric_sessions" to "anon";

grant delete on table "public"."biometric_sessions" to "authenticated";

grant insert on table "public"."biometric_sessions" to "authenticated";

grant references on table "public"."biometric_sessions" to "authenticated";

grant select on table "public"."biometric_sessions" to "authenticated";

grant trigger on table "public"."biometric_sessions" to "authenticated";

grant truncate on table "public"."biometric_sessions" to "authenticated";

grant update on table "public"."biometric_sessions" to "authenticated";

grant delete on table "public"."biometric_sessions" to "service_role";

grant insert on table "public"."biometric_sessions" to "service_role";

grant references on table "public"."biometric_sessions" to "service_role";

grant select on table "public"."biometric_sessions" to "service_role";

grant trigger on table "public"."biometric_sessions" to "service_role";

grant truncate on table "public"."biometric_sessions" to "service_role";

grant update on table "public"."biometric_sessions" to "service_role";

grant delete on table "public"."blocked_ips" to "anon";

grant insert on table "public"."blocked_ips" to "anon";

grant references on table "public"."blocked_ips" to "anon";

grant select on table "public"."blocked_ips" to "anon";

grant trigger on table "public"."blocked_ips" to "anon";

grant truncate on table "public"."blocked_ips" to "anon";

grant update on table "public"."blocked_ips" to "anon";

grant delete on table "public"."blocked_ips" to "authenticated";

grant insert on table "public"."blocked_ips" to "authenticated";

grant references on table "public"."blocked_ips" to "authenticated";

grant select on table "public"."blocked_ips" to "authenticated";

grant trigger on table "public"."blocked_ips" to "authenticated";

grant truncate on table "public"."blocked_ips" to "authenticated";

grant update on table "public"."blocked_ips" to "authenticated";

grant delete on table "public"."blocked_ips" to "service_role";

grant insert on table "public"."blocked_ips" to "service_role";

grant references on table "public"."blocked_ips" to "service_role";

grant select on table "public"."blocked_ips" to "service_role";

grant trigger on table "public"."blocked_ips" to "service_role";

grant truncate on table "public"."blocked_ips" to "service_role";

grant update on table "public"."blocked_ips" to "service_role";

grant delete on table "public"."blocks" to "anon";

grant insert on table "public"."blocks" to "anon";

grant references on table "public"."blocks" to "anon";

grant select on table "public"."blocks" to "anon";

grant trigger on table "public"."blocks" to "anon";

grant truncate on table "public"."blocks" to "anon";

grant update on table "public"."blocks" to "anon";

grant delete on table "public"."blocks" to "authenticated";

grant insert on table "public"."blocks" to "authenticated";

grant references on table "public"."blocks" to "authenticated";

grant select on table "public"."blocks" to "authenticated";

grant trigger on table "public"."blocks" to "authenticated";

grant truncate on table "public"."blocks" to "authenticated";

grant update on table "public"."blocks" to "authenticated";

grant delete on table "public"."blocks" to "service_role";

grant insert on table "public"."blocks" to "service_role";

grant references on table "public"."blocks" to "service_role";

grant select on table "public"."blocks" to "service_role";

grant trigger on table "public"."blocks" to "service_role";

grant truncate on table "public"."blocks" to "service_role";

grant update on table "public"."blocks" to "service_role";

grant delete on table "public"."chat_invitations" to "anon";

grant insert on table "public"."chat_invitations" to "anon";

grant references on table "public"."chat_invitations" to "anon";

grant select on table "public"."chat_invitations" to "anon";

grant trigger on table "public"."chat_invitations" to "anon";

grant truncate on table "public"."chat_invitations" to "anon";

grant update on table "public"."chat_invitations" to "anon";

grant delete on table "public"."chat_invitations" to "authenticated";

grant insert on table "public"."chat_invitations" to "authenticated";

grant references on table "public"."chat_invitations" to "authenticated";

grant select on table "public"."chat_invitations" to "authenticated";

grant trigger on table "public"."chat_invitations" to "authenticated";

grant truncate on table "public"."chat_invitations" to "authenticated";

grant update on table "public"."chat_invitations" to "authenticated";

grant delete on table "public"."chat_invitations" to "service_role";

grant insert on table "public"."chat_invitations" to "service_role";

grant references on table "public"."chat_invitations" to "service_role";

grant select on table "public"."chat_invitations" to "service_role";

grant trigger on table "public"."chat_invitations" to "service_role";

grant truncate on table "public"."chat_invitations" to "service_role";

grant update on table "public"."chat_invitations" to "service_role";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."club_checkins" to "anon";

grant insert on table "public"."club_checkins" to "anon";

grant references on table "public"."club_checkins" to "anon";

grant select on table "public"."club_checkins" to "anon";

grant trigger on table "public"."club_checkins" to "anon";

grant truncate on table "public"."club_checkins" to "anon";

grant update on table "public"."club_checkins" to "anon";

grant delete on table "public"."club_checkins" to "authenticated";

grant insert on table "public"."club_checkins" to "authenticated";

grant references on table "public"."club_checkins" to "authenticated";

grant select on table "public"."club_checkins" to "authenticated";

grant trigger on table "public"."club_checkins" to "authenticated";

grant truncate on table "public"."club_checkins" to "authenticated";

grant update on table "public"."club_checkins" to "authenticated";

grant delete on table "public"."club_checkins" to "service_role";

grant insert on table "public"."club_checkins" to "service_role";

grant references on table "public"."club_checkins" to "service_role";

grant select on table "public"."club_checkins" to "service_role";

grant trigger on table "public"."club_checkins" to "service_role";

grant truncate on table "public"."club_checkins" to "service_role";

grant update on table "public"."club_checkins" to "service_role";

grant delete on table "public"."club_flyers" to "anon";

grant insert on table "public"."club_flyers" to "anon";

grant references on table "public"."club_flyers" to "anon";

grant select on table "public"."club_flyers" to "anon";

grant trigger on table "public"."club_flyers" to "anon";

grant truncate on table "public"."club_flyers" to "anon";

grant update on table "public"."club_flyers" to "anon";

grant delete on table "public"."club_flyers" to "authenticated";

grant insert on table "public"."club_flyers" to "authenticated";

grant references on table "public"."club_flyers" to "authenticated";

grant select on table "public"."club_flyers" to "authenticated";

grant trigger on table "public"."club_flyers" to "authenticated";

grant truncate on table "public"."club_flyers" to "authenticated";

grant update on table "public"."club_flyers" to "authenticated";

grant delete on table "public"."club_flyers" to "service_role";

grant insert on table "public"."club_flyers" to "service_role";

grant references on table "public"."club_flyers" to "service_role";

grant select on table "public"."club_flyers" to "service_role";

grant trigger on table "public"."club_flyers" to "service_role";

grant truncate on table "public"."club_flyers" to "service_role";

grant update on table "public"."club_flyers" to "service_role";

grant delete on table "public"."club_reviews" to "anon";

grant insert on table "public"."club_reviews" to "anon";

grant references on table "public"."club_reviews" to "anon";

grant select on table "public"."club_reviews" to "anon";

grant trigger on table "public"."club_reviews" to "anon";

grant truncate on table "public"."club_reviews" to "anon";

grant update on table "public"."club_reviews" to "anon";

grant delete on table "public"."club_reviews" to "authenticated";

grant insert on table "public"."club_reviews" to "authenticated";

grant references on table "public"."club_reviews" to "authenticated";

grant select on table "public"."club_reviews" to "authenticated";

grant trigger on table "public"."club_reviews" to "authenticated";

grant truncate on table "public"."club_reviews" to "authenticated";

grant update on table "public"."club_reviews" to "authenticated";

grant delete on table "public"."club_reviews" to "service_role";

grant insert on table "public"."club_reviews" to "service_role";

grant references on table "public"."club_reviews" to "service_role";

grant select on table "public"."club_reviews" to "service_role";

grant trigger on table "public"."club_reviews" to "service_role";

grant truncate on table "public"."club_reviews" to "service_role";

grant update on table "public"."club_reviews" to "service_role";

grant delete on table "public"."club_verifications" to "anon";

grant insert on table "public"."club_verifications" to "anon";

grant references on table "public"."club_verifications" to "anon";

grant select on table "public"."club_verifications" to "anon";

grant trigger on table "public"."club_verifications" to "anon";

grant truncate on table "public"."club_verifications" to "anon";

grant update on table "public"."club_verifications" to "anon";

grant delete on table "public"."club_verifications" to "authenticated";

grant insert on table "public"."club_verifications" to "authenticated";

grant references on table "public"."club_verifications" to "authenticated";

grant select on table "public"."club_verifications" to "authenticated";

grant trigger on table "public"."club_verifications" to "authenticated";

grant truncate on table "public"."club_verifications" to "authenticated";

grant update on table "public"."club_verifications" to "authenticated";

grant delete on table "public"."club_verifications" to "service_role";

grant insert on table "public"."club_verifications" to "service_role";

grant references on table "public"."club_verifications" to "service_role";

grant select on table "public"."club_verifications" to "service_role";

grant trigger on table "public"."club_verifications" to "service_role";

grant truncate on table "public"."club_verifications" to "service_role";

grant update on table "public"."club_verifications" to "service_role";

grant delete on table "public"."comment_likes" to "anon";

grant insert on table "public"."comment_likes" to "anon";

grant references on table "public"."comment_likes" to "anon";

grant select on table "public"."comment_likes" to "anon";

grant trigger on table "public"."comment_likes" to "anon";

grant truncate on table "public"."comment_likes" to "anon";

grant update on table "public"."comment_likes" to "anon";

grant delete on table "public"."comment_likes" to "authenticated";

grant insert on table "public"."comment_likes" to "authenticated";

grant references on table "public"."comment_likes" to "authenticated";

grant select on table "public"."comment_likes" to "authenticated";

grant trigger on table "public"."comment_likes" to "authenticated";

grant truncate on table "public"."comment_likes" to "authenticated";

grant update on table "public"."comment_likes" to "authenticated";

grant delete on table "public"."comment_likes" to "service_role";

grant insert on table "public"."comment_likes" to "service_role";

grant references on table "public"."comment_likes" to "service_role";

grant select on table "public"."comment_likes" to "service_role";

grant trigger on table "public"."comment_likes" to "service_role";

grant truncate on table "public"."comment_likes" to "service_role";

grant update on table "public"."comment_likes" to "service_role";

grant delete on table "public"."compatibility_scores" to "anon";

grant insert on table "public"."compatibility_scores" to "anon";

grant references on table "public"."compatibility_scores" to "anon";

grant select on table "public"."compatibility_scores" to "anon";

grant trigger on table "public"."compatibility_scores" to "anon";

grant truncate on table "public"."compatibility_scores" to "anon";

grant update on table "public"."compatibility_scores" to "anon";

grant delete on table "public"."compatibility_scores" to "authenticated";

grant insert on table "public"."compatibility_scores" to "authenticated";

grant references on table "public"."compatibility_scores" to "authenticated";

grant select on table "public"."compatibility_scores" to "authenticated";

grant trigger on table "public"."compatibility_scores" to "authenticated";

grant truncate on table "public"."compatibility_scores" to "authenticated";

grant update on table "public"."compatibility_scores" to "authenticated";

grant delete on table "public"."compatibility_scores" to "service_role";

grant insert on table "public"."compatibility_scores" to "service_role";

grant references on table "public"."compatibility_scores" to "service_role";

grant select on table "public"."compatibility_scores" to "service_role";

grant trigger on table "public"."compatibility_scores" to "service_role";

grant truncate on table "public"."compatibility_scores" to "service_role";

grant update on table "public"."compatibility_scores" to "service_role";

grant delete on table "public"."content_moderation" to "anon";

grant insert on table "public"."content_moderation" to "anon";

grant references on table "public"."content_moderation" to "anon";

grant select on table "public"."content_moderation" to "anon";

grant trigger on table "public"."content_moderation" to "anon";

grant truncate on table "public"."content_moderation" to "anon";

grant update on table "public"."content_moderation" to "anon";

grant delete on table "public"."content_moderation" to "authenticated";

grant insert on table "public"."content_moderation" to "authenticated";

grant references on table "public"."content_moderation" to "authenticated";

grant select on table "public"."content_moderation" to "authenticated";

grant trigger on table "public"."content_moderation" to "authenticated";

grant truncate on table "public"."content_moderation" to "authenticated";

grant update on table "public"."content_moderation" to "authenticated";

grant delete on table "public"."content_moderation" to "service_role";

grant insert on table "public"."content_moderation" to "service_role";

grant references on table "public"."content_moderation" to "service_role";

grant select on table "public"."content_moderation" to "service_role";

grant trigger on table "public"."content_moderation" to "service_role";

grant truncate on table "public"."content_moderation" to "service_role";

grant update on table "public"."content_moderation" to "service_role";

grant delete on table "public"."couple_favorites" to "anon";

grant insert on table "public"."couple_favorites" to "anon";

grant references on table "public"."couple_favorites" to "anon";

grant select on table "public"."couple_favorites" to "anon";

grant trigger on table "public"."couple_favorites" to "anon";

grant truncate on table "public"."couple_favorites" to "anon";

grant update on table "public"."couple_favorites" to "anon";

grant delete on table "public"."couple_favorites" to "authenticated";

grant insert on table "public"."couple_favorites" to "authenticated";

grant references on table "public"."couple_favorites" to "authenticated";

grant select on table "public"."couple_favorites" to "authenticated";

grant trigger on table "public"."couple_favorites" to "authenticated";

grant truncate on table "public"."couple_favorites" to "authenticated";

grant update on table "public"."couple_favorites" to "authenticated";

grant delete on table "public"."couple_favorites" to "service_role";

grant insert on table "public"."couple_favorites" to "service_role";

grant references on table "public"."couple_favorites" to "service_role";

grant select on table "public"."couple_favorites" to "service_role";

grant trigger on table "public"."couple_favorites" to "service_role";

grant truncate on table "public"."couple_favorites" to "service_role";

grant update on table "public"."couple_favorites" to "service_role";

grant delete on table "public"."couple_gifts" to "anon";

grant insert on table "public"."couple_gifts" to "anon";

grant references on table "public"."couple_gifts" to "anon";

grant select on table "public"."couple_gifts" to "anon";

grant trigger on table "public"."couple_gifts" to "anon";

grant truncate on table "public"."couple_gifts" to "anon";

grant update on table "public"."couple_gifts" to "anon";

grant delete on table "public"."couple_gifts" to "authenticated";

grant insert on table "public"."couple_gifts" to "authenticated";

grant references on table "public"."couple_gifts" to "authenticated";

grant select on table "public"."couple_gifts" to "authenticated";

grant trigger on table "public"."couple_gifts" to "authenticated";

grant truncate on table "public"."couple_gifts" to "authenticated";

grant update on table "public"."couple_gifts" to "authenticated";

grant delete on table "public"."couple_gifts" to "service_role";

grant insert on table "public"."couple_gifts" to "service_role";

grant references on table "public"."couple_gifts" to "service_role";

grant select on table "public"."couple_gifts" to "service_role";

grant trigger on table "public"."couple_gifts" to "service_role";

grant truncate on table "public"."couple_gifts" to "service_role";

grant update on table "public"."couple_gifts" to "service_role";

grant delete on table "public"."couple_interactions" to "anon";

grant insert on table "public"."couple_interactions" to "anon";

grant references on table "public"."couple_interactions" to "anon";

grant select on table "public"."couple_interactions" to "anon";

grant trigger on table "public"."couple_interactions" to "anon";

grant truncate on table "public"."couple_interactions" to "anon";

grant update on table "public"."couple_interactions" to "anon";

grant delete on table "public"."couple_interactions" to "authenticated";

grant insert on table "public"."couple_interactions" to "authenticated";

grant references on table "public"."couple_interactions" to "authenticated";

grant select on table "public"."couple_interactions" to "authenticated";

grant trigger on table "public"."couple_interactions" to "authenticated";

grant truncate on table "public"."couple_interactions" to "authenticated";

grant update on table "public"."couple_interactions" to "authenticated";

grant delete on table "public"."couple_interactions" to "service_role";

grant insert on table "public"."couple_interactions" to "service_role";

grant references on table "public"."couple_interactions" to "service_role";

grant select on table "public"."couple_interactions" to "service_role";

grant trigger on table "public"."couple_interactions" to "service_role";

grant truncate on table "public"."couple_interactions" to "service_role";

grant update on table "public"."couple_interactions" to "service_role";

grant delete on table "public"."couple_matches" to "anon";

grant insert on table "public"."couple_matches" to "anon";

grant references on table "public"."couple_matches" to "anon";

grant select on table "public"."couple_matches" to "anon";

grant trigger on table "public"."couple_matches" to "anon";

grant truncate on table "public"."couple_matches" to "anon";

grant update on table "public"."couple_matches" to "anon";

grant delete on table "public"."couple_matches" to "authenticated";

grant insert on table "public"."couple_matches" to "authenticated";

grant references on table "public"."couple_matches" to "authenticated";

grant select on table "public"."couple_matches" to "authenticated";

grant trigger on table "public"."couple_matches" to "authenticated";

grant truncate on table "public"."couple_matches" to "authenticated";

grant update on table "public"."couple_matches" to "authenticated";

grant delete on table "public"."couple_matches" to "service_role";

grant insert on table "public"."couple_matches" to "service_role";

grant references on table "public"."couple_matches" to "service_role";

grant select on table "public"."couple_matches" to "service_role";

grant trigger on table "public"."couple_matches" to "service_role";

grant truncate on table "public"."couple_matches" to "service_role";

grant update on table "public"."couple_matches" to "service_role";

grant delete on table "public"."couple_messages" to "anon";

grant insert on table "public"."couple_messages" to "anon";

grant references on table "public"."couple_messages" to "anon";

grant select on table "public"."couple_messages" to "anon";

grant trigger on table "public"."couple_messages" to "anon";

grant truncate on table "public"."couple_messages" to "anon";

grant update on table "public"."couple_messages" to "anon";

grant delete on table "public"."couple_messages" to "authenticated";

grant insert on table "public"."couple_messages" to "authenticated";

grant references on table "public"."couple_messages" to "authenticated";

grant select on table "public"."couple_messages" to "authenticated";

grant trigger on table "public"."couple_messages" to "authenticated";

grant truncate on table "public"."couple_messages" to "authenticated";

grant update on table "public"."couple_messages" to "authenticated";

grant delete on table "public"."couple_messages" to "service_role";

grant insert on table "public"."couple_messages" to "service_role";

grant references on table "public"."couple_messages" to "service_role";

grant select on table "public"."couple_messages" to "service_role";

grant trigger on table "public"."couple_messages" to "service_role";

grant truncate on table "public"."couple_messages" to "service_role";

grant update on table "public"."couple_messages" to "service_role";

grant delete on table "public"."couple_profile_matches" to "anon";

grant insert on table "public"."couple_profile_matches" to "anon";

grant references on table "public"."couple_profile_matches" to "anon";

grant select on table "public"."couple_profile_matches" to "anon";

grant trigger on table "public"."couple_profile_matches" to "anon";

grant truncate on table "public"."couple_profile_matches" to "anon";

grant update on table "public"."couple_profile_matches" to "anon";

grant delete on table "public"."couple_profile_matches" to "authenticated";

grant insert on table "public"."couple_profile_matches" to "authenticated";

grant references on table "public"."couple_profile_matches" to "authenticated";

grant select on table "public"."couple_profile_matches" to "authenticated";

grant trigger on table "public"."couple_profile_matches" to "authenticated";

grant truncate on table "public"."couple_profile_matches" to "authenticated";

grant update on table "public"."couple_profile_matches" to "authenticated";

grant delete on table "public"."couple_profile_matches" to "service_role";

grant insert on table "public"."couple_profile_matches" to "service_role";

grant references on table "public"."couple_profile_matches" to "service_role";

grant select on table "public"."couple_profile_matches" to "service_role";

grant trigger on table "public"."couple_profile_matches" to "service_role";

grant truncate on table "public"."couple_profile_matches" to "service_role";

grant update on table "public"."couple_profile_matches" to "service_role";

grant delete on table "public"."couple_profile_reports" to "anon";

grant insert on table "public"."couple_profile_reports" to "anon";

grant references on table "public"."couple_profile_reports" to "anon";

grant select on table "public"."couple_profile_reports" to "anon";

grant trigger on table "public"."couple_profile_reports" to "anon";

grant truncate on table "public"."couple_profile_reports" to "anon";

grant update on table "public"."couple_profile_reports" to "anon";

grant delete on table "public"."couple_profile_reports" to "authenticated";

grant insert on table "public"."couple_profile_reports" to "authenticated";

grant references on table "public"."couple_profile_reports" to "authenticated";

grant select on table "public"."couple_profile_reports" to "authenticated";

grant trigger on table "public"."couple_profile_reports" to "authenticated";

grant truncate on table "public"."couple_profile_reports" to "authenticated";

grant update on table "public"."couple_profile_reports" to "authenticated";

grant delete on table "public"."couple_profile_reports" to "service_role";

grant insert on table "public"."couple_profile_reports" to "service_role";

grant references on table "public"."couple_profile_reports" to "service_role";

grant select on table "public"."couple_profile_reports" to "service_role";

grant trigger on table "public"."couple_profile_reports" to "service_role";

grant truncate on table "public"."couple_profile_reports" to "service_role";

grant update on table "public"."couple_profile_reports" to "service_role";

grant delete on table "public"."couple_profile_views" to "anon";

grant insert on table "public"."couple_profile_views" to "anon";

grant references on table "public"."couple_profile_views" to "anon";

grant select on table "public"."couple_profile_views" to "anon";

grant trigger on table "public"."couple_profile_views" to "anon";

grant truncate on table "public"."couple_profile_views" to "anon";

grant update on table "public"."couple_profile_views" to "anon";

grant delete on table "public"."couple_profile_views" to "authenticated";

grant insert on table "public"."couple_profile_views" to "authenticated";

grant references on table "public"."couple_profile_views" to "authenticated";

grant select on table "public"."couple_profile_views" to "authenticated";

grant trigger on table "public"."couple_profile_views" to "authenticated";

grant truncate on table "public"."couple_profile_views" to "authenticated";

grant update on table "public"."couple_profile_views" to "authenticated";

grant delete on table "public"."couple_profile_views" to "service_role";

grant insert on table "public"."couple_profile_views" to "service_role";

grant references on table "public"."couple_profile_views" to "service_role";

grant select on table "public"."couple_profile_views" to "service_role";

grant trigger on table "public"."couple_profile_views" to "service_role";

grant truncate on table "public"."couple_profile_views" to "service_role";

grant update on table "public"."couple_profile_views" to "service_role";

grant delete on table "public"."couple_reports" to "anon";

grant insert on table "public"."couple_reports" to "anon";

grant references on table "public"."couple_reports" to "anon";

grant select on table "public"."couple_reports" to "anon";

grant trigger on table "public"."couple_reports" to "anon";

grant truncate on table "public"."couple_reports" to "anon";

grant update on table "public"."couple_reports" to "anon";

grant delete on table "public"."couple_reports" to "authenticated";

grant insert on table "public"."couple_reports" to "authenticated";

grant references on table "public"."couple_reports" to "authenticated";

grant select on table "public"."couple_reports" to "authenticated";

grant trigger on table "public"."couple_reports" to "authenticated";

grant truncate on table "public"."couple_reports" to "authenticated";

grant update on table "public"."couple_reports" to "authenticated";

grant delete on table "public"."couple_reports" to "service_role";

grant insert on table "public"."couple_reports" to "service_role";

grant references on table "public"."couple_reports" to "service_role";

grant select on table "public"."couple_reports" to "service_role";

grant trigger on table "public"."couple_reports" to "service_role";

grant truncate on table "public"."couple_reports" to "service_role";

grant update on table "public"."couple_reports" to "service_role";

grant delete on table "public"."couple_statistics" to "anon";

grant insert on table "public"."couple_statistics" to "anon";

grant references on table "public"."couple_statistics" to "anon";

grant select on table "public"."couple_statistics" to "anon";

grant trigger on table "public"."couple_statistics" to "anon";

grant truncate on table "public"."couple_statistics" to "anon";

grant update on table "public"."couple_statistics" to "anon";

grant delete on table "public"."couple_statistics" to "authenticated";

grant insert on table "public"."couple_statistics" to "authenticated";

grant references on table "public"."couple_statistics" to "authenticated";

grant select on table "public"."couple_statistics" to "authenticated";

grant trigger on table "public"."couple_statistics" to "authenticated";

grant truncate on table "public"."couple_statistics" to "authenticated";

grant update on table "public"."couple_statistics" to "authenticated";

grant delete on table "public"."couple_statistics" to "service_role";

grant insert on table "public"."couple_statistics" to "service_role";

grant references on table "public"."couple_statistics" to "service_role";

grant select on table "public"."couple_statistics" to "service_role";

grant trigger on table "public"."couple_statistics" to "service_role";

grant truncate on table "public"."couple_statistics" to "service_role";

grant update on table "public"."couple_statistics" to "service_role";

grant delete on table "public"."couple_verifications" to "anon";

grant insert on table "public"."couple_verifications" to "anon";

grant references on table "public"."couple_verifications" to "anon";

grant select on table "public"."couple_verifications" to "anon";

grant trigger on table "public"."couple_verifications" to "anon";

grant truncate on table "public"."couple_verifications" to "anon";

grant update on table "public"."couple_verifications" to "anon";

grant delete on table "public"."couple_verifications" to "authenticated";

grant insert on table "public"."couple_verifications" to "authenticated";

grant references on table "public"."couple_verifications" to "authenticated";

grant select on table "public"."couple_verifications" to "authenticated";

grant trigger on table "public"."couple_verifications" to "authenticated";

grant truncate on table "public"."couple_verifications" to "authenticated";

grant update on table "public"."couple_verifications" to "authenticated";

grant delete on table "public"."couple_verifications" to "service_role";

grant insert on table "public"."couple_verifications" to "service_role";

grant references on table "public"."couple_verifications" to "service_role";

grant select on table "public"."couple_verifications" to "service_role";

grant trigger on table "public"."couple_verifications" to "service_role";

grant truncate on table "public"."couple_verifications" to "service_role";

grant update on table "public"."couple_verifications" to "service_role";

grant delete on table "public"."explicit_preferences" to "anon";

grant insert on table "public"."explicit_preferences" to "anon";

grant references on table "public"."explicit_preferences" to "anon";

grant select on table "public"."explicit_preferences" to "anon";

grant trigger on table "public"."explicit_preferences" to "anon";

grant truncate on table "public"."explicit_preferences" to "anon";

grant update on table "public"."explicit_preferences" to "anon";

grant delete on table "public"."explicit_preferences" to "authenticated";

grant insert on table "public"."explicit_preferences" to "authenticated";

grant references on table "public"."explicit_preferences" to "authenticated";

grant select on table "public"."explicit_preferences" to "authenticated";

grant trigger on table "public"."explicit_preferences" to "authenticated";

grant truncate on table "public"."explicit_preferences" to "authenticated";

grant update on table "public"."explicit_preferences" to "authenticated";

grant delete on table "public"."explicit_preferences" to "service_role";

grant insert on table "public"."explicit_preferences" to "service_role";

grant references on table "public"."explicit_preferences" to "service_role";

grant select on table "public"."explicit_preferences" to "service_role";

grant trigger on table "public"."explicit_preferences" to "service_role";

grant truncate on table "public"."explicit_preferences" to "service_role";

grant update on table "public"."explicit_preferences" to "service_role";

grant delete on table "public"."faq_items" to "anon";

grant insert on table "public"."faq_items" to "anon";

grant references on table "public"."faq_items" to "anon";

grant select on table "public"."faq_items" to "anon";

grant trigger on table "public"."faq_items" to "anon";

grant truncate on table "public"."faq_items" to "anon";

grant update on table "public"."faq_items" to "anon";

grant delete on table "public"."faq_items" to "authenticated";

grant insert on table "public"."faq_items" to "authenticated";

grant references on table "public"."faq_items" to "authenticated";

grant select on table "public"."faq_items" to "authenticated";

grant trigger on table "public"."faq_items" to "authenticated";

grant truncate on table "public"."faq_items" to "authenticated";

grant update on table "public"."faq_items" to "authenticated";

grant delete on table "public"."faq_items" to "service_role";

grant insert on table "public"."faq_items" to "service_role";

grant references on table "public"."faq_items" to "service_role";

grant select on table "public"."faq_items" to "service_role";

grant trigger on table "public"."faq_items" to "service_role";

grant truncate on table "public"."faq_items" to "service_role";

grant update on table "public"."faq_items" to "service_role";

grant delete on table "public"."favorites" to "anon";

grant insert on table "public"."favorites" to "anon";

grant references on table "public"."favorites" to "anon";

grant select on table "public"."favorites" to "anon";

grant trigger on table "public"."favorites" to "anon";

grant truncate on table "public"."favorites" to "anon";

grant update on table "public"."favorites" to "anon";

grant delete on table "public"."favorites" to "authenticated";

grant insert on table "public"."favorites" to "authenticated";

grant references on table "public"."favorites" to "authenticated";

grant select on table "public"."favorites" to "authenticated";

grant trigger on table "public"."favorites" to "authenticated";

grant truncate on table "public"."favorites" to "authenticated";

grant update on table "public"."favorites" to "authenticated";

grant delete on table "public"."favorites" to "service_role";

grant insert on table "public"."favorites" to "service_role";

grant references on table "public"."favorites" to "service_role";

grant select on table "public"."favorites" to "service_role";

grant trigger on table "public"."favorites" to "service_role";

grant truncate on table "public"."favorites" to "service_role";

grant update on table "public"."favorites" to "service_role";

grant delete on table "public"."follows" to "anon";

grant insert on table "public"."follows" to "anon";

grant references on table "public"."follows" to "anon";

grant select on table "public"."follows" to "anon";

grant trigger on table "public"."follows" to "anon";

grant truncate on table "public"."follows" to "anon";

grant update on table "public"."follows" to "anon";

grant delete on table "public"."follows" to "authenticated";

grant insert on table "public"."follows" to "authenticated";

grant references on table "public"."follows" to "authenticated";

grant select on table "public"."follows" to "authenticated";

grant trigger on table "public"."follows" to "authenticated";

grant truncate on table "public"."follows" to "authenticated";

grant update on table "public"."follows" to "authenticated";

grant delete on table "public"."follows" to "service_role";

grant insert on table "public"."follows" to "service_role";

grant references on table "public"."follows" to "service_role";

grant select on table "public"."follows" to "service_role";

grant trigger on table "public"."follows" to "service_role";

grant truncate on table "public"."follows" to "service_role";

grant update on table "public"."follows" to "service_role";

grant delete on table "public"."fraud_analysis" to "anon";

grant insert on table "public"."fraud_analysis" to "anon";

grant references on table "public"."fraud_analysis" to "anon";

grant select on table "public"."fraud_analysis" to "anon";

grant trigger on table "public"."fraud_analysis" to "anon";

grant truncate on table "public"."fraud_analysis" to "anon";

grant update on table "public"."fraud_analysis" to "anon";

grant delete on table "public"."fraud_analysis" to "authenticated";

grant insert on table "public"."fraud_analysis" to "authenticated";

grant references on table "public"."fraud_analysis" to "authenticated";

grant select on table "public"."fraud_analysis" to "authenticated";

grant trigger on table "public"."fraud_analysis" to "authenticated";

grant truncate on table "public"."fraud_analysis" to "authenticated";

grant update on table "public"."fraud_analysis" to "authenticated";

grant delete on table "public"."fraud_analysis" to "service_role";

grant insert on table "public"."fraud_analysis" to "service_role";

grant references on table "public"."fraud_analysis" to "service_role";

grant select on table "public"."fraud_analysis" to "service_role";

grant trigger on table "public"."fraud_analysis" to "service_role";

grant truncate on table "public"."fraud_analysis" to "service_role";

grant update on table "public"."fraud_analysis" to "service_role";

grant delete on table "public"."gallery_access_requests" to "anon";

grant insert on table "public"."gallery_access_requests" to "anon";

grant references on table "public"."gallery_access_requests" to "anon";

grant select on table "public"."gallery_access_requests" to "anon";

grant trigger on table "public"."gallery_access_requests" to "anon";

grant truncate on table "public"."gallery_access_requests" to "anon";

grant update on table "public"."gallery_access_requests" to "anon";

grant delete on table "public"."gallery_access_requests" to "authenticated";

grant insert on table "public"."gallery_access_requests" to "authenticated";

grant references on table "public"."gallery_access_requests" to "authenticated";

grant select on table "public"."gallery_access_requests" to "authenticated";

grant trigger on table "public"."gallery_access_requests" to "authenticated";

grant truncate on table "public"."gallery_access_requests" to "authenticated";

grant update on table "public"."gallery_access_requests" to "authenticated";

grant delete on table "public"."gallery_access_requests" to "service_role";

grant insert on table "public"."gallery_access_requests" to "service_role";

grant references on table "public"."gallery_access_requests" to "service_role";

grant select on table "public"."gallery_access_requests" to "service_role";

grant trigger on table "public"."gallery_access_requests" to "service_role";

grant truncate on table "public"."gallery_access_requests" to "service_role";

grant update on table "public"."gallery_access_requests" to "service_role";

grant delete on table "public"."gallery_unlocks" to "anon";

grant insert on table "public"."gallery_unlocks" to "anon";

grant references on table "public"."gallery_unlocks" to "anon";

grant select on table "public"."gallery_unlocks" to "anon";

grant trigger on table "public"."gallery_unlocks" to "anon";

grant truncate on table "public"."gallery_unlocks" to "anon";

grant update on table "public"."gallery_unlocks" to "anon";

grant delete on table "public"."gallery_unlocks" to "authenticated";

grant insert on table "public"."gallery_unlocks" to "authenticated";

grant references on table "public"."gallery_unlocks" to "authenticated";

grant select on table "public"."gallery_unlocks" to "authenticated";

grant trigger on table "public"."gallery_unlocks" to "authenticated";

grant truncate on table "public"."gallery_unlocks" to "authenticated";

grant update on table "public"."gallery_unlocks" to "authenticated";

grant delete on table "public"."gallery_unlocks" to "service_role";

grant insert on table "public"."gallery_unlocks" to "service_role";

grant references on table "public"."gallery_unlocks" to "service_role";

grant select on table "public"."gallery_unlocks" to "service_role";

grant trigger on table "public"."gallery_unlocks" to "service_role";

grant truncate on table "public"."gallery_unlocks" to "service_role";

grant update on table "public"."gallery_unlocks" to "service_role";

grant delete on table "public"."image_metadata" to "anon";

grant insert on table "public"."image_metadata" to "anon";

grant references on table "public"."image_metadata" to "anon";

grant select on table "public"."image_metadata" to "anon";

grant trigger on table "public"."image_metadata" to "anon";

grant truncate on table "public"."image_metadata" to "anon";

grant update on table "public"."image_metadata" to "anon";

grant delete on table "public"."image_metadata" to "authenticated";

grant insert on table "public"."image_metadata" to "authenticated";

grant references on table "public"."image_metadata" to "authenticated";

grant select on table "public"."image_metadata" to "authenticated";

grant trigger on table "public"."image_metadata" to "authenticated";

grant truncate on table "public"."image_metadata" to "authenticated";

grant update on table "public"."image_metadata" to "authenticated";

grant delete on table "public"."image_metadata" to "service_role";

grant insert on table "public"."image_metadata" to "service_role";

grant references on table "public"."image_metadata" to "service_role";

grant select on table "public"."image_metadata" to "service_role";

grant trigger on table "public"."image_metadata" to "service_role";

grant truncate on table "public"."image_metadata" to "service_role";

grant update on table "public"."image_metadata" to "service_role";

grant delete on table "public"."image_permissions" to "anon";

grant insert on table "public"."image_permissions" to "anon";

grant references on table "public"."image_permissions" to "anon";

grant select on table "public"."image_permissions" to "anon";

grant trigger on table "public"."image_permissions" to "anon";

grant truncate on table "public"."image_permissions" to "anon";

grant update on table "public"."image_permissions" to "anon";

grant delete on table "public"."image_permissions" to "authenticated";

grant insert on table "public"."image_permissions" to "authenticated";

grant references on table "public"."image_permissions" to "authenticated";

grant select on table "public"."image_permissions" to "authenticated";

grant trigger on table "public"."image_permissions" to "authenticated";

grant truncate on table "public"."image_permissions" to "authenticated";

grant update on table "public"."image_permissions" to "authenticated";

grant delete on table "public"."image_permissions" to "service_role";

grant insert on table "public"."image_permissions" to "service_role";

grant references on table "public"."image_permissions" to "service_role";

grant select on table "public"."image_permissions" to "service_role";

grant trigger on table "public"."image_permissions" to "service_role";

grant truncate on table "public"."image_permissions" to "service_role";

grant update on table "public"."image_permissions" to "service_role";

grant delete on table "public"."investment_returns" to "anon";

grant insert on table "public"."investment_returns" to "anon";

grant references on table "public"."investment_returns" to "anon";

grant select on table "public"."investment_returns" to "anon";

grant trigger on table "public"."investment_returns" to "anon";

grant truncate on table "public"."investment_returns" to "anon";

grant update on table "public"."investment_returns" to "anon";

grant delete on table "public"."investment_returns" to "authenticated";

grant insert on table "public"."investment_returns" to "authenticated";

grant references on table "public"."investment_returns" to "authenticated";

grant select on table "public"."investment_returns" to "authenticated";

grant trigger on table "public"."investment_returns" to "authenticated";

grant truncate on table "public"."investment_returns" to "authenticated";

grant update on table "public"."investment_returns" to "authenticated";

grant delete on table "public"."investment_returns" to "service_role";

grant insert on table "public"."investment_returns" to "service_role";

grant references on table "public"."investment_returns" to "service_role";

grant select on table "public"."investment_returns" to "service_role";

grant trigger on table "public"."investment_returns" to "service_role";

grant truncate on table "public"."investment_returns" to "service_role";

grant update on table "public"."investment_returns" to "service_role";

grant delete on table "public"."invitation_analytics" to "anon";

grant insert on table "public"."invitation_analytics" to "anon";

grant references on table "public"."invitation_analytics" to "anon";

grant select on table "public"."invitation_analytics" to "anon";

grant trigger on table "public"."invitation_analytics" to "anon";

grant truncate on table "public"."invitation_analytics" to "anon";

grant update on table "public"."invitation_analytics" to "anon";

grant delete on table "public"."invitation_analytics" to "authenticated";

grant insert on table "public"."invitation_analytics" to "authenticated";

grant references on table "public"."invitation_analytics" to "authenticated";

grant select on table "public"."invitation_analytics" to "authenticated";

grant trigger on table "public"."invitation_analytics" to "authenticated";

grant truncate on table "public"."invitation_analytics" to "authenticated";

grant update on table "public"."invitation_analytics" to "authenticated";

grant delete on table "public"."invitation_analytics" to "service_role";

grant insert on table "public"."invitation_analytics" to "service_role";

grant references on table "public"."invitation_analytics" to "service_role";

grant select on table "public"."invitation_analytics" to "service_role";

grant trigger on table "public"."invitation_analytics" to "service_role";

grant truncate on table "public"."invitation_analytics" to "service_role";

grant update on table "public"."invitation_analytics" to "service_role";

grant delete on table "public"."invitation_responses" to "anon";

grant insert on table "public"."invitation_responses" to "anon";

grant references on table "public"."invitation_responses" to "anon";

grant select on table "public"."invitation_responses" to "anon";

grant trigger on table "public"."invitation_responses" to "anon";

grant truncate on table "public"."invitation_responses" to "anon";

grant update on table "public"."invitation_responses" to "anon";

grant delete on table "public"."invitation_responses" to "authenticated";

grant insert on table "public"."invitation_responses" to "authenticated";

grant references on table "public"."invitation_responses" to "authenticated";

grant select on table "public"."invitation_responses" to "authenticated";

grant trigger on table "public"."invitation_responses" to "authenticated";

grant truncate on table "public"."invitation_responses" to "authenticated";

grant update on table "public"."invitation_responses" to "authenticated";

grant delete on table "public"."invitation_responses" to "service_role";

grant insert on table "public"."invitation_responses" to "service_role";

grant references on table "public"."invitation_responses" to "service_role";

grant select on table "public"."invitation_responses" to "service_role";

grant trigger on table "public"."invitation_responses" to "service_role";

grant truncate on table "public"."invitation_responses" to "service_role";

grant update on table "public"."invitation_responses" to "service_role";

grant delete on table "public"."likes" to "anon";

grant insert on table "public"."likes" to "anon";

grant references on table "public"."likes" to "anon";

grant select on table "public"."likes" to "anon";

grant trigger on table "public"."likes" to "anon";

grant truncate on table "public"."likes" to "anon";

grant update on table "public"."likes" to "anon";

grant delete on table "public"."likes" to "authenticated";

grant insert on table "public"."likes" to "authenticated";

grant references on table "public"."likes" to "authenticated";

grant select on table "public"."likes" to "authenticated";

grant trigger on table "public"."likes" to "authenticated";

grant truncate on table "public"."likes" to "authenticated";

grant update on table "public"."likes" to "authenticated";

grant delete on table "public"."likes" to "service_role";

grant insert on table "public"."likes" to "service_role";

grant references on table "public"."likes" to "service_role";

grant select on table "public"."likes" to "service_role";

grant trigger on table "public"."likes" to "service_role";

grant truncate on table "public"."likes" to "service_role";

grant update on table "public"."likes" to "service_role";

grant delete on table "public"."match_interactions" to "anon";

grant insert on table "public"."match_interactions" to "anon";

grant references on table "public"."match_interactions" to "anon";

grant select on table "public"."match_interactions" to "anon";

grant trigger on table "public"."match_interactions" to "anon";

grant truncate on table "public"."match_interactions" to "anon";

grant update on table "public"."match_interactions" to "anon";

grant delete on table "public"."match_interactions" to "authenticated";

grant insert on table "public"."match_interactions" to "authenticated";

grant references on table "public"."match_interactions" to "authenticated";

grant select on table "public"."match_interactions" to "authenticated";

grant trigger on table "public"."match_interactions" to "authenticated";

grant truncate on table "public"."match_interactions" to "authenticated";

grant update on table "public"."match_interactions" to "authenticated";

grant delete on table "public"."match_interactions" to "service_role";

grant insert on table "public"."match_interactions" to "service_role";

grant references on table "public"."match_interactions" to "service_role";

grant select on table "public"."match_interactions" to "service_role";

grant trigger on table "public"."match_interactions" to "service_role";

grant truncate on table "public"."match_interactions" to "service_role";

grant update on table "public"."match_interactions" to "service_role";

grant delete on table "public"."media" to "anon";

grant insert on table "public"."media" to "anon";

grant references on table "public"."media" to "anon";

grant select on table "public"."media" to "anon";

grant trigger on table "public"."media" to "anon";

grant truncate on table "public"."media" to "anon";

grant update on table "public"."media" to "anon";

grant delete on table "public"."media" to "authenticated";

grant insert on table "public"."media" to "authenticated";

grant references on table "public"."media" to "authenticated";

grant select on table "public"."media" to "authenticated";

grant trigger on table "public"."media" to "authenticated";

grant truncate on table "public"."media" to "authenticated";

grant update on table "public"."media" to "authenticated";

grant delete on table "public"."media" to "service_role";

grant insert on table "public"."media" to "service_role";

grant references on table "public"."media" to "service_role";

grant select on table "public"."media" to "service_role";

grant trigger on table "public"."media" to "service_role";

grant truncate on table "public"."media" to "service_role";

grant update on table "public"."media" to "service_role";

grant delete on table "public"."media_access_logs" to "anon";

grant insert on table "public"."media_access_logs" to "anon";

grant references on table "public"."media_access_logs" to "anon";

grant select on table "public"."media_access_logs" to "anon";

grant trigger on table "public"."media_access_logs" to "anon";

grant truncate on table "public"."media_access_logs" to "anon";

grant update on table "public"."media_access_logs" to "anon";

grant delete on table "public"."media_access_logs" to "authenticated";

grant insert on table "public"."media_access_logs" to "authenticated";

grant references on table "public"."media_access_logs" to "authenticated";

grant select on table "public"."media_access_logs" to "authenticated";

grant trigger on table "public"."media_access_logs" to "authenticated";

grant truncate on table "public"."media_access_logs" to "authenticated";

grant update on table "public"."media_access_logs" to "authenticated";

grant delete on table "public"."media_access_logs" to "service_role";

grant insert on table "public"."media_access_logs" to "service_role";

grant references on table "public"."media_access_logs" to "service_role";

grant select on table "public"."media_access_logs" to "service_role";

grant trigger on table "public"."media_access_logs" to "service_role";

grant truncate on table "public"."media_access_logs" to "service_role";

grant update on table "public"."media_access_logs" to "service_role";

grant delete on table "public"."mfa_settings" to "anon";

grant insert on table "public"."mfa_settings" to "anon";

grant references on table "public"."mfa_settings" to "anon";

grant select on table "public"."mfa_settings" to "anon";

grant trigger on table "public"."mfa_settings" to "anon";

grant truncate on table "public"."mfa_settings" to "anon";

grant update on table "public"."mfa_settings" to "anon";

grant delete on table "public"."mfa_settings" to "authenticated";

grant insert on table "public"."mfa_settings" to "authenticated";

grant references on table "public"."mfa_settings" to "authenticated";

grant select on table "public"."mfa_settings" to "authenticated";

grant trigger on table "public"."mfa_settings" to "authenticated";

grant truncate on table "public"."mfa_settings" to "authenticated";

grant update on table "public"."mfa_settings" to "authenticated";

grant delete on table "public"."mfa_settings" to "service_role";

grant insert on table "public"."mfa_settings" to "service_role";

grant references on table "public"."mfa_settings" to "service_role";

grant select on table "public"."mfa_settings" to "service_role";

grant trigger on table "public"."mfa_settings" to "service_role";

grant truncate on table "public"."mfa_settings" to "service_role";

grant update on table "public"."mfa_settings" to "service_role";

grant delete on table "public"."notification_history" to "anon";

grant insert on table "public"."notification_history" to "anon";

grant references on table "public"."notification_history" to "anon";

grant select on table "public"."notification_history" to "anon";

grant trigger on table "public"."notification_history" to "anon";

grant truncate on table "public"."notification_history" to "anon";

grant update on table "public"."notification_history" to "anon";

grant delete on table "public"."notification_history" to "authenticated";

grant insert on table "public"."notification_history" to "authenticated";

grant references on table "public"."notification_history" to "authenticated";

grant select on table "public"."notification_history" to "authenticated";

grant trigger on table "public"."notification_history" to "authenticated";

grant truncate on table "public"."notification_history" to "authenticated";

grant update on table "public"."notification_history" to "authenticated";

grant delete on table "public"."notification_history" to "service_role";

grant insert on table "public"."notification_history" to "service_role";

grant references on table "public"."notification_history" to "service_role";

grant select on table "public"."notification_history" to "service_role";

grant trigger on table "public"."notification_history" to "service_role";

grant truncate on table "public"."notification_history" to "service_role";

grant update on table "public"."notification_history" to "service_role";

grant delete on table "public"."notification_preferences" to "anon";

grant insert on table "public"."notification_preferences" to "anon";

grant references on table "public"."notification_preferences" to "anon";

grant select on table "public"."notification_preferences" to "anon";

grant trigger on table "public"."notification_preferences" to "anon";

grant truncate on table "public"."notification_preferences" to "anon";

grant update on table "public"."notification_preferences" to "anon";

grant delete on table "public"."notification_preferences" to "authenticated";

grant insert on table "public"."notification_preferences" to "authenticated";

grant references on table "public"."notification_preferences" to "authenticated";

grant select on table "public"."notification_preferences" to "authenticated";

grant trigger on table "public"."notification_preferences" to "authenticated";

grant truncate on table "public"."notification_preferences" to "authenticated";

grant update on table "public"."notification_preferences" to "authenticated";

grant delete on table "public"."notification_preferences" to "service_role";

grant insert on table "public"."notification_preferences" to "service_role";

grant references on table "public"."notification_preferences" to "service_role";

grant select on table "public"."notification_preferences" to "service_role";

grant trigger on table "public"."notification_preferences" to "service_role";

grant truncate on table "public"."notification_preferences" to "service_role";

grant update on table "public"."notification_preferences" to "service_role";

grant delete on table "public"."pending_rewards" to "anon";

grant insert on table "public"."pending_rewards" to "anon";

grant references on table "public"."pending_rewards" to "anon";

grant select on table "public"."pending_rewards" to "anon";

grant trigger on table "public"."pending_rewards" to "anon";

grant truncate on table "public"."pending_rewards" to "anon";

grant update on table "public"."pending_rewards" to "anon";

grant delete on table "public"."pending_rewards" to "authenticated";

grant insert on table "public"."pending_rewards" to "authenticated";

grant references on table "public"."pending_rewards" to "authenticated";

grant select on table "public"."pending_rewards" to "authenticated";

grant trigger on table "public"."pending_rewards" to "authenticated";

grant truncate on table "public"."pending_rewards" to "authenticated";

grant update on table "public"."pending_rewards" to "authenticated";

grant delete on table "public"."pending_rewards" to "service_role";

grant insert on table "public"."pending_rewards" to "service_role";

grant references on table "public"."pending_rewards" to "service_role";

grant select on table "public"."pending_rewards" to "service_role";

grant trigger on table "public"."pending_rewards" to "service_role";

grant truncate on table "public"."pending_rewards" to "service_role";

grant update on table "public"."pending_rewards" to "service_role";

grant delete on table "public"."performance_logs" to "anon";

grant insert on table "public"."performance_logs" to "anon";

grant references on table "public"."performance_logs" to "anon";

grant select on table "public"."performance_logs" to "anon";

grant trigger on table "public"."performance_logs" to "anon";

grant truncate on table "public"."performance_logs" to "anon";

grant update on table "public"."performance_logs" to "anon";

grant delete on table "public"."performance_logs" to "authenticated";

grant insert on table "public"."performance_logs" to "authenticated";

grant references on table "public"."performance_logs" to "authenticated";

grant select on table "public"."performance_logs" to "authenticated";

grant trigger on table "public"."performance_logs" to "authenticated";

grant truncate on table "public"."performance_logs" to "authenticated";

grant update on table "public"."performance_logs" to "authenticated";

grant delete on table "public"."performance_logs" to "service_role";

grant insert on table "public"."performance_logs" to "service_role";

grant references on table "public"."performance_logs" to "service_role";

grant select on table "public"."performance_logs" to "service_role";

grant trigger on table "public"."performance_logs" to "service_role";

grant truncate on table "public"."performance_logs" to "service_role";

grant update on table "public"."performance_logs" to "service_role";

grant delete on table "public"."post_comments" to "anon";

grant insert on table "public"."post_comments" to "anon";

grant references on table "public"."post_comments" to "anon";

grant select on table "public"."post_comments" to "anon";

grant trigger on table "public"."post_comments" to "anon";

grant truncate on table "public"."post_comments" to "anon";

grant update on table "public"."post_comments" to "anon";

grant delete on table "public"."post_comments" to "authenticated";

grant insert on table "public"."post_comments" to "authenticated";

grant references on table "public"."post_comments" to "authenticated";

grant select on table "public"."post_comments" to "authenticated";

grant trigger on table "public"."post_comments" to "authenticated";

grant truncate on table "public"."post_comments" to "authenticated";

grant update on table "public"."post_comments" to "authenticated";

grant delete on table "public"."post_comments" to "service_role";

grant insert on table "public"."post_comments" to "service_role";

grant references on table "public"."post_comments" to "service_role";

grant select on table "public"."post_comments" to "service_role";

grant trigger on table "public"."post_comments" to "service_role";

grant truncate on table "public"."post_comments" to "service_role";

grant update on table "public"."post_comments" to "service_role";

grant delete on table "public"."post_likes" to "anon";

grant insert on table "public"."post_likes" to "anon";

grant references on table "public"."post_likes" to "anon";

grant select on table "public"."post_likes" to "anon";

grant trigger on table "public"."post_likes" to "anon";

grant truncate on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "anon";

grant delete on table "public"."post_likes" to "authenticated";

grant insert on table "public"."post_likes" to "authenticated";

grant references on table "public"."post_likes" to "authenticated";

grant select on table "public"."post_likes" to "authenticated";

grant trigger on table "public"."post_likes" to "authenticated";

grant truncate on table "public"."post_likes" to "authenticated";

grant update on table "public"."post_likes" to "authenticated";

grant delete on table "public"."post_likes" to "service_role";

grant insert on table "public"."post_likes" to "service_role";

grant references on table "public"."post_likes" to "service_role";

grant select on table "public"."post_likes" to "service_role";

grant trigger on table "public"."post_likes" to "service_role";

grant truncate on table "public"."post_likes" to "service_role";

grant update on table "public"."post_likes" to "service_role";

grant delete on table "public"."post_shares" to "anon";

grant insert on table "public"."post_shares" to "anon";

grant references on table "public"."post_shares" to "anon";

grant select on table "public"."post_shares" to "anon";

grant trigger on table "public"."post_shares" to "anon";

grant truncate on table "public"."post_shares" to "anon";

grant update on table "public"."post_shares" to "anon";

grant delete on table "public"."post_shares" to "authenticated";

grant insert on table "public"."post_shares" to "authenticated";

grant references on table "public"."post_shares" to "authenticated";

grant select on table "public"."post_shares" to "authenticated";

grant trigger on table "public"."post_shares" to "authenticated";

grant truncate on table "public"."post_shares" to "authenticated";

grant update on table "public"."post_shares" to "authenticated";

grant delete on table "public"."post_shares" to "service_role";

grant insert on table "public"."post_shares" to "service_role";

grant references on table "public"."post_shares" to "service_role";

grant select on table "public"."post_shares" to "service_role";

grant trigger on table "public"."post_shares" to "service_role";

grant truncate on table "public"."post_shares" to "service_role";

grant update on table "public"."post_shares" to "service_role";

grant delete on table "public"."premium_access" to "anon";

grant insert on table "public"."premium_access" to "anon";

grant references on table "public"."premium_access" to "anon";

grant select on table "public"."premium_access" to "anon";

grant trigger on table "public"."premium_access" to "anon";

grant truncate on table "public"."premium_access" to "anon";

grant update on table "public"."premium_access" to "anon";

grant delete on table "public"."premium_access" to "authenticated";

grant insert on table "public"."premium_access" to "authenticated";

grant references on table "public"."premium_access" to "authenticated";

grant select on table "public"."premium_access" to "authenticated";

grant trigger on table "public"."premium_access" to "authenticated";

grant truncate on table "public"."premium_access" to "authenticated";

grant update on table "public"."premium_access" to "authenticated";

grant delete on table "public"."premium_access" to "service_role";

grant insert on table "public"."premium_access" to "service_role";

grant references on table "public"."premium_access" to "service_role";

grant select on table "public"."premium_access" to "service_role";

grant trigger on table "public"."premium_access" to "service_role";

grant truncate on table "public"."premium_access" to "service_role";

grant update on table "public"."premium_access" to "service_role";

grant delete on table "public"."profile_cache" to "anon";

grant insert on table "public"."profile_cache" to "anon";

grant references on table "public"."profile_cache" to "anon";

grant select on table "public"."profile_cache" to "anon";

grant trigger on table "public"."profile_cache" to "anon";

grant truncate on table "public"."profile_cache" to "anon";

grant update on table "public"."profile_cache" to "anon";

grant delete on table "public"."profile_cache" to "authenticated";

grant insert on table "public"."profile_cache" to "authenticated";

grant references on table "public"."profile_cache" to "authenticated";

grant select on table "public"."profile_cache" to "authenticated";

grant trigger on table "public"."profile_cache" to "authenticated";

grant truncate on table "public"."profile_cache" to "authenticated";

grant update on table "public"."profile_cache" to "authenticated";

grant delete on table "public"."profile_cache" to "service_role";

grant insert on table "public"."profile_cache" to "service_role";

grant references on table "public"."profile_cache" to "service_role";

grant select on table "public"."profile_cache" to "service_role";

grant trigger on table "public"."profile_cache" to "service_role";

grant truncate on table "public"."profile_cache" to "service_role";

grant update on table "public"."profile_cache" to "service_role";

grant delete on table "public"."room_members" to "anon";

grant insert on table "public"."room_members" to "anon";

grant references on table "public"."room_members" to "anon";

grant select on table "public"."room_members" to "anon";

grant trigger on table "public"."room_members" to "anon";

grant truncate on table "public"."room_members" to "anon";

grant update on table "public"."room_members" to "anon";

grant delete on table "public"."room_members" to "authenticated";

grant insert on table "public"."room_members" to "authenticated";

grant references on table "public"."room_members" to "authenticated";

grant select on table "public"."room_members" to "authenticated";

grant trigger on table "public"."room_members" to "authenticated";

grant truncate on table "public"."room_members" to "authenticated";

grant update on table "public"."room_members" to "authenticated";

grant delete on table "public"."room_members" to "service_role";

grant insert on table "public"."room_members" to "service_role";

grant references on table "public"."room_members" to "service_role";

grant select on table "public"."room_members" to "service_role";

grant trigger on table "public"."room_members" to "service_role";

grant truncate on table "public"."room_members" to "service_role";

grant update on table "public"."room_members" to "service_role";

grant delete on table "public"."security_alerts" to "anon";

grant insert on table "public"."security_alerts" to "anon";

grant references on table "public"."security_alerts" to "anon";

grant select on table "public"."security_alerts" to "anon";

grant trigger on table "public"."security_alerts" to "anon";

grant truncate on table "public"."security_alerts" to "anon";

grant update on table "public"."security_alerts" to "anon";

grant delete on table "public"."security_alerts" to "authenticated";

grant insert on table "public"."security_alerts" to "authenticated";

grant references on table "public"."security_alerts" to "authenticated";

grant select on table "public"."security_alerts" to "authenticated";

grant trigger on table "public"."security_alerts" to "authenticated";

grant truncate on table "public"."security_alerts" to "authenticated";

grant update on table "public"."security_alerts" to "authenticated";

grant delete on table "public"."security_alerts" to "service_role";

grant insert on table "public"."security_alerts" to "service_role";

grant references on table "public"."security_alerts" to "service_role";

grant select on table "public"."security_alerts" to "service_role";

grant trigger on table "public"."security_alerts" to "service_role";

grant truncate on table "public"."security_alerts" to "service_role";

grant update on table "public"."security_alerts" to "service_role";

grant delete on table "public"."security_configurations" to "anon";

grant insert on table "public"."security_configurations" to "anon";

grant references on table "public"."security_configurations" to "anon";

grant select on table "public"."security_configurations" to "anon";

grant trigger on table "public"."security_configurations" to "anon";

grant truncate on table "public"."security_configurations" to "anon";

grant update on table "public"."security_configurations" to "anon";

grant delete on table "public"."security_configurations" to "authenticated";

grant insert on table "public"."security_configurations" to "authenticated";

grant references on table "public"."security_configurations" to "authenticated";

grant select on table "public"."security_configurations" to "authenticated";

grant trigger on table "public"."security_configurations" to "authenticated";

grant truncate on table "public"."security_configurations" to "authenticated";

grant update on table "public"."security_configurations" to "authenticated";

grant delete on table "public"."security_configurations" to "service_role";

grant insert on table "public"."security_configurations" to "service_role";

grant references on table "public"."security_configurations" to "service_role";

grant select on table "public"."security_configurations" to "service_role";

grant trigger on table "public"."security_configurations" to "service_role";

grant truncate on table "public"."security_configurations" to "service_role";

grant update on table "public"."security_configurations" to "service_role";

grant delete on table "public"."security_flags" to "anon";

grant insert on table "public"."security_flags" to "anon";

grant references on table "public"."security_flags" to "anon";

grant select on table "public"."security_flags" to "anon";

grant trigger on table "public"."security_flags" to "anon";

grant truncate on table "public"."security_flags" to "anon";

grant update on table "public"."security_flags" to "anon";

grant delete on table "public"."security_flags" to "authenticated";

grant insert on table "public"."security_flags" to "authenticated";

grant references on table "public"."security_flags" to "authenticated";

grant select on table "public"."security_flags" to "authenticated";

grant trigger on table "public"."security_flags" to "authenticated";

grant truncate on table "public"."security_flags" to "authenticated";

grant update on table "public"."security_flags" to "authenticated";

grant delete on table "public"."security_flags" to "service_role";

grant insert on table "public"."security_flags" to "service_role";

grant references on table "public"."security_flags" to "service_role";

grant select on table "public"."security_flags" to "service_role";

grant trigger on table "public"."security_flags" to "service_role";

grant truncate on table "public"."security_flags" to "service_role";

grant update on table "public"."security_flags" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";

grant delete on table "public"."story_reports" to "anon";

grant insert on table "public"."story_reports" to "anon";

grant references on table "public"."story_reports" to "anon";

grant select on table "public"."story_reports" to "anon";

grant trigger on table "public"."story_reports" to "anon";

grant truncate on table "public"."story_reports" to "anon";

grant update on table "public"."story_reports" to "anon";

grant delete on table "public"."story_reports" to "authenticated";

grant insert on table "public"."story_reports" to "authenticated";

grant references on table "public"."story_reports" to "authenticated";

grant select on table "public"."story_reports" to "authenticated";

grant trigger on table "public"."story_reports" to "authenticated";

grant truncate on table "public"."story_reports" to "authenticated";

grant update on table "public"."story_reports" to "authenticated";

grant delete on table "public"."story_reports" to "service_role";

grant insert on table "public"."story_reports" to "service_role";

grant references on table "public"."story_reports" to "service_role";

grant select on table "public"."story_reports" to "service_role";

grant trigger on table "public"."story_reports" to "service_role";

grant truncate on table "public"."story_reports" to "service_role";

grant update on table "public"."story_reports" to "service_role";

grant delete on table "public"."stripe_events" to "anon";

grant insert on table "public"."stripe_events" to "anon";

grant references on table "public"."stripe_events" to "anon";

grant select on table "public"."stripe_events" to "anon";

grant trigger on table "public"."stripe_events" to "anon";

grant truncate on table "public"."stripe_events" to "anon";

grant update on table "public"."stripe_events" to "anon";

grant delete on table "public"."stripe_events" to "authenticated";

grant insert on table "public"."stripe_events" to "authenticated";

grant references on table "public"."stripe_events" to "authenticated";

grant select on table "public"."stripe_events" to "authenticated";

grant trigger on table "public"."stripe_events" to "authenticated";

grant truncate on table "public"."stripe_events" to "authenticated";

grant update on table "public"."stripe_events" to "authenticated";

grant delete on table "public"."stripe_events" to "service_role";

grant insert on table "public"."stripe_events" to "service_role";

grant references on table "public"."stripe_events" to "service_role";

grant select on table "public"."stripe_events" to "service_role";

grant trigger on table "public"."stripe_events" to "service_role";

grant truncate on table "public"."stripe_events" to "service_role";

grant update on table "public"."stripe_events" to "service_role";

grant delete on table "public"."subscribers" to "anon";

grant insert on table "public"."subscribers" to "anon";

grant references on table "public"."subscribers" to "anon";

grant select on table "public"."subscribers" to "anon";

grant trigger on table "public"."subscribers" to "anon";

grant truncate on table "public"."subscribers" to "anon";

grant update on table "public"."subscribers" to "anon";

grant delete on table "public"."subscribers" to "authenticated";

grant insert on table "public"."subscribers" to "authenticated";

grant references on table "public"."subscribers" to "authenticated";

grant select on table "public"."subscribers" to "authenticated";

grant trigger on table "public"."subscribers" to "authenticated";

grant truncate on table "public"."subscribers" to "authenticated";

grant update on table "public"."subscribers" to "authenticated";

grant delete on table "public"."subscribers" to "service_role";

grant insert on table "public"."subscribers" to "service_role";

grant references on table "public"."subscribers" to "service_role";

grant select on table "public"."subscribers" to "service_role";

grant trigger on table "public"."subscribers" to "service_role";

grant truncate on table "public"."subscribers" to "service_role";

grant update on table "public"."subscribers" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."summary_feedback" to "anon";

grant insert on table "public"."summary_feedback" to "anon";

grant references on table "public"."summary_feedback" to "anon";

grant select on table "public"."summary_feedback" to "anon";

grant trigger on table "public"."summary_feedback" to "anon";

grant truncate on table "public"."summary_feedback" to "anon";

grant update on table "public"."summary_feedback" to "anon";

grant delete on table "public"."summary_feedback" to "authenticated";

grant insert on table "public"."summary_feedback" to "authenticated";

grant references on table "public"."summary_feedback" to "authenticated";

grant select on table "public"."summary_feedback" to "authenticated";

grant trigger on table "public"."summary_feedback" to "authenticated";

grant truncate on table "public"."summary_feedback" to "authenticated";

grant update on table "public"."summary_feedback" to "authenticated";

grant delete on table "public"."summary_feedback" to "service_role";

grant insert on table "public"."summary_feedback" to "service_role";

grant references on table "public"."summary_feedback" to "service_role";

grant select on table "public"."summary_feedback" to "service_role";

grant trigger on table "public"."summary_feedback" to "service_role";

grant truncate on table "public"."summary_feedback" to "service_role";

grant update on table "public"."summary_feedback" to "service_role";

grant delete on table "public"."system_metrics" to "anon";

grant insert on table "public"."system_metrics" to "anon";

grant references on table "public"."system_metrics" to "anon";

grant select on table "public"."system_metrics" to "anon";

grant trigger on table "public"."system_metrics" to "anon";

grant truncate on table "public"."system_metrics" to "anon";

grant update on table "public"."system_metrics" to "anon";

grant delete on table "public"."system_metrics" to "authenticated";

grant insert on table "public"."system_metrics" to "authenticated";

grant references on table "public"."system_metrics" to "authenticated";

grant select on table "public"."system_metrics" to "authenticated";

grant trigger on table "public"."system_metrics" to "authenticated";

grant truncate on table "public"."system_metrics" to "authenticated";

grant update on table "public"."system_metrics" to "authenticated";

grant delete on table "public"."system_metrics" to "service_role";

grant insert on table "public"."system_metrics" to "service_role";

grant references on table "public"."system_metrics" to "service_role";

grant select on table "public"."system_metrics" to "service_role";

grant trigger on table "public"."system_metrics" to "service_role";

grant truncate on table "public"."system_metrics" to "service_role";

grant update on table "public"."system_metrics" to "service_role";

grant delete on table "public"."threat_detections" to "anon";

grant insert on table "public"."threat_detections" to "anon";

grant references on table "public"."threat_detections" to "anon";

grant select on table "public"."threat_detections" to "anon";

grant trigger on table "public"."threat_detections" to "anon";

grant truncate on table "public"."threat_detections" to "anon";

grant update on table "public"."threat_detections" to "anon";

grant delete on table "public"."threat_detections" to "authenticated";

grant insert on table "public"."threat_detections" to "authenticated";

grant references on table "public"."threat_detections" to "authenticated";

grant select on table "public"."threat_detections" to "authenticated";

grant trigger on table "public"."threat_detections" to "authenticated";

grant truncate on table "public"."threat_detections" to "authenticated";

grant update on table "public"."threat_detections" to "authenticated";

grant delete on table "public"."threat_detections" to "service_role";

grant insert on table "public"."threat_detections" to "service_role";

grant references on table "public"."threat_detections" to "service_role";

grant select on table "public"."threat_detections" to "service_role";

grant trigger on table "public"."threat_detections" to "service_role";

grant truncate on table "public"."threat_detections" to "service_role";

grant update on table "public"."threat_detections" to "service_role";

grant delete on table "public"."tokens" to "anon";

grant insert on table "public"."tokens" to "anon";

grant references on table "public"."tokens" to "anon";

grant select on table "public"."tokens" to "anon";

grant trigger on table "public"."tokens" to "anon";

grant truncate on table "public"."tokens" to "anon";

grant update on table "public"."tokens" to "anon";

grant delete on table "public"."tokens" to "authenticated";

grant insert on table "public"."tokens" to "authenticated";

grant references on table "public"."tokens" to "authenticated";

grant select on table "public"."tokens" to "authenticated";

grant trigger on table "public"."tokens" to "authenticated";

grant truncate on table "public"."tokens" to "authenticated";

grant update on table "public"."tokens" to "authenticated";

grant delete on table "public"."tokens" to "service_role";

grant insert on table "public"."tokens" to "service_role";

grant references on table "public"."tokens" to "service_role";

grant select on table "public"."tokens" to "service_role";

grant trigger on table "public"."tokens" to "service_role";

grant truncate on table "public"."tokens" to "service_role";

grant update on table "public"."tokens" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."user_2fa_settings" to "anon";

grant insert on table "public"."user_2fa_settings" to "anon";

grant references on table "public"."user_2fa_settings" to "anon";

grant select on table "public"."user_2fa_settings" to "anon";

grant trigger on table "public"."user_2fa_settings" to "anon";

grant truncate on table "public"."user_2fa_settings" to "anon";

grant update on table "public"."user_2fa_settings" to "anon";

grant delete on table "public"."user_2fa_settings" to "authenticated";

grant insert on table "public"."user_2fa_settings" to "authenticated";

grant references on table "public"."user_2fa_settings" to "authenticated";

grant select on table "public"."user_2fa_settings" to "authenticated";

grant trigger on table "public"."user_2fa_settings" to "authenticated";

grant truncate on table "public"."user_2fa_settings" to "authenticated";

grant update on table "public"."user_2fa_settings" to "authenticated";

grant delete on table "public"."user_2fa_settings" to "service_role";

grant insert on table "public"."user_2fa_settings" to "service_role";

grant references on table "public"."user_2fa_settings" to "service_role";

grant select on table "public"."user_2fa_settings" to "service_role";

grant trigger on table "public"."user_2fa_settings" to "service_role";

grant truncate on table "public"."user_2fa_settings" to "service_role";

grant update on table "public"."user_2fa_settings" to "service_role";

grant delete on table "public"."user_activity" to "anon";

grant insert on table "public"."user_activity" to "anon";

grant references on table "public"."user_activity" to "anon";

grant select on table "public"."user_activity" to "anon";

grant trigger on table "public"."user_activity" to "anon";

grant truncate on table "public"."user_activity" to "anon";

grant update on table "public"."user_activity" to "anon";

grant delete on table "public"."user_activity" to "authenticated";

grant insert on table "public"."user_activity" to "authenticated";

grant references on table "public"."user_activity" to "authenticated";

grant select on table "public"."user_activity" to "authenticated";

grant trigger on table "public"."user_activity" to "authenticated";

grant truncate on table "public"."user_activity" to "authenticated";

grant update on table "public"."user_activity" to "authenticated";

grant delete on table "public"."user_activity" to "service_role";

grant insert on table "public"."user_activity" to "service_role";

grant references on table "public"."user_activity" to "service_role";

grant select on table "public"."user_activity" to "service_role";

grant trigger on table "public"."user_activity" to "service_role";

grant truncate on table "public"."user_activity" to "service_role";

grant update on table "public"."user_activity" to "service_role";

grant delete on table "public"."user_explicit_preferences" to "anon";

grant insert on table "public"."user_explicit_preferences" to "anon";

grant references on table "public"."user_explicit_preferences" to "anon";

grant select on table "public"."user_explicit_preferences" to "anon";

grant trigger on table "public"."user_explicit_preferences" to "anon";

grant truncate on table "public"."user_explicit_preferences" to "anon";

grant update on table "public"."user_explicit_preferences" to "anon";

grant delete on table "public"."user_explicit_preferences" to "authenticated";

grant insert on table "public"."user_explicit_preferences" to "authenticated";

grant references on table "public"."user_explicit_preferences" to "authenticated";

grant select on table "public"."user_explicit_preferences" to "authenticated";

grant trigger on table "public"."user_explicit_preferences" to "authenticated";

grant truncate on table "public"."user_explicit_preferences" to "authenticated";

grant update on table "public"."user_explicit_preferences" to "authenticated";

grant delete on table "public"."user_explicit_preferences" to "service_role";

grant insert on table "public"."user_explicit_preferences" to "service_role";

grant references on table "public"."user_explicit_preferences" to "service_role";

grant select on table "public"."user_explicit_preferences" to "service_role";

grant trigger on table "public"."user_explicit_preferences" to "service_role";

grant truncate on table "public"."user_explicit_preferences" to "service_role";

grant update on table "public"."user_explicit_preferences" to "service_role";

grant delete on table "public"."user_likes" to "anon";

grant insert on table "public"."user_likes" to "anon";

grant references on table "public"."user_likes" to "anon";

grant select on table "public"."user_likes" to "anon";

grant trigger on table "public"."user_likes" to "anon";

grant truncate on table "public"."user_likes" to "anon";

grant update on table "public"."user_likes" to "anon";

grant delete on table "public"."user_likes" to "authenticated";

grant insert on table "public"."user_likes" to "authenticated";

grant references on table "public"."user_likes" to "authenticated";

grant select on table "public"."user_likes" to "authenticated";

grant trigger on table "public"."user_likes" to "authenticated";

grant truncate on table "public"."user_likes" to "authenticated";

grant update on table "public"."user_likes" to "authenticated";

grant delete on table "public"."user_likes" to "service_role";

grant insert on table "public"."user_likes" to "service_role";

grant references on table "public"."user_likes" to "service_role";

grant select on table "public"."user_likes" to "service_role";

grant trigger on table "public"."user_likes" to "service_role";

grant truncate on table "public"."user_likes" to "service_role";

grant update on table "public"."user_likes" to "service_role";

grant delete on table "public"."user_notification_preferences" to "anon";

grant insert on table "public"."user_notification_preferences" to "anon";

grant references on table "public"."user_notification_preferences" to "anon";

grant select on table "public"."user_notification_preferences" to "anon";

grant trigger on table "public"."user_notification_preferences" to "anon";

grant truncate on table "public"."user_notification_preferences" to "anon";

grant update on table "public"."user_notification_preferences" to "anon";

grant delete on table "public"."user_notification_preferences" to "authenticated";

grant insert on table "public"."user_notification_preferences" to "authenticated";

grant references on table "public"."user_notification_preferences" to "authenticated";

grant select on table "public"."user_notification_preferences" to "authenticated";

grant trigger on table "public"."user_notification_preferences" to "authenticated";

grant truncate on table "public"."user_notification_preferences" to "authenticated";

grant update on table "public"."user_notification_preferences" to "authenticated";

grant delete on table "public"."user_notification_preferences" to "service_role";

grant insert on table "public"."user_notification_preferences" to "service_role";

grant references on table "public"."user_notification_preferences" to "service_role";

grant select on table "public"."user_notification_preferences" to "service_role";

grant trigger on table "public"."user_notification_preferences" to "service_role";

grant truncate on table "public"."user_notification_preferences" to "service_role";

grant update on table "public"."user_notification_preferences" to "service_role";

grant delete on table "public"."user_sessions" to "anon";

grant insert on table "public"."user_sessions" to "anon";

grant references on table "public"."user_sessions" to "anon";

grant select on table "public"."user_sessions" to "anon";

grant trigger on table "public"."user_sessions" to "anon";

grant truncate on table "public"."user_sessions" to "anon";

grant update on table "public"."user_sessions" to "anon";

grant delete on table "public"."user_sessions" to "authenticated";

grant insert on table "public"."user_sessions" to "authenticated";

grant references on table "public"."user_sessions" to "authenticated";

grant select on table "public"."user_sessions" to "authenticated";

grant trigger on table "public"."user_sessions" to "authenticated";

grant truncate on table "public"."user_sessions" to "authenticated";

grant update on table "public"."user_sessions" to "authenticated";

grant delete on table "public"."user_sessions" to "service_role";

grant insert on table "public"."user_sessions" to "service_role";

grant references on table "public"."user_sessions" to "service_role";

grant select on table "public"."user_sessions" to "service_role";

grant trigger on table "public"."user_sessions" to "service_role";

grant truncate on table "public"."user_sessions" to "service_role";

grant update on table "public"."user_sessions" to "service_role";

grant delete on table "public"."user_staking" to "anon";

grant insert on table "public"."user_staking" to "anon";

grant references on table "public"."user_staking" to "anon";

grant select on table "public"."user_staking" to "anon";

grant trigger on table "public"."user_staking" to "anon";

grant truncate on table "public"."user_staking" to "anon";

grant update on table "public"."user_staking" to "anon";

grant delete on table "public"."user_staking" to "authenticated";

grant insert on table "public"."user_staking" to "authenticated";

grant references on table "public"."user_staking" to "authenticated";

grant select on table "public"."user_staking" to "authenticated";

grant trigger on table "public"."user_staking" to "authenticated";

grant truncate on table "public"."user_staking" to "authenticated";

grant update on table "public"."user_staking" to "authenticated";

grant delete on table "public"."user_staking" to "service_role";

grant insert on table "public"."user_staking" to "service_role";

grant references on table "public"."user_staking" to "service_role";

grant select on table "public"."user_staking" to "service_role";

grant trigger on table "public"."user_staking" to "service_role";

grant truncate on table "public"."user_staking" to "service_role";

grant update on table "public"."user_staking" to "service_role";

grant delete on table "public"."user_tokens" to "anon";

grant insert on table "public"."user_tokens" to "anon";

grant references on table "public"."user_tokens" to "anon";

grant select on table "public"."user_tokens" to "anon";

grant trigger on table "public"."user_tokens" to "anon";

grant truncate on table "public"."user_tokens" to "anon";

grant update on table "public"."user_tokens" to "anon";

grant delete on table "public"."user_tokens" to "authenticated";

grant insert on table "public"."user_tokens" to "authenticated";

grant references on table "public"."user_tokens" to "authenticated";

grant select on table "public"."user_tokens" to "authenticated";

grant trigger on table "public"."user_tokens" to "authenticated";

grant truncate on table "public"."user_tokens" to "authenticated";

grant update on table "public"."user_tokens" to "authenticated";

grant delete on table "public"."user_tokens" to "service_role";

grant insert on table "public"."user_tokens" to "service_role";

grant references on table "public"."user_tokens" to "service_role";

grant select on table "public"."user_tokens" to "service_role";

grant trigger on table "public"."user_tokens" to "service_role";

grant truncate on table "public"."user_tokens" to "service_role";

grant update on table "public"."user_tokens" to "service_role";

grant delete on table "public"."wallet_transactions" to "anon";

grant insert on table "public"."wallet_transactions" to "anon";

grant references on table "public"."wallet_transactions" to "anon";

grant select on table "public"."wallet_transactions" to "anon";

grant trigger on table "public"."wallet_transactions" to "anon";

grant truncate on table "public"."wallet_transactions" to "anon";

grant update on table "public"."wallet_transactions" to "anon";

grant delete on table "public"."wallet_transactions" to "authenticated";

grant insert on table "public"."wallet_transactions" to "authenticated";

grant references on table "public"."wallet_transactions" to "authenticated";

grant select on table "public"."wallet_transactions" to "authenticated";

grant trigger on table "public"."wallet_transactions" to "authenticated";

grant truncate on table "public"."wallet_transactions" to "authenticated";

grant update on table "public"."wallet_transactions" to "authenticated";

grant delete on table "public"."wallet_transactions" to "service_role";

grant insert on table "public"."wallet_transactions" to "service_role";

grant references on table "public"."wallet_transactions" to "service_role";

grant select on table "public"."wallet_transactions" to "service_role";

grant trigger on table "public"."wallet_transactions" to "service_role";

grant truncate on table "public"."wallet_transactions" to "service_role";

grant update on table "public"."wallet_transactions" to "service_role";

grant delete on table "public"."worldid_rewards" to "anon";

grant insert on table "public"."worldid_rewards" to "anon";

grant references on table "public"."worldid_rewards" to "anon";

grant select on table "public"."worldid_rewards" to "anon";

grant trigger on table "public"."worldid_rewards" to "anon";

grant truncate on table "public"."worldid_rewards" to "anon";

grant update on table "public"."worldid_rewards" to "anon";

grant delete on table "public"."worldid_rewards" to "authenticated";

grant insert on table "public"."worldid_rewards" to "authenticated";

grant references on table "public"."worldid_rewards" to "authenticated";

grant select on table "public"."worldid_rewards" to "authenticated";

grant trigger on table "public"."worldid_rewards" to "authenticated";

grant truncate on table "public"."worldid_rewards" to "authenticated";

grant update on table "public"."worldid_rewards" to "authenticated";

grant delete on table "public"."worldid_rewards" to "service_role";

grant insert on table "public"."worldid_rewards" to "service_role";

grant references on table "public"."worldid_rewards" to "service_role";

grant select on table "public"."worldid_rewards" to "service_role";

grant trigger on table "public"."worldid_rewards" to "service_role";

grant truncate on table "public"."worldid_rewards" to "service_role";

grant update on table "public"."worldid_rewards" to "service_role";

grant delete on table "public"."worldid_statistics" to "anon";

grant insert on table "public"."worldid_statistics" to "anon";

grant references on table "public"."worldid_statistics" to "anon";

grant select on table "public"."worldid_statistics" to "anon";

grant trigger on table "public"."worldid_statistics" to "anon";

grant truncate on table "public"."worldid_statistics" to "anon";

grant update on table "public"."worldid_statistics" to "anon";

grant delete on table "public"."worldid_statistics" to "authenticated";

grant insert on table "public"."worldid_statistics" to "authenticated";

grant references on table "public"."worldid_statistics" to "authenticated";

grant select on table "public"."worldid_statistics" to "authenticated";

grant trigger on table "public"."worldid_statistics" to "authenticated";

grant truncate on table "public"."worldid_statistics" to "authenticated";

grant update on table "public"."worldid_statistics" to "authenticated";

grant delete on table "public"."worldid_statistics" to "service_role";

grant insert on table "public"."worldid_statistics" to "service_role";

grant references on table "public"."worldid_statistics" to "service_role";

grant select on table "public"."worldid_statistics" to "service_role";

grant trigger on table "public"."worldid_statistics" to "service_role";

grant truncate on table "public"."worldid_statistics" to "service_role";

grant update on table "public"."worldid_statistics" to "service_role";


  create policy "ai_scores_insert_service"
  on "public"."ai_compatibility_scores"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "ai_scores_select_own"
  on "public"."ai_compatibility_scores"
  as permissive
  for select
  to public
using (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));



  create policy "ai_scores_update_service"
  on "public"."ai_compatibility_scores"
  as permissive
  for update
  to public
using ((auth.role() = 'service_role'::text));



  create policy "model_metrics_insert_service"
  on "public"."ai_model_metrics"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "model_metrics_select_admin"
  on "public"."ai_model_metrics"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "prediction_logs_insert_service"
  on "public"."ai_prediction_logs"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "prediction_logs_select_admin"
  on "public"."ai_prediction_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "insert_analytics_events"
  on "public"."analytics_events"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Service role can insert app logs"
  on "public"."app_logs"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view their own app logs"
  on "public"."app_logs"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (user_id IS NULL)));



  create policy "insert_app_logs"
  on "public"."app_logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_app_logs"
  on "public"."app_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "staff_app_logs"
  on "public"."app_logs"
  as permissive
  for all
  to public
using (public.is_admin_or_moderator());



  create policy "System can insert audit logs"
  on "public"."audit_logs"
  as permissive
  for insert
  to public
with check (true);



  create policy "Admins can manage automation rules"
  on "public"."automation_rules"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.account_type = 'admin'::text)))));



  create policy "Users can read enabled automation rules"
  on "public"."automation_rules"
  as permissive
  for select
  to public
using (((enabled = true) AND (auth.uid() IS NOT NULL)));



  create policy "Admins can delete banners"
  on "public"."banner_config"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can insert banners"
  on "public"."banner_config"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can update banners"
  on "public"."banner_config"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can view all banners"
  on "public"."banner_config"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Anyone can view active banners"
  on "public"."banner_config"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Authenticated users can create challenges"
  on "public"."biometric_challenges"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can manage their own biometric credentials"
  on "public"."biometric_credentials"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own biometric sessions"
  on "public"."biometric_sessions"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own biometric sessions"
  on "public"."biometric_sessions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own biometric sessions"
  on "public"."biometric_sessions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own biometric sessions"
  on "public"."biometric_sessions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "insert_biometric_sessions"
  on "public"."biometric_sessions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_biometric_sessions"
  on "public"."biometric_sessions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blockchain_transactions'
      AND policyname = 'System can insert blockchain transactions'
  ) THEN
    EXECUTE 'create policy "System can insert blockchain transactions"\n  on "public"."blockchain_transactions"\n  as permissive\n  for insert\n  to public\nwith check (true);';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blockchain_transactions'
      AND policyname = 'Users can view own blockchain transactions'
  ) THEN
    EXECUTE 'create policy "Users can view own blockchain transactions"\n  on "public"."blockchain_transactions"\n  as permissive\n  for select\n  to public\nusing (((user_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM public.admin_users\n  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));';
  END IF;
END $$;



  create policy "insert_blockchain_transactions"
  on "public"."blockchain_transactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "blocked_ips_admin_access"
  on "public"."blocked_ips"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Admins can view all career applications"
  on "public"."career_applications"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (ur.is_active = true)))));



  create policy "Admins pueden ver todas las solicitudes de carrera"
  on "public"."career_applications"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can view their own career applications"
  on "public"."career_applications"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Usuarios pueden crear solicitudes de carrera"
  on "public"."career_applications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view own chat invitations"
  on "public"."chat_invitations"
  as permissive
  for select
  to public
using (((invited_by = auth.uid()) OR (invited_user = auth.uid())));



  create policy "Users can view room members"
  on "public"."chat_members"
  as permissive
  for select
  to public
using ((profile_id = auth.uid()));



  create policy "Users can view accessible rooms"
  on "public"."chat_rooms"
  as permissive
  for select
  to public
using (((type = 'public'::text) OR (created_by = auth.uid())));



  create policy "chat_summaries_insert_service"
  on "public"."chat_summaries"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "chat_summaries_select_own"
  on "public"."chat_summaries"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.chat_members
  WHERE ((chat_members.room_id = chat_summaries.chat_id) AND (chat_members.profile_id = auth.uid())))));



  create policy "Users can create own checkins"
  on "public"."club_checkins"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can view own checkins"
  on "public"."club_checkins"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can view verified checkins"
  on "public"."club_checkins"
  as permissive
  for select
  to public
using ((is_verified = true));



  create policy "Admins can manage flyers"
  on "public"."club_flyers"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Anyone can view active flyers"
  on "public"."club_flyers"
  as permissive
  for select
  to public
using ((is_active = true));



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_reviews'
      AND policyname = 'Anyone can view verified reviews'
  ) THEN
    EXECUTE 'create policy "Anyone can view verified reviews"\n  on "public"."club_reviews"\n  as permissive\n  for select\n  to public\nusing ((is_verified = true));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_reviews'
      AND policyname = 'Users can create own reviews'
  ) THEN
    EXECUTE 'create policy "Users can create own reviews"\n  on "public"."club_reviews"\n  as permissive\n  for insert\n  to public\nwith check ((user_id = auth.uid()));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_reviews'
      AND policyname = 'Users can update own reviews'
  ) THEN
    EXECUTE 'create policy "Users can update own reviews"\n  on "public"."club_reviews"\n  as permissive\n  for update\n  to public\nusing ((user_id = auth.uid()));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_reviews'
      AND policyname = 'Users can view own reviews'
  ) THEN
    EXECUTE 'create policy "Users can view own reviews"\n  on "public"."club_reviews"\n  as permissive\n  for select\n  to public\nusing ((user_id = auth.uid()));';
  END IF;
END $$;



  create policy "Users can view club verifications"
  on "public"."club_verifications"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))) OR (verified_by = auth.uid())));



  create policy "Admins can manage clubs"
  on "public"."clubs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clubs'
      AND policyname = 'Anyone can view active clubs'
  ) THEN
    EXECUTE 'create policy "Anyone can view active clubs"\n  on "public"."clubs"\n  as permissive\n  for select\n  to public\nusing ((is_active = true));';
  END IF;
END $$;



  create policy "Admins can view all purchases"
  on "public"."cmpx_purchases"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Users can create own purchases"
  on "public"."cmpx_purchases"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can view own purchases"
  on "public"."cmpx_purchases"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Admins can manage packages"
  on "public"."cmpx_shop_packages"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Anyone can view active packages"
  on "public"."cmpx_shop_packages"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Users can create their own comment likes"
  on "public"."comment_likes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete their own comment likes"
  on "public"."comment_likes"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can view all comment likes"
  on "public"."comment_likes"
  as permissive
  for select
  to public
using (true);



  create policy "comment_likes_own_data"
  on "public"."comment_likes"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "comment_likes_public_read"
  on "public"."comment_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Los usuarios pueden ver scores donde participan"
  on "public"."compatibility_scores"
  as permissive
  for select
  to public
using (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));



  create policy "Solo el sistema puede actualizar scores de compatibilidad"
  on "public"."compatibility_scores"
  as permissive
  for update
  to public
using (false);



  create policy "Solo el sistema puede insertar scores de compatibilidad"
  on "public"."compatibility_scores"
  as permissive
  for insert
  to public
with check (false);



  create policy "Users can create consent verifications for their chats"
  on "public"."consent_verifications"
  as permissive
  for insert
  to public
with check (((auth.uid() = user_id1) OR (auth.uid() = user_id2) OR (auth.uid() = user_id)));



  create policy "Users can create own consent verifications"
  on "public"."consent_verifications"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own consent verifications"
  on "public"."consent_verifications"
  as permissive
  for update
  to public
using (((auth.uid() = user_id1) OR (auth.uid() = user_id2) OR (auth.uid() = user_id)));



  create policy "Users can view own consent verifications by chat"
  on "public"."consent_verifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id1) OR (auth.uid() = user_id2) OR (auth.uid() = user_id) OR (auth.uid() = recipient_id)));



  create policy "Users can view own consent verifications"
  on "public"."consent_verifications"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (auth.uid() = recipient_id)));



  create policy "Moderators can manage content moderation"
  on "public"."content_moderation"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));



  create policy "Moderators can view content moderation"
  on "public"."content_moderation"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));



  create policy "Partners can create an agreement for their couple"
  on "public"."couple_agreements"
  as permissive
  for insert
  to public
with check ((((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)) AND (couple_id IS NOT NULL)));



  create policy "Partners can update own agreements"
  on "public"."couple_agreements"
  as permissive
  for update
  to public
using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));



  create policy "Partners can update the agreement to sign it"
  on "public"."couple_agreements"
  as permissive
  for update
  to public
using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)))
with check ((((auth.uid() = partner_1_id) AND (partner_2_signature = ( SELECT couple_agreements_1.partner_2_signature
   FROM public.couple_agreements couple_agreements_1
  WHERE (couple_agreements_1.id = couple_agreements_1.id)))) OR ((auth.uid() = partner_2_id) AND (partner_1_signature = ( SELECT couple_agreements_1.partner_1_signature
   FROM public.couple_agreements couple_agreements_1
  WHERE (couple_agreements_1.id = couple_agreements_1.id))))));



  create policy "Partners can view own agreements"
  on "public"."couple_agreements"
  as permissive
  for select
  to public
using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));



  create policy "Partners can view their own agreement"
  on "public"."couple_agreements"
  as permissive
  for select
  to public
using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));



  create policy "couple_agreements_insert"
  on "public"."couple_agreements"
  as permissive
  for insert
  to public
with check (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));



  create policy "couple_agreements_update"
  on "public"."couple_agreements"
  as permissive
  for update
  to public
using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)))
with check (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));



  create policy "couple_agreements_view_own"
  on "public"."couple_agreements"
  as permissive
  for select
  to public
using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id) OR (EXISTS ( SELECT 1
   FROM public.couple_profiles
  WHERE ((couple_profiles.id = couple_agreements.couple_id) AND ((couple_profiles.partner_1_id = auth.uid()) OR (couple_profiles.partner_2_id = auth.uid())))))));



  create policy "couple_disputes_view_own"
  on "public"."couple_disputes"
  as permissive
  for select
  to public
using (((auth.uid() = initiated_by) OR (EXISTS ( SELECT 1
   FROM public.couple_profiles
  WHERE ((couple_profiles.id = couple_disputes.couple_id) AND ((couple_profiles.partner_1_id = auth.uid()) OR (couple_profiles.partner_2_id = auth.uid())))))));



  create policy "insert_couple_disputes"
  on "public"."couple_disputes"
  as permissive
  for insert
  to public
with check ((auth.uid() IN ( SELECT couple_profiles.partner_1_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_disputes.couple_id)
UNION
 SELECT couple_profiles.partner_2_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_disputes.couple_id))));



  create policy "Users can create couple events"
  on "public"."couple_events"
  as permissive
  for insert
  to public
with check (((auth.uid() = organizer_id) OR (organizer_id IS NULL)));



  create policy "Users can update own couple events"
  on "public"."couple_events"
  as permissive
  for update
  to public
using (((auth.uid() = organizer_id) OR (organizer_id IS NULL)));



  create policy "Users can view public couple events"
  on "public"."couple_events"
  as permissive
  for select
  to public
using ((is_public = true));



  create policy "couple_events_insert"
  on "public"."couple_events"
  as permissive
  for insert
  to public
with check ((auth.uid() IN ( SELECT couple_profiles.partner_1_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_events.couple_id)
UNION
 SELECT couple_profiles.partner_2_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_events.couple_id))));



  create policy "couple_events_staff"
  on "public"."couple_events"
  as permissive
  for all
  to public
using (public.is_admin_or_moderator());



  create policy "couple_events_update"
  on "public"."couple_events"
  as permissive
  for update
  to public
using ((auth.uid() IN ( SELECT couple_profiles.partner_1_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_events.couple_id)
UNION
 SELECT couple_profiles.partner_2_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_events.couple_id))));



  create policy "couple_events_view_own"
  on "public"."couple_events"
  as permissive
  for select
  to public
using (((is_public = true) OR (auth.uid() IN ( SELECT couple_profiles.partner_1_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_events.couple_id)
UNION
 SELECT couple_profiles.partner_2_id
   FROM public.couple_profiles
  WHERE (couple_profiles.id = couple_events.couple_id)))));



  create policy "Admins can delete likes"
  on "public"."couple_profile_likes"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Admins can insert likes"
  on "public"."couple_profile_likes"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Admins can view likes"
  on "public"."couple_profile_likes"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "couple_profile_likes_own_data"
  on "public"."couple_profile_likes"
  as permissive
  for all
  to public
using ((liker_profile_id IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));



  create policy "couple_profile_likes_public_read"
  on "public"."couple_profile_likes"
  as permissive
  for select
  to public
using (true);



  create policy "couple_profile_matches_public_read"
  on "public"."couple_profile_matches"
  as permissive
  for select
  to public
using (true);



  create policy "couple_profile_reports_admin_read"
  on "public"."couple_profile_reports"
  as permissive
  for select
  to public
using (false);



  create policy "couple_profile_reports_own_data"
  on "public"."couple_profile_reports"
  as permissive
  for all
  to public
using ((reporter_profile_id IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));



  create policy "couple_profile_views_own_data"
  on "public"."couple_profile_views"
  as permissive
  for all
  to public
using ((viewer_profile_id IN ( SELECT profiles.user_id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));



  create policy "couple_profile_views_public_read"
  on "public"."couple_profile_views"
  as permissive
  for select
  to public
using (true);



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Aislamiento Demo vs Producción'
  ) THEN
    EXECUTE 'create policy "Aislamiento Demo vs Producción" on "public"."couple_profiles" as permissive for select to public using ((NOT (( SELECT profiles.is_demo FROM public.profiles WHERE (profiles.user_id = auth.uid())) IS DISTINCT FROM ( SELECT profiles.is_demo FROM public.profiles WHERE (profiles.user_id = couple_profiles.user_id)))) OR (( SELECT profiles.is_admin FROM public.profiles WHERE (profiles.user_id = auth.uid())) = true));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Users can insert own couple profile'
  ) THEN
    EXECUTE 'create policy "Users can insert own couple profile" on "public"."couple_profiles" as permissive for insert to public with check (((user_id = auth.uid()) OR (partner_1_id = auth.uid()) OR (partner_2_id = auth.uid())));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Users can update own couple profile'
  ) THEN
    EXECUTE 'create policy "Users can update own couple profile" on "public"."couple_profiles" as permissive for update to public using (((user_id = auth.uid()) OR (partner_1_id = auth.uid()) OR (partner_2_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM public.admin_users WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Users can view accessible couple profiles'
  ) THEN
    EXECUTE 'create policy "Users can view accessible couple profiles" on "public"."couple_profiles" as permissive for select to public using (((user_id = auth.uid()) OR (partner_1_id = auth.uid()) OR (partner_2_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM public.admin_users WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Usuarios pueden borrar su perfil de pareja'
  ) THEN
    EXECUTE 'create policy "Usuarios pueden borrar su perfil de pareja" on "public"."couple_profiles" as permissive for delete to public using ((auth.uid() = user_id));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Usuarios pueden crear su perfil de pareja'
  ) THEN
    EXECUTE 'create policy "Usuarios pueden crear su perfil de pareja" on "public"."couple_profiles" as permissive for insert to public with check ((auth.uid() = user_id));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Usuarios pueden editar su perfil de pareja'
  ) THEN
    EXECUTE 'create policy "Usuarios pueden editar su perfil de pareja" on "public"."couple_profiles" as permissive for update to public using ((auth.uid() = user_id));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'Visitantes solo ven Demos'
  ) THEN
    EXECUTE 'create policy "Visitantes solo ven Demos" on "public"."couple_profiles" as permissive for select to public using (((auth.role() = ''anon''::text) AND (( SELECT profiles.is_demo FROM public.profiles WHERE (profiles.user_id = couple_profiles.user_id)) = true)));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'couple_profiles_insert'
  ) THEN
    EXECUTE 'create policy "couple_profiles_insert" on "public"."couple_profiles" as permissive for insert to public with check ((auth.uid() = user_id));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'couple_profiles_public_read'
  ) THEN
    EXECUTE 'create policy "couple_profiles_public_read" on "public"."couple_profiles" as permissive for select to public using (true);';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'couple_profiles_staff'
  ) THEN
    EXECUTE 'create policy "couple_profiles_staff" on "public"."couple_profiles" as permissive for all to public using (public.is_admin_or_moderator());';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'couple_profiles_update'
  ) THEN
    EXECUTE 'create policy "couple_profiles_update" on "public"."couple_profiles" as permissive for update to public using (((auth.uid() = user_id) OR (auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'couple_profiles_view_own'
  ) THEN
    EXECUTE 'create policy "couple_profiles_view_own" on "public"."couple_profiles" as permissive for select to public using (((auth.uid() = user_id) OR (auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'own_couple_profiles'
  ) THEN
    EXECUTE 'create policy "own_couple_profiles" on "public"."couple_profiles" as permissive for select to public using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'own_couple_profiles_insert'
  ) THEN
    EXECUTE 'create policy "own_couple_profiles_insert" on "public"."couple_profiles" as permissive for insert to public with check (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND policyname = 'own_couple_profiles_update'
  ) THEN
    EXECUTE 'create policy "own_couple_profiles_update" on "public"."couple_profiles" as permissive for update to public using (((auth.uid() = partner_1_id) OR (auth.uid() = partner_2_id)));';
  END IF;
END $$;



  create policy "insert_daily_token_claims"
  on "public"."daily_token_claims"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Admins can view fingerprints"
  on "public"."digital_fingerprints"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "System can insert fingerprints"
  on "public"."digital_fingerprints"
  as permissive
  for insert
  to public
with check (true);



  create policy "Admins can update error alerts"
  on "public"."error_alerts"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can view all error alerts"
  on "public"."error_alerts"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "System can insert error alerts"
  on "public"."error_alerts"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can create own event participations"
  on "public"."event_participations"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view own event participations"
  on "public"."event_participations"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Las preferencias explícitas son públicas para lectura"
  on "public"."explicit_preferences"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "FAQ items are public for reading"
  on "public"."faq_items"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "follows_own_data"
  on "public"."follows"
  as permissive
  for all
  to public
using ((follower_user_id = auth.uid()));



  create policy "follows_public_read"
  on "public"."follows"
  as permissive
  for select
  to public
using (true);



  create policy "fraud_analysis_admin_all"
  on "public"."fraud_analysis"
  as permissive
  for all
  to public
using (false);



  create policy "fraud_analysis_own_data"
  on "public"."fraud_analysis"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "frozen_assets_view_own"
  on "public"."frozen_assets"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.couple_profiles
  WHERE ((couple_profiles.id = frozen_assets.couple_id) AND ((couple_profiles.partner_1_id = auth.uid()) OR (couple_profiles.partner_2_id = auth.uid()))))));



  create policy "Admins can insert gallery requests"
  on "public"."gallery_access_requests"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Admins can update gallery requests"
  on "public"."gallery_access_requests"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Admins can view gallery requests"
  on "public"."gallery_access_requests"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Users can view own requests"
  on "public"."gallery_access_requests"
  as permissive
  for select
  to public
using (((requester_id = auth.uid()) OR (requested_from = auth.uid())));



  create policy "gallery_commissions_insert_service"
  on "public"."gallery_commissions"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "gallery_commissions_select_own"
  on "public"."gallery_commissions"
  as permissive
  for select
  to public
using (((auth.uid())::text = (creator_id)::text));



  create policy "gallery_commissions_update_own"
  on "public"."gallery_commissions"
  as permissive
  for update
  to public
using (((auth.uid())::text = (creator_id)::text))
with check (((auth.uid())::text = (creator_id)::text));



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_permissions'
      AND policyname = 'Owners can update gallery permissions'
  ) THEN
    EXECUTE 'create policy "Owners can update gallery permissions" on "public"."gallery_permissions" as permissive for update to public using (((gallery_owner_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM public.admin_users WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_permissions'
      AND policyname = 'Users can insert gallery permissions'
  ) THEN
    EXECUTE 'create policy "Users can insert gallery permissions" on "public"."gallery_permissions" as permissive for insert to public with check ((gallery_owner_id = auth.uid()));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_permissions'
      AND policyname = 'Users can view own gallery permissions'
  ) THEN
    EXECUTE 'create policy "Users can view own gallery permissions" on "public"."gallery_permissions" as permissive for select to public using (((gallery_owner_id = auth.uid()) OR (profile_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM public.admin_users WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_permissions'
      AND policyname = 'Users can view own permissions'
  ) THEN
    EXECUTE 'create policy "Users can view own permissions" on "public"."gallery_permissions" as permissive for select to public using (((granted_by = auth.uid()) OR (granted_to = auth.uid())));';
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_permissions'
      AND policyname = 'gallery_permissions_own_data'
  ) THEN
    EXECUTE 'create policy "gallery_permissions_own_data" on "public"."gallery_permissions" as permissive for all to public using (((granted_by IN ( SELECT profiles.user_id FROM public.profiles WHERE (profiles.user_id = auth.uid()))) OR (granted_to IN ( SELECT profiles.user_id FROM public.profiles WHERE (profiles.user_id = auth.uid())))));';
  END IF;
END $$;



  create policy "Allow individual insert access"
  on "public"."gallery_unlocks"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Allow individual read access"
  on "public"."gallery_unlocks"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own image permissions"
  on "public"."image_permissions"
  as permissive
  for select
  to public
using (((granted_by = auth.uid()) OR (granted_to = auth.uid())));



  create policy "Users can create their own images"
  on "public"."images"
  as permissive
  for insert
  to public
with check ((auth.uid() = profile_id));



  create policy "Users can delete their own images"
  on "public"."images"
  as permissive
  for delete
  to public
using ((auth.uid() = profile_id));



  create policy "Users can manage own images"
  on "public"."images"
  as permissive
  for all
  to public
using ((profile_id = auth.uid()));



  create policy "Users can update their own images"
  on "public"."images"
  as permissive
  for update
  to public
using ((auth.uid() = profile_id));



  create policy "Users can view own images"
  on "public"."images"
  as permissive
  for select
  to public
using ((profile_id = auth.uid()));



  create policy "Users can view public images"
  on "public"."images"
  as permissive
  for select
  to public
using ((is_public = true));



  create policy "Users can view their own images"
  on "public"."images"
  as permissive
  for select
  to public
using ((auth.uid() = profile_id));



  create policy "Admins can view all returns"
  on "public"."investment_returns"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Users can view own returns"
  on "public"."investment_returns"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Admins can manage tiers"
  on "public"."investment_tiers"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Anyone can view active tiers"
  on "public"."investment_tiers"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "investment_tiers_update"
  on "public"."investment_tiers"
  as permissive
  for update
  to public
using ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text))));



  create policy "Admins can view all investments"
  on "public"."investments"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Users can create own investments"
  on "public"."investments"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can view own investments"
  on "public"."investments"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "investments_update"
  on "public"."investments"
  as permissive
  for update
  to public
using (((user_id = auth.uid()) OR (auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));



  create policy "invitation_analytics_own_data"
  on "public"."invitation_analytics"
  as permissive
  for all
  to public
using ((invitation_id IN ( SELECT invitations.id
   FROM public.invitations
  WHERE ((invitations.from_profile IN ( SELECT profiles.user_id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid()))) OR (invitations.to_profile IN ( SELECT profiles.user_id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid())))))));



  create policy "invitation_responses_own_data"
  on "public"."invitation_responses"
  as permissive
  for all
  to public
using ((invitation_id IN ( SELECT invitations.id
   FROM public.invitations
  WHERE ((invitations.from_profile IN ( SELECT profiles.user_id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid()))) OR (invitations.to_profile IN ( SELECT profiles.user_id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid())))))));



  create policy "invitation_statistics_insert_service"
  on "public"."invitation_statistics"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "invitation_statistics_select_own"
  on "public"."invitation_statistics"
  as permissive
  for select
  to public
using (((auth.uid())::text = (user_id)::text));



  create policy "invitation_statistics_update_service"
  on "public"."invitation_statistics"
  as permissive
  for update
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "invitation_templates_admin_all"
  on "public"."invitation_templates"
  as permissive
  for all
  to public
using (false);



  create policy "invitation_templates_public_read"
  on "public"."invitation_templates"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Users can create invitations"
  on "public"."invitations"
  as permissive
  for insert
  to public
with check ((from_profile = auth.uid()));



  create policy "Users can insert invitations"
  on "public"."invitations"
  as permissive
  for insert
  to public
with check ((from_profile = auth.uid()));



  create policy "Users can update own invitations"
  on "public"."invitations"
  as permissive
  for update
  to public
using ((from_profile = auth.uid()));



  create policy "Users can view own invitations"
  on "public"."invitations"
  as permissive
  for select
  to public
using (((from_profile = auth.uid()) OR (to_profile = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "Users can view own interactions"
  on "public"."match_interactions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can view own matches"
  on "public"."matches"
  as permissive
  for select
  to public
using (((user1_id = auth.uid()) OR (user2_id = auth.uid())));



  create policy "Users can create their own media"
  on "public"."media"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can delete own media"
  on "public"."media"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own media"
  on "public"."media"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own media"
  on "public"."media"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own media"
  on "public"."media"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own media"
  on "public"."media"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own media"
  on "public"."media"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (is_public = true)));



  create policy "Users can view public media"
  on "public"."media"
  as permissive
  for select
  to public
using ((is_public = true));



  create policy "Users can view their own media"
  on "public"."media"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "insert_media"
  on "public"."media"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_media"
  on "public"."media"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "update_media"
  on "public"."media"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Admins can view all access logs"
  on "public"."media_access_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (ur.is_active = true)))));



  create policy "Los usuarios pueden crear logs de acceso"
  on "public"."media_access_logs"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Los usuarios pueden ver sus propios logs de acceso"
  on "public"."media_access_logs"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "System can log access"
  on "public"."media_access_logs"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view their own access logs"
  on "public"."media_access_logs"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can create messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check ((sender_id = auth.uid()));



  create policy "Users can view room messages"
  on "public"."messages"
  as permissive
  for select
  to public
using ((sender_id = auth.uid()));



  create policy "users_can_delete_own_mfa_settings"
  on "public"."mfa_settings"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "users_can_insert_own_mfa_settings"
  on "public"."mfa_settings"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "users_can_update_own_mfa_settings"
  on "public"."mfa_settings"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "users_can_view_own_mfa_settings"
  on "public"."mfa_settings"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can view all moderation logs"
  on "public"."moderation_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (ur.is_active = true)))));



  create policy "Admins pueden ver todos los logs de moderación"
  on "public"."moderation_logs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Moderadores pueden ver sus propios logs"
  on "public"."moderation_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.moderators
  WHERE ((moderators.id = moderation_logs.moderator_id) AND (moderators.user_id = auth.uid())))));



  create policy "Moderators can create logs"
  on "public"."moderation_logs"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.moderators m
  WHERE ((m.id = moderation_logs.moderator_id) AND (m.user_id = auth.uid()) AND (m.is_active = true)))));



  create policy "Moderators can view their own logs"
  on "public"."moderation_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.moderators m
  WHERE ((m.id = moderation_logs.moderator_id) AND (m.user_id = auth.uid())))));



  create policy "Admins can view all payments"
  on "public"."moderator_payments"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Moderators can view own payments"
  on "public"."moderator_payments"
  as permissive
  for select
  to public
using ((moderator_id = auth.uid()));



  create policy "Admins can view all moderator requests"
  on "public"."moderator_requests"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (ur.is_active = true)))));



  create policy "Admins pueden ver todas las solicitudes de moderador"
  on "public"."moderator_requests"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can view their own moderator requests"
  on "public"."moderator_requests"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Usuarios autenticados pueden crear solicitudes de moderador"
  on "public"."moderator_requests"
  as permissive
  for insert
  to public
with check (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));



  create policy "Usuarios pueden ver sus propias solicitudes"
  on "public"."moderator_requests"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Admins can view all sessions"
  on "public"."moderator_sessions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Moderators can create own sessions"
  on "public"."moderator_sessions"
  as permissive
  for insert
  to public
with check ((moderator_id = auth.uid()));



  create policy "Moderators can view own sessions"
  on "public"."moderator_sessions"
  as permissive
  for select
  to public
using ((moderator_id = auth.uid()));



  create policy "Admins can manage all moderators"
  on "public"."moderators"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (ur.is_active = true)))));



  create policy "Admins pueden gestionar moderadores"
  on "public"."moderators"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Moderadores pueden ver su propio registro"
  on "public"."moderators"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can view their own moderator record"
  on "public"."moderators"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Admins can view all monitoring sessions"
  on "public"."monitoring_sessions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "System can insert monitoring sessions"
  on "public"."monitoring_sessions"
  as permissive
  for insert
  to public
with check (true);



  create policy "System can update monitoring sessions"
  on "public"."monitoring_sessions"
  as permissive
  for update
  to public
using (true);



  create policy "Users can view own monitoring sessions"
  on "public"."monitoring_sessions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can create own NFT galleries"
  on "public"."nft_galleries"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own NFT galleries"
  on "public"."nft_galleries"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own NFT galleries"
  on "public"."nft_galleries"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can view public NFT galleries"
  on "public"."nft_galleries"
  as permissive
  for select
  to public
using (((is_public = true) AND (is_verified = true)));



  create policy "Users can create images in own galleries"
  on "public"."nft_gallery_images"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.nft_galleries
  WHERE ((nft_galleries.id = nft_gallery_images.gallery_id) AND (nft_galleries.user_id = auth.uid())))));



  create policy "Users can update images in own galleries"
  on "public"."nft_gallery_images"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.nft_galleries
  WHERE ((nft_galleries.id = nft_gallery_images.gallery_id) AND (nft_galleries.user_id = auth.uid())))));



  create policy "Users can view images in own galleries"
  on "public"."nft_gallery_images"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.nft_galleries
  WHERE ((nft_galleries.id = nft_gallery_images.gallery_id) AND (nft_galleries.user_id = auth.uid())))));



  create policy "Users can view images in public galleries"
  on "public"."nft_gallery_images"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.nft_galleries
  WHERE ((nft_galleries.id = nft_gallery_images.gallery_id) AND (nft_galleries.is_public = true) AND (nft_galleries.is_verified = true)))));



  create policy "System can insert notification history"
  on "public"."notification_history"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view own notification history"
  on "public"."notification_history"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden gestionar sus preferencias"
  on "public"."notification_preferences"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "System can insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can see their own notifications"
  on "public"."notifications"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "System can insert rewards"
  on "public"."pending_rewards"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can claim own rewards"
  on "public"."pending_rewards"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own pending rewards"
  on "public"."pending_rewards"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can view all performance metrics"
  on "public"."performance_metrics"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "System can insert performance metrics"
  on "public"."performance_metrics"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view own performance metrics"
  on "public"."performance_metrics"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can create permanent bans"
  on "public"."permanent_bans"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Admins can view permanent bans"
  on "public"."permanent_bans"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Users can create comments on public posts"
  on "public"."post_comments"
  as permissive
  for insert
  to public
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_comments.post_id) AND ((posts.is_public = true) OR (posts.user_id = auth.uid())))))));



  create policy "Users can create their own post comments"
  on "public"."post_comments"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can delete their own comments"
  on "public"."post_comments"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can delete their own post comments"
  on "public"."post_comments"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can update their own comments"
  on "public"."post_comments"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users can update their own post comments"
  on "public"."post_comments"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users can view all post comments"
  on "public"."post_comments"
  as permissive
  for select
  to public
using (true);



  create policy "Users can view comments on public posts"
  on "public"."post_comments"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.posts
  WHERE ((posts.id = post_comments.post_id) AND ((posts.is_public = true) OR (posts.user_id = auth.uid()))))));



  create policy "Users can create their own post likes"
  on "public"."post_likes"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can delete their own post likes"
  on "public"."post_likes"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can view all post likes"
  on "public"."post_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create their own post shares"
  on "public"."post_shares"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can delete their own post shares"
  on "public"."post_shares"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can view all post shares"
  on "public"."post_shares"
  as permissive
  for select
  to public
using (true);



  create policy "Users can create their own posts"
  on "public"."posts"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can delete their own posts"
  on "public"."posts"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can update their own posts"
  on "public"."posts"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users can view public posts"
  on "public"."posts"
  as permissive
  for select
  to public
using (((is_public = true) OR (user_id = auth.uid())));



  create policy "posts_delete_own"
  on "public"."posts"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "posts_insert_own"
  on "public"."posts"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "posts_select_all"
  on "public"."posts"
  as permissive
  for select
  to public
using (true);



  create policy "posts_update_own"
  on "public"."posts"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can access own profile cache"
  on "public"."profile_cache"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = profile_cache.profile_id) AND (profiles.user_id = auth.uid())))));



  create policy "Demo users see only demo profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((((COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'is_demo'::text))::boolean, false) = true) AND ((is_demo = true) OR (user_id = auth.uid()))) OR ((COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'is_demo'::text))::boolean, false) = false) AND ((is_demo = false) OR (user_id = auth.uid())))));



  create policy "Users can insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Users can update their own PIN"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can view public and own profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((id = auth.uid()) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "Usuarios pueden actualizar su propio perfil"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Usuarios pueden insertar su propio perfil"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Usuarios pueden ver perfiles públicos"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((NOT is_blocked));



  create policy "own_profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "own_profiles_insert"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_profiles_update"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "profiles_public_read"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Los usuarios pueden reclamar sus recompensas"
  on "public"."referral_rewards"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Los usuarios pueden ver sus recompensas"
  on "public"."referral_rewards"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Sistema puede crear recompensas"
  on "public"."referral_rewards"
  as permissive
  for insert
  to public
with check (true);



  create policy "insert_referral_rewards"
  on "public"."referral_rewards"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_referral_rewards"
  on "public"."referral_rewards"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own referral statistics"
  on "public"."referral_statistics"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "insert_referral_statistics"
  on "public"."referral_statistics"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "referral_statistics_admin_read"
  on "public"."referral_statistics"
  as permissive
  for select
  to public
using (false);



  create policy "Users can view own referral transactions"
  on "public"."referral_transactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "insert_referral_transactions"
  on "public"."referral_transactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "referral_transactions_own_data"
  on "public"."referral_transactions"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Moderators can view AI classifications"
  on "public"."report_ai_classification"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))) OR (EXISTS ( SELECT 1
   FROM public.moderators
  WHERE ((moderators.user_id = auth.uid()) AND (moderators.is_active = true))))));



  create policy "own_report_ai_classification"
  on "public"."report_ai_classification"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT reports.reporter_user_id
   FROM public.reports
  WHERE (reports.id = report_ai_classification.report_id))));



  create policy "staff_report_ai_classification"
  on "public"."report_ai_classification"
  as permissive
  for all
  to public
using (public.is_admin_or_moderator());



  create policy "Admins can update reports"
  on "public"."reports"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Authenticated users can update reports"
  on "public"."reports"
  as permissive
  for update
  to public
using ((auth.uid() IS NOT NULL));



  create policy "Users can insert reports"
  on "public"."reports"
  as permissive
  for insert
  to public
with check ((reporter_id = auth.uid()));



  create policy "Users can view own reports"
  on "public"."reports"
  as permissive
  for select
  to public
using (((reporter_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "insert_reports"
  on "public"."reports"
  as permissive
  for insert
  to public
with check ((auth.uid() = reporter_user_id));



  create policy "own_reports"
  on "public"."reports"
  as permissive
  for select
  to public
using ((auth.uid() = reporter_user_id));



  create policy "staff_reports"
  on "public"."reports"
  as permissive
  for all
  to public
using (public.is_admin_or_moderator());



  create policy "Admins can manage roles"
  on "public"."roles"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can read active roles"
  on "public"."roles"
  as permissive
  for select
  to public
using (((is_active = true) AND (auth.uid() IS NOT NULL)));



  create policy "Admins can view security logs"
  on "public"."security"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "security_alerts_admin_access"
  on "public"."security_alerts"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "security_audit_logs_admin_all"
  on "public"."security_audit_logs"
  as permissive
  for all
  to public
using (false);



  create policy "security_audit_logs_own_data"
  on "public"."security_audit_logs"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "security_configurations_admin_access"
  on "public"."security_configurations"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Staff can view all security events"
  on "public"."security_events"
  as permissive
  for select
  to public
using ((auth.role() = 'admin'::text));



  create policy "Users can view own security events"
  on "public"."security_events"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "insert_security_events"
  on "public"."security_events"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "security_events_admin_access"
  on "public"."security_events"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "security_events_own_data"
  on "public"."security_events"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "security_flags_admin_all"
  on "public"."security_flags"
  as permissive
  for all
  to public
using (false);



  create policy "security_flags_own_data"
  on "public"."security_flags"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "insert_security_logs"
  on "public"."security_logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_security_logs"
  on "public"."security_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "staff_security_logs"
  on "public"."security_logs"
  as permissive
  for all
  to public
using (public.is_admin_or_moderator());



  create policy "Users can update own sessions"
  on "public"."sessions"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users can view own sessions"
  on "public"."sessions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "staking_records_own_data"
  on "public"."staking_records"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "stories_own_all"
  on "public"."stories"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "stories_public_read"
  on "public"."stories"
  as permissive
  for select
  to public
using ((is_public = true));



  create policy "delete_story_comments"
  on "public"."story_comments"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "insert_story_comments"
  on "public"."story_comments"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "story_comments_own_all"
  on "public"."story_comments"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "story_comments_public_read"
  on "public"."story_comments"
  as permissive
  for select
  to public
using ((is_deleted = false));



  create policy "update_story_comments"
  on "public"."story_comments"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "delete_story_likes"
  on "public"."story_likes"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "insert_story_likes"
  on "public"."story_likes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "story_likes_own_data"
  on "public"."story_likes"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "story_likes_public_read"
  on "public"."story_likes"
  as permissive
  for select
  to public
using (true);



  create policy "story_reports_admin_read"
  on "public"."story_reports"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));



  create policy "story_reports_own_data"
  on "public"."story_reports"
  as permissive
  for all
  to public
using ((reporter_user_id = auth.uid()));



  create policy "insert_story_shares"
  on "public"."story_shares"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "story_shares_own_data"
  on "public"."story_shares"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "story_shares_public_read"
  on "public"."story_shares"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can view stripe events"
  on "public"."stripe_events"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "Users can see their own subscription"
  on "public"."subscribers"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "summary_feedback_insert_own"
  on "public"."summary_feedback"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "summary_feedback_select_own"
  on "public"."summary_feedback"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.chat_summaries cs
     JOIN public.chat_members cm ON ((cm.room_id = cs.chat_id)))
  WHERE ((cs.id = summary_feedback.summary_id) AND (cm.profile_id = auth.uid())))));



  create policy "summary_feedback_update_own"
  on "public"."summary_feedback"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "summary_requests_insert_service"
  on "public"."summary_requests"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "summary_requests_select_own"
  on "public"."summary_requests"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can insert interests"
  on "public"."swinger_interests"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Admins can manage interests"
  on "public"."swinger_interests"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can update interests"
  on "public"."swinger_interests"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true)))));



  create policy "Everyone can view active interests"
  on "public"."swinger_interests"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Los intereses son públicos para lectura"
  on "public"."swinger_interests"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Users can view all interests"
  on "public"."swinger_interests"
  as permissive
  for select
  to public
using (((is_active = true) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "System can insert metrics"
  on "public"."system_metrics"
  as permissive
  for insert
  to public
with check (true);



  create policy "insert_testnet_token_claims"
  on "public"."testnet_token_claims"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "threat_detections_admin_access"
  on "public"."threat_detections"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true)))));



  create policy "System can insert analytics"
  on "public"."token_analytics"
  as permissive
  for insert
  to public
with check (true);



  create policy "token_analytics_admin_only"
  on "public"."token_analytics"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "insert_token_transactions"
  on "public"."token_transactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_token_transactions"
  on "public"."token_transactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "token_transactions_own_data"
  on "public"."token_transactions"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can view active tokens"
  on "public"."tokens"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "System can insert transactions"
  on "public"."transactions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view own transactions"
  on "public"."transactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own 2FA settings"
  on "public"."two_factor_auth"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can manage own 2FA"
  on "public"."two_factor_auth"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can update own 2FA settings"
  on "public"."two_factor_auth"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own 2FA settings"
  on "public"."two_factor_auth"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "two_factor_auth_own_data"
  on "public"."two_factor_auth"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can manage own 2FA settings"
  on "public"."user_2fa_settings"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own consents"
  on "public"."user_consents"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can update own consents"
  on "public"."user_consents"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users can view own consents"
  on "public"."user_consents"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "insert_user_consents"
  on "public"."user_consents"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can manage own device tokens"
  on "public"."user_device_tokens"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden actualizar sus propias preferencias explíc"
  on "public"."user_explicit_preferences"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden eliminar sus propias preferencias explícit"
  on "public"."user_explicit_preferences"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden insertar sus propias preferencias explícit"
  on "public"."user_explicit_preferences"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Los usuarios pueden ver preferencias explícitas públicas veri"
  on "public"."user_explicit_preferences"
  as permissive
  for select
  to public
using ((((privacy_level)::text = 'public'::text) AND (is_verified = true)));



  create policy "Los usuarios pueden ver sus propias preferencias explícitas"
  on "public"."user_explicit_preferences"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden actualizar sus propios intereses"
  on "public"."user_interests"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden eliminar sus propios intereses"
  on "public"."user_interests"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Los usuarios pueden insertar sus propios intereses"
  on "public"."user_interests"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Los usuarios pueden ver intereses públicos de otros"
  on "public"."user_interests"
  as permissive
  for select
  to public
using (((privacy_level)::text = 'public'::text));



  create policy "Los usuarios pueden ver sus propios intereses"
  on "public"."user_interests"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can manage own interests"
  on "public"."user_interests"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own interests"
  on "public"."user_interests"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can view public interests"
  on "public"."user_interests"
  as permissive
  for select
  to public
using (((privacy_level)::text = 'public'::text));



  create policy "Users can manage own likes"
  on "public"."user_likes"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can view own likes"
  on "public"."user_likes"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (liked_user_id = auth.uid())));



  create policy "Users can insert own NFTs"
  on "public"."user_nfts"
  as permissive
  for insert
  to public
with check (((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can update own NFTs"
  on "public"."user_nfts"
  as permissive
  for update
  to public
using (((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can view own NFTs"
  on "public"."user_nfts"
  as permissive
  for select
  to public
using ((((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "Users can manage own notification preferences"
  on "public"."user_notification_preferences"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own referral balance"
  on "public"."user_referral_balances"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own referral balance"
  on "public"."user_referral_balances"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own referral balance"
  on "public"."user_referral_balances"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "user_referral_balances_admin_read"
  on "public"."user_referral_balances"
  as permissive
  for all
  to public;



  create policy "user_referral_balances_own_data"
  on "public"."user_referral_balances"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Admins can manage all roles"
  on "public"."user_roles"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (ur.is_active = true)))));



  create policy "Users can view own roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "user_sessions_own_data"
  on "public"."user_sessions"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "System can insert staking"
  on "public"."user_staking"
  as permissive
  for insert
  to public
with check (true);



  create policy "System can manage staking"
  on "public"."user_staking"
  as permissive
  for all
  to public
with check (true);



  create policy "Users can update own staking"
  on "public"."user_staking"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own staking"
  on "public"."user_staking"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Moderators can manage suspensions"
  on "public"."user_suspensions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.moderators m
  WHERE ((m.user_id = auth.uid()) AND (m.is_active = true)))));



  create policy "Moderators can view all suspensions"
  on "public"."user_suspensions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.moderators m
  WHERE ((m.user_id = auth.uid()) AND (m.is_active = true)))));



  create policy "Users can view their own suspensions"
  on "public"."user_suspensions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "insert_user_token_balances"
  on "public"."user_token_balances"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "own_user_token_balances"
  on "public"."user_token_balances"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "user_token_balances_own_data"
  on "public"."user_token_balances"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can insert their own tokens"
  on "public"."user_tokens"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own tokens"
  on "public"."user_tokens"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own tokens"
  on "public"."user_tokens"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own tokens"
  on "public"."user_tokens"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own tokens"
  on "public"."user_tokens"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "insert_user_wallets"
  on "public"."user_wallets"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "update_user_wallets"
  on "public"."user_wallets"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can create virtual events"
  on "public"."virtual_events"
  as permissive
  for insert
  to public
with check ((auth.uid() = created_by));



  create policy "Users can update own virtual events"
  on "public"."virtual_events"
  as permissive
  for update
  to public
using ((auth.uid() = created_by));



  create policy "Users can view active virtual events"
  on "public"."virtual_events"
  as permissive
  for select
  to public
using ((status = 'active'::text));



  create policy "Users can view virtual events"
  on "public"."virtual_events"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can view all web vitals"
  on "public"."web_vitals_history"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "System can insert web vitals"
  on "public"."web_vitals_history"
  as permissive
  for insert
  to public
with check (true);



  create policy "System can create rewards"
  on "public"."worldid_rewards"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update own rewards claim"
  on "public"."worldid_rewards"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own rewards"
  on "public"."worldid_rewards"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can manage statistics"
  on "public"."worldid_statistics"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Everyone can view statistics"
  on "public"."worldid_statistics"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can view all verifications"
  on "public"."worldid_verifications"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can insert own verifications"
  on "public"."worldid_verifications"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view own verifications"
  on "public"."worldid_verifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can manage banners"
  on "public"."banner_config"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can create couple NFT requests"
  on "public"."couple_nft_requests"
  as permissive
  for insert
  to public
with check (((auth.uid())::text IN ( SELECT (user_wallets.user_id)::text AS user_id
   FROM public.user_wallets
  WHERE ((user_wallets.address)::text = (couple_nft_requests.initiator_address)::text))));



  create policy "Users can insert couple requests for their wallets"
  on "public"."couple_nft_requests"
  as permissive
  for insert
  to public
with check (((initiator_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can update couple requests involving their wallets"
  on "public"."couple_nft_requests"
  as permissive
  for update
  to public
using ((((partner1_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR ((partner2_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid())))));



  create policy "Users can view couple requests involving their wallets"
  on "public"."couple_nft_requests"
  as permissive
  for select
  to public
using ((((partner1_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR ((partner2_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid())))));



  create policy "Users can view their couple NFT requests"
  on "public"."couple_nft_requests"
  as permissive
  for select
  to public
using (((auth.uid())::text IN ( SELECT (user_wallets.user_id)::text AS user_id
   FROM public.user_wallets
  WHERE ((user_wallets.address)::text = ANY ((ARRAY[couple_nft_requests.partner1_address, couple_nft_requests.partner2_address])::text[])))));



  create policy "own_couple_nft_requests"
  on "public"."couple_nft_requests"
  as permissive
  for all
  to public
using ((((initiator_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR ((partner1_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR ((partner2_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid())))))
with check ((((initiator_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR ((partner1_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))) OR ((partner2_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid())))));



  create policy "Users can insert their own NFT staking"
  on "public"."nft_staking"
  as permissive
  for insert
  to public
with check (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can update their own NFT staking"
  on "public"."nft_staking"
  as permissive
  for update
  to public
using (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can view their own NFT staking"
  on "public"."nft_staking"
  as permissive
  for select
  to public
using (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "own_nft_staking"
  on "public"."nft_staking"
  as permissive
  for all
  to public
using (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))))
with check (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can update own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Users can view own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "Demo users access demo profiles"
  on "public"."profiles"
  as permissive
  for all
  to public
using (((user_id = auth.uid()) OR ((is_demo = true) AND (COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'is_demo'::text))::boolean, false) = true))))
with check (((user_id = auth.uid()) OR ((is_demo = true) AND (COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'is_demo'::text))::boolean, false) = true))));



  create policy "Real users access real profiles"
  on "public"."profiles"
  as permissive
  for all
  to public
using (((user_id = auth.uid()) OR ((is_demo = false) AND (COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'is_demo'::text))::boolean, false) = false))))
with check (((user_id = auth.uid()) OR ((is_demo = false) AND (COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'is_demo'::text))::boolean, false) = false))));



  create policy "Users can insert their own token staking"
  on "public"."token_staking"
  as permissive
  for insert
  to public
with check (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can update their own token staking"
  on "public"."token_staking"
  as permissive
  for update
  to public
using (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can view their own token staking"
  on "public"."token_staking"
  as permissive
  for select
  to public
using (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "own_token_staking"
  on "public"."token_staking"
  as permissive
  for all
  to public
using (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))))
with check (((user_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can insert NFTs for their wallets"
  on "public"."user_nfts"
  as permissive
  for insert
  to public
with check (((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can view NFTs by wallet address"
  on "public"."user_nfts"
  as permissive
  for select
  to public
using (((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can view their NFTs"
  on "public"."user_nfts"
  as permissive
  for select
  to public
using (((auth.uid())::text IN ( SELECT (user_wallets.user_id)::text AS user_id
   FROM public.user_wallets
  WHERE ((user_wallets.address)::text = ANY ((ARRAY[user_nfts.owner_address, user_nfts.partner_address])::text[])))));



  create policy "own_user_nfts"
  on "public"."user_nfts"
  as permissive
  for all
  to public
using (((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))))
with check (((owner_address)::text IN ( SELECT user_wallets.address
   FROM public.user_wallets
  WHERE (user_wallets.user_id = auth.uid()))));



  create policy "Users can insert their own wallets"
  on "public"."user_wallets"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can update their own wallets"
  on "public"."user_wallets"
  as permissive
  for update
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));



  create policy "Users can view their own wallets"
  on "public"."user_wallets"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.is_active = true))))));


CREATE TRIGGER trigger_ai_scores_updated_at BEFORE UPDATE ON public.ai_compatibility_scores FOR EACH ROW EXECUTE FUNCTION public.update_ai_scores_updated_at();

CREATE TRIGGER automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_automation_rules_updated_at();

CREATE TRIGGER trigger_banner_config_timestamp BEFORE UPDATE ON public.banner_config FOR EACH ROW EXECUTE FUNCTION public.update_banner_config_timestamp();

CREATE TRIGGER update_career_applications_updated_at BEFORE UPDATE ON public.career_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_chat_summaries_updated_at BEFORE UPDATE ON public.chat_summaries FOR EACH ROW EXECUTE FUNCTION public.update_chat_summaries_updated_at();

CREATE TRIGGER trigger_update_club_ratings AFTER INSERT OR DELETE OR UPDATE ON public.club_reviews FOR EACH ROW EXECUTE FUNCTION public.update_club_ratings();

CREATE TRIGGER trigger_award_cmpx_tokens_on_purchase BEFORE UPDATE ON public.cmpx_purchases FOR EACH ROW EXECUTE FUNCTION public.award_cmpx_tokens_on_purchase();

CREATE TRIGGER trigger_update_comment_likes_count AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER update_comment_likes_count_trigger AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

CREATE TRIGGER update_consent_verifications_updated_at BEFORE UPDATE ON public.consent_verifications FOR EACH ROW EXECUTE FUNCTION public.update_consent_verifications_updated_at();

CREATE TRIGGER agreement_complete_check BEFORE UPDATE ON public.couple_agreements FOR EACH ROW EXECUTE FUNCTION public.check_agreement_complete();

CREATE TRIGGER couple_agreements_update_timestamp BEFORE UPDATE ON public.couple_agreements FOR EACH ROW EXECUTE FUNCTION public.update_couple_agreements_timestamp();

CREATE TRIGGER trigger_auto_forfeit_disputes BEFORE UPDATE ON public.couple_agreements FOR EACH ROW EXECUTE FUNCTION public.auto_forfeit_expired_disputes();

CREATE TRIGGER trigger_complete_couple_agreement BEFORE UPDATE ON public.couple_agreements FOR EACH ROW EXECUTE FUNCTION public.complete_couple_agreement();

CREATE TRIGGER update_couple_statistics_trigger AFTER INSERT ON public.couple_interactions FOR EACH ROW EXECUTE FUNCTION public.update_couple_statistics();

CREATE TRIGGER create_couple_match_trigger AFTER INSERT ON public.couple_profile_likes FOR EACH ROW EXECUTE FUNCTION public.create_couple_match();

CREATE TRIGGER update_couple_profile_reports_updated_at BEFORE UPDATE ON public.couple_profile_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_couple_profile_views_viewed_date BEFORE INSERT OR UPDATE ON public.couple_profile_views FOR EACH ROW EXECUTE FUNCTION public.update_viewed_date();

CREATE TRIGGER trigger_update_fingerprint_last_seen BEFORE UPDATE ON public.digital_fingerprints FOR EACH ROW WHEN (((old.combined_hash)::text = (new.combined_hash)::text)) EXECUTE FUNCTION public.update_fingerprint_last_seen();

CREATE TRIGGER update_explicit_preferences_updated_at BEFORE UPDATE ON public.explicit_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_gallery_commissions_updated_at BEFORE UPDATE ON public.gallery_commissions FOR EACH ROW EXECUTE FUNCTION public.update_gallery_commissions_updated_at();

CREATE TRIGGER update_gallery_permissions_updated_at BEFORE UPDATE ON public.gallery_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON public.images FOR EACH ROW EXECUTE FUNCTION public.update_images_updated_at();

CREATE TRIGGER trigger_investment_returns AFTER UPDATE OF status ON public.investments FOR EACH ROW WHEN (((new.status = 'active'::text) AND (old.status <> 'active'::text))) EXECUTE FUNCTION public.trigger_create_investment_returns();

CREATE TRIGGER trigger_invitation_statistics_updated_at BEFORE UPDATE ON public.invitation_statistics FOR EACH ROW EXECUTE FUNCTION public.update_invitation_statistics_updated_at();

CREATE TRIGGER update_invitation_templates_updated_at BEFORE UPDATE ON public.invitation_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER media_updated_at_trigger BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.update_media_updated_at();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_mfa_settings_updated_at BEFORE UPDATE ON public.mfa_settings FOR EACH ROW EXECUTE FUNCTION public.update_mfa_settings_updated_at();

CREATE TRIGGER update_moderator_requests_updated_at BEFORE UPDATE ON public.moderator_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_moderator_session_minutes BEFORE UPDATE ON public.moderator_sessions FOR EACH ROW EXECUTE FUNCTION public.update_moderator_session_minutes();

CREATE TRIGGER update_moderators_updated_at BEFORE UPDATE ON public.moderators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_monitoring_session_end BEFORE UPDATE ON public.monitoring_sessions FOR EACH ROW EXECUTE FUNCTION public.update_monitoring_session_end();

CREATE TRIGGER update_nft_galleries_updated_at BEFORE UPDATE ON public.nft_galleries FOR EACH ROW EXECUTE FUNCTION public.update_nft_galleries_updated_at();

CREATE TRIGGER update_nft_gallery_images_updated_at BEFORE UPDATE ON public.nft_gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_nft_galleries_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_post_comments_count AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER trigger_update_post_likes_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER trigger_update_post_shares_count AFTER INSERT OR DELETE ON public.post_shares FOR EACH ROW EXECUTE FUNCTION public.update_post_shares_count();

CREATE TRIGGER update_referral_statistics_updated_at BEFORE UPDATE ON public.referral_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_set_updated_at_reports BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_reports();

CREATE TRIGGER sync_stories_media_url_trigger BEFORE INSERT OR UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.sync_stories_media_url();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_comments_count_trigger AFTER INSERT OR DELETE ON public.story_comments FOR EACH ROW EXECUTE FUNCTION public.update_story_comments_count();

CREATE TRIGGER update_story_likes_count_trigger AFTER INSERT OR DELETE ON public.story_likes FOR EACH ROW EXECUTE FUNCTION public.update_story_likes_count();

CREATE TRIGGER update_story_reports_updated_at BEFORE UPDATE ON public.story_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_shares_count_trigger AFTER INSERT OR DELETE ON public.story_shares FOR EACH ROW EXECUTE FUNCTION public.update_story_shares_count();

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swinger_interests_updated_at BEFORE UPDATE ON public.swinger_interests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swinger_interests_updated_at_trigger BEFORE UPDATE ON public.swinger_interests FOR EACH ROW EXECUTE FUNCTION public.update_swinger_interests_updated_at();

CREATE TRIGGER update_token_analytics_updated_at BEFORE UPDATE ON public.token_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_balance_after_transaction AFTER INSERT ON public.token_transactions FOR EACH ROW EXECUTE FUNCTION public.update_user_token_balance();

CREATE TRIGGER trg_set_updated_at_tokens BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_tokens();

CREATE TRIGGER audit_large_transactions AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.audit_suspicious_transactions();

CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON public.two_factor_auth FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_2fa_settings_updated_at BEFORE UPDATE ON public.user_2fa_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER expire_old_sessions_trigger AFTER INSERT ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.expire_old_sessions();

CREATE TRIGGER update_user_suspensions_updated_at BEFORE UPDATE ON public.user_suspensions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_user_tokens_referral_code BEFORE INSERT ON public.user_tokens FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

CREATE TRIGGER update_user_tokens_timestamp BEFORE UPDATE ON public.user_tokens FOR EACH ROW EXECUTE FUNCTION public.update_user_tokens_updated_at();

CREATE TRIGGER update_worldid_statistics_updated_at_trigger BEFORE UPDATE ON public.worldid_statistics FOR EACH ROW EXECUTE FUNCTION public.update_worldid_statistics_updated_at();

CREATE TRIGGER grant_worldid_verification_reward_trigger AFTER INSERT ON public.worldid_verifications FOR EACH ROW EXECUTE FUNCTION public.grant_worldid_verification_reward();

CREATE TRIGGER update_worldid_verifications_updated_at_trigger BEFORE UPDATE ON public.worldid_verifications FOR EACH ROW EXECUTE FUNCTION public.update_worldid_verifications_updated_at();

CREATE TRIGGER create_user_tokens_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_tokens();

CREATE TRIGGER trigger_create_user_tokens AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_tokens();


