use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Rule {
    pub action: String,
    pub os: Option<OsRule>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OsRule {
    pub name: Option<String>,
}

fn current_os_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "osx"
    } else {
        "linux"
    }
}

/// Evaluates a Mojang version-manifest rule list against the current OS.
/// Absent rules means "always allowed" (Mojang's own convention).
pub fn rules_allow(rules: &Option<Vec<Rule>>) -> bool {
    let Some(rules) = rules else { return true };

    let mut allowed = false;
    for rule in rules {
        let os_matches = rule
            .os
            .as_ref()
            .and_then(|os| os.name.as_deref())
            .map(|name| name == current_os_name())
            .unwrap_or(true);

        if os_matches {
            allowed = rule.action == "allow";
        }
    }
    allowed
}
