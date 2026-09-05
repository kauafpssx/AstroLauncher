use std::collections::HashMap;
use std::process::Child;
use std::sync::Arc;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use parking_lot::Mutex;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct ProcessManager {
    pids: Mutex<HashMap<String, u32>>,
}

impl ProcessManager {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            pids: Mutex::new(HashMap::new()),
        })
    }

    pub fn register(
        self: &Arc<Self>,
        instance_id: String,
        mut child: Child,
        on_exit: Arc<dyn Fn(&str) + Send + Sync>,
    ) {
        self.pids.lock().insert(instance_id.clone(), child.id());

        let manager = self.clone();
        tokio::task::spawn_blocking(move || {
            let _ = child.wait();
            manager.pids.lock().remove(&instance_id);
            (*on_exit)(&instance_id);
        });
    }

    pub fn is_running(&self, instance_id: &str) -> bool {
        self.pids.lock().contains_key(instance_id)
    }

    pub fn stop(&self, instance_id: &str) -> anyhow::Result<()> {
        let pid = *self
            .pids
            .lock()
            .get(instance_id)
            .ok_or_else(|| anyhow::anyhow!("Instância não está em execução"))?;
        kill_pid(pid)
    }
}

fn kill_pid(pid: u32) -> anyhow::Result<()> {
    let status = if cfg!(target_os = "windows") {
        let mut cmd = std::process::Command::new("taskkill");
        cmd.args(["/PID", &pid.to_string(), "/T", "/F"]);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.status()?
    } else {
        std::process::Command::new("kill")
            .args(["-9", &pid.to_string()])
            .status()?
    };

    if status.success() {
        Ok(())
    } else {
        Err(anyhow::anyhow!(
            "Falha ao encerrar o processo (código {status})"
        ))
    }
}
