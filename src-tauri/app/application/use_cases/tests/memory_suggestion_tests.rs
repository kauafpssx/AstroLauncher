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
    assert_eq!(suggest_memory_mb(204), (6128, 12256));
}

#[test]
fn at_and_beyond_the_cap_saturates() {
    assert_eq!(suggest_memory_mb(205), (6144, 12288));
    assert_eq!(suggest_memory_mb(10_000), (6144, 12288));
}
