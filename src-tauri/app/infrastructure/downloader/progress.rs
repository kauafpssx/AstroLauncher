use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct ProgressUpdate {
    pub stage: String,
    pub current_item: String,
    pub stage_current: u64,
    pub stage_total: u64,
    pub overall_current: u64,
    pub overall_total: u64,
}

/// Tracks bytes downloaded across the whole launch pipeline (client + libraries
/// + assets) and reports a snapshot every time an item finishes. Kept
/// infra-local (no application DTO knowledge) — the use case maps updates to
/// whatever event type the presentation layer expects.
#[derive(Clone)]
pub struct ProgressReporter {
    overall_done: Arc<AtomicU64>,
    overall_total: u64,
    emit: Arc<dyn Fn(ProgressUpdate) + Send + Sync>,
}

impl ProgressReporter {
    pub fn new(overall_total: u64, emit: Arc<dyn Fn(ProgressUpdate) + Send + Sync>) -> Self {
        Self { overall_done: Arc::new(AtomicU64::new(0)), overall_total, emit }
    }

    pub fn report_item(&self, stage: &str, item: &str, size: u64, stage_current: u64, stage_total: u64) {
        let overall_current = self.overall_done.fetch_add(size, Ordering::Relaxed) + size;
        (self.emit)(ProgressUpdate {
            stage: stage.to_string(),
            current_item: item.to_string(),
            stage_current,
            stage_total,
            overall_current,
            overall_total: self.overall_total,
        });
    }
}
