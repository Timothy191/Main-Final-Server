// arch-engine/rust-utils/src/lib.rs

use std::fs;
use std::path::Path;

#[derive(Debug)]
pub struct RepoMetrics {
    pub file_count: u32,
    pub total_size_bytes: u64,
}

/// Recursively walk directories to collect file counts and total byte sizes.
/// Bypasses node_modules, .git, .next, and .turbo caches.
pub fn scan_directory(dir: &Path) -> std::io::Result<RepoMetrics> {
    let mut file_count = 0;
    let mut total_size_bytes = 0;

    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if name == "node_modules" || name == ".git" || name == ".next" || name == ".turbo" {
                    continue;
                }
                let sub = scan_directory(&path)?;
                file_count += sub.file_count;
                total_size_bytes += sub.total_size_bytes;
            } else {
                file_count += 1;
                if let Ok(metadata) = entry.metadata() {
                    total_size_bytes += metadata.len();
                }
            }
        }
    }
    Ok(RepoMetrics {
        file_count,
        total_size_bytes,
    })
}

#[derive(Debug)]
pub struct LogAnomalies {
    pub line_count: usize,
    pub alerts: Vec<String>,
    pub errors: Vec<String>,
}

/// Parse a log file to extract total line count and the last N alerts/errors.
pub fn parse_log_file(log_path: &Path, max_anomalies: usize) -> std::io::Result<LogAnomalies> {
    if !log_path.exists() {
        return Ok(LogAnomalies {
            line_count: 0,
            alerts: vec![],
            errors: vec![],
        });
    }

    let content = fs::read_to_string(log_path)?;
    let lines: Vec<&str> = content.lines().collect();
    let line_count = lines.len();

    let mut alerts = Vec::new();
    let mut errors = Vec::new();

    for line in &lines {
        let l = line.trim();
        if l.contains("error") || l.contains("Err") || l.contains("Exception") || l.contains("FAIL") {
            errors.push(l.to_string());
        }
        if l.contains("warn") || l.contains("Warn") || l.contains("consecutive failures") || l.contains("CircuitBreaker") {
            alerts.push(l.to_string());
        }
    }

    // Retain only the last N items
    if alerts.len() > max_anomalies {
        alerts.drain(0..alerts.len() - max_anomalies);
    }
    if errors.len() > max_anomalies {
        errors.drain(0..errors.len() - max_anomalies);
    }

    Ok(LogAnomalies {
        line_count,
        alerts,
        errors,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan() {
        let metrics = scan_directory(Path::new(".")).unwrap();
        assert!(metrics.file_count >= 0);
    }
}
