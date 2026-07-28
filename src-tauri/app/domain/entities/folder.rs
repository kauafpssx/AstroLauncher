#[derive(Debug, Clone, PartialEq)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub position: i64,
    pub collapsed: bool,
}

impl Folder {
    pub fn new(name: String, position: i64) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            position,
            collapsed: false,
        }
    }
}
