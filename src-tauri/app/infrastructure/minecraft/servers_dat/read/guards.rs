use std::io::{self, Read};

use super::super::*;
use super::primitives::*;

const MAX_DEPTH: u32 = 512;

const MAX_LIST_LEN: u64 = 100_000;

pub(super) fn validate_list(elem_type: u8, len: u64) -> io::Result<()> {
    if elem_type == TAG_END && len > 0 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "non-empty TAG_END list",
        ));
    }
    if len > MAX_LIST_LEN {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "NBT list too long",
        ));
    }
    Ok(())
}

pub(super) fn checked_len(r: &mut impl Read) -> io::Result<u64> {
    let len = read_i32(r)?;
    if len < 0 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "negative NBT length",
        ));
    }
    Ok(len as u64)
}

fn skip_bytes(r: &mut impl Read, n: u64) -> io::Result<()> {
    let copied = io::copy(&mut r.by_ref().take(n), &mut io::sink())?;
    if copied < n {
        return Err(io::ErrorKind::UnexpectedEof.into());
    }
    Ok(())
}

pub(super) fn skip_payload(r: &mut impl Read, tag: u8, depth: u32) -> io::Result<()> {
    if depth > MAX_DEPTH {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "NBT nesting too deep",
        ));
    }
    match tag {
        TAG_END => {}
        TAG_BYTE => {
            read_u8(r)?;
        }
        TAG_SHORT => {
            read_u16(r)?;
        }
        TAG_INT | TAG_FLOAT => {
            read_i32(r)?;
        }
        TAG_LONG | TAG_DOUBLE => {
            read_i64(r)?;
        }
        TAG_BYTE_ARRAY => {
            let len = checked_len(r)?;
            skip_bytes(r, len)?;
        }
        TAG_STRING => {
            read_string(r)?;
        }
        TAG_LIST => {
            let elem_type = read_u8(r)?;
            let len = checked_len(r)?;
            validate_list(elem_type, len)?;
            for _ in 0..len {
                skip_payload(r, elem_type, depth + 1)?;
            }
        }
        TAG_COMPOUND => loop {
            let t = read_u8(r)?;
            if t == TAG_END {
                break;
            }
            read_string(r)?;
            skip_payload(r, t, depth + 1)?;
        },
        TAG_INT_ARRAY => {
            let len = checked_len(r)?;
            skip_bytes(r, len.saturating_mul(4))?;
        }
        TAG_LONG_ARRAY => {
            let len = checked_len(r)?;
            skip_bytes(r, len.saturating_mul(8))?;
        }
        _ => {}
    }
    Ok(())
}
