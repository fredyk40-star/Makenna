/**
 * AppStorageKeys - the single source of truth for data owned by Makenna.
 *
 * Used by privacy erasure and offline school bundles so neither touches
 * unrelated data that happens to share the same browser origin.
 */
export const BUNDLE_DATA_KEYS = [
  'makenna_child_accounts_v2',
  'makenna_active_child_id',
  'makenna_gamification_state',
  'makenna_analytics_events',
  'makenna_analytics_config',
  'makenna_daily_missions',
  'makenna_revision_plans',
  'makenna_rewards_store',
  'makenna_selected_avatar',
  'makenna_achievements',
  'makenna_safe_mode_settings',
  'makenna_time_limits',
  'makenna_classes_v1',
  'makenna_assignments_v1',
  'makenna_teacher_v1',
  'makenna_teacher_data',
  'makenna_class_data',
  'makenna_ghana_curriculum_v1',
  'makenna_portfolio_v1',
  'makenna_certificates_v1',
  'makenna_sticker_book_v1',
  'makenna_revision_planner_v1',
  'makenna_parent_tutor_settings_v1',
  'makenna_camera_hunt_v1',
];

export const DATA_KEYS = BUNDLE_DATA_KEYS;

const APP_KEY_PATTERNS = [
  /^makenna_/,
  /^drawing_gallery$/,
  /^shape_(progress|favorites)/,
  /^colour_(progress|favorites)/,
  /^music_(progress|game_favorites)/,
  /^game_(progress|achievements|stats|favorites)/,
  /^reading_(analytics|progress)/,
  /^adaptive_learning_data$/,
  /^word_builder_data$/,
  /^story_engine_data$/,
  /^bible_(completed|verses)$/,
  /^science_(completed|facts)$/,
  /^parent_(time_limit|locked_days)$/,
  /^daily_song_\d{4}-\d{2}-\d{2}$/,
  /^audio_settings$/,
  /^numbers_(progress|assessment_data)/,
  /^alphabet_progress$/,
  /^tracing_progress$/,
  /^user_profiles$/,
  /^active_profile_id$/,
  /^theme$/,
  /^makenna_locale$/,
];

export const isAppStorageKey = (key) => {
  if (typeof key !== 'string' || !key) return false;
  if (BUNDLE_DATA_KEYS.includes(key)) return true;
  return APP_KEY_PATTERNS.some(pattern => pattern.test(key));
};

export const listAppStorageKeys = () => (
  typeof localStorage === 'undefined'
    ? []
    : Object.keys(localStorage).filter(isAppStorageKey)
);

export default { BUNDLE_DATA_KEYS, DATA_KEYS, isAppStorageKey, listAppStorageKeys };
