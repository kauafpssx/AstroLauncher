use super::*;

#[test]
fn zero_content_returns_vanilla_defaults() {
    assert_eq!(suggest_memory_mb(0), (2048, 4096));
}

#[test]
fn one_item_nudges_the_suggestion_up() {
    assert_eq!(suggest_memory_mb(1), (2068, 4136));
}

#[test]
fn just_below_the_cap_scales_linearly() {
    // 204 * 40 = 8160, just under the 8192 extra-bytes cap.
    assert_eq!(suggest_memory_mb(204), (6128, 12256));
}

#[test]
fn at_and_beyond_the_cap_saturates() {
    // 205 * 40 = 8200, clamped to the 8192 cap — max_mb hits its own
    // 12288 ceiling here too, so this is also the heuristic's plateau.
    assert_eq!(suggest_memory_mb(205), (6144, 12288));
    assert_eq!(suggest_memory_mb(10_000), (6144, 12288));
}
