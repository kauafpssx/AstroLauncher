use crate::domain::entities::InstalledMod;
use crate::domain::errors::InstanceError;

pub type Result<T> = std::result::Result<T, InstanceError>;

pub trait ModRepository: Send + Sync {
    fn find_by_instance(&self, instance_id: &str) -> Result<Vec<InstalledMod>>;
    fn find_by_instance_and_kind(&self, instance_id: &str, kind: &str) -> Result<Vec<InstalledMod>>;
    fn save(&self, installed_mod: &InstalledMod) -> Result<()>;
    fn delete(&self, id: &str) -> Result<()>;
    fn set_enabled(&self, id: &str, enabled: bool) -> Result<()>;
}
