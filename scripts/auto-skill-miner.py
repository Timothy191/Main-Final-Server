#!/usr/bin/env python3
"""
Auto-Skill Miner & Refiner
Scans the session database (.crush/crush.db) and shared agent knowledge base
(.cursor/agents/_shared/references/knowledge-base.md) to:
  1. Identify new repeated actions (3+ times) and create new skills.
  2. Refine existing skills by patching lessons learned and usage counts.
"""

import os
import sqlite3
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / ".crush" / "crush.db"
KB_PATH = ROOT / ".cursor" / "agents" / "_shared" / "references" / "knowledge-base.md"
SKILLS_DIR = ROOT / ".cursor" / "skills"
SKILL_MANAGE = ROOT / ".cursor" / "skills" / "skill-self-improve" / "scripts" / "skill-manage.sh"

def get_recent_prompts():
    """Query recent user prompts from sqlite db."""
    if not DB_PATH.exists():
        return []
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        # Fetch the last 100 user messages
        cursor.execute("SELECT parts FROM messages WHERE role = 'user' ORDER BY created_at DESC LIMIT 100")
        rows = cursor.fetchall()
        prompts = []
        for row in rows:
            parts = row[0]
            # parts is stored as a JSON array or text
            if parts.startswith("[") or parts.startswith("{"):
                # Clean simple extraction
                match = re.search(r'"text"\s*:\s*"([^"]+)"', parts)
                if match:
                    prompts.append(match.group(1))
            else:
                prompts.append(parts)
        conn.close()
        return prompts
    except Exception as e:
        print(f"[Miner] DB read error: {e}")
        return []

def scan_knowledge_base():
    """Parse knowledge base for observed practices."""
    if not KB_PATH.exists():
        return []
    content = KB_PATH.read_text(encoding="utf-8")
    # Find bullet points starting with * or - under sections
    points = re.findall(r'^\s*[\*\-]\s*(.*)$', content, re.MULTILINE)
    return [p.strip() for p in points if p.strip()]

def mine_new_skills(prompts, kb_points):
    """Detect keywords used 3+ times to promote to new skills."""
    candidates = {}
    # Combine prompts and kb observations
    corpus = prompts + kb_points
    
    # Target operation patterns
    patterns = {
        "database-rls": [r"\brls\b", r"\brow\s+level\s+security\b", r"\baudit\s+rls\b"],
        "rate-limiting": [r"\brate\s+limit\b", r"\brate-limiter\b", r"\b429\b"],
        "environment-validation": [r"\benv\b", r"\benvironment\b", r"\bzod\s+env\b"],
        "redis-caching": [r"\bredis\b", r"\bcache\b", r"\bl2\s+cache\b"],
        "inngest-jobs": [r"\binngest\b", r"\bbackground\s+job\b", r"\btrigger\b"]
    }
    
    for text in corpus:
        text_lower = text.lower()
        for skill_name, regexes in patterns.items():
            for regex in regexes:
                if re.search(regex, text_lower):
                    candidates[skill_name] = candidates.get(skill_name, 0) + 1
                    
    # Promote if frequency >= 3 and skill doesn't exist
    for skill_name, freq in candidates.items():
        skill_path = SKILLS_DIR / skill_name
        if freq >= 3 and not skill_path.exists():
            print(f"[Miner] Promoting repeated pattern '{skill_name}' (count: {freq}) to a new skill...")
            create_skill(skill_name)

def create_skill(name):
    """Invoke skill-manage.sh to create a new skill."""
    if not SKILL_MANAGE.exists():
        return
    try:
        subprocess.run(["bash", str(SKILL_MANAGE), "create", name], check=True, cwd=str(ROOT))
        # Customize the template immediately with mined info
        skill_file = SKILLS_DIR / name / "SKILL.md"
        if skill_file.exists():
            content = skill_file.read_text(encoding="utf-8")
            # Replace TODO placeholders
            content = content.replace("TODO: when to use. Anti-trigger: TODO.", f"Use when managing {name} actions. Anti-trigger: do not use for generic tasks.")
            content = content.replace("TODO: purpose.", f"Automates and documents procedures for handling {name} successfully.")
            skill_file.write_text(content, encoding="utf-8")
            print(f"[Miner] Customised new skill '{name}' at {skill_file}")
    except Exception as e:
        print(f"[Miner] Error creating skill {name}: {e}")

def extract_auto_errors():
    kb_file = ROOT / ".cursor/agents/_shared/references/knowledge-base.md"
    if not kb_file.exists():
        return []
    errors = []
    content = kb_file.read_text(encoding="utf-8")
    if "## 5. Detected Errors & Gotchas" in content:
        parts = content.split("## 5. Detected Errors & Gotchas")
        if len(parts) > 1:
            error_lines = parts[1].strip().split("\n")
            for line in error_lines:
                if line.strip().startswith("-"):
                    err = line.strip().lstrip("-").strip()
                    if ":" in err:
                        err = err.split(":", 1)[1].strip()
                    if err:
                        errors.append(err)
    return errors

def refine_existing_skills(prompts):
    """Refine existing skills based on usage context and errors."""
    if not SKILLS_DIR.exists():
        return
    
    skills = [d.name for d in SKILLS_DIR.iterdir() if d.is_dir() and not d.name.startswith(".")]
    errors = extract_auto_errors()
    
    for skill in skills:
        skill_file = SKILLS_DIR / skill / "SKILL.md"
        if not skill_file.exists():
            continue
            
        # Count mentions of this skill's domain in recent prompts
        mentions = 0
        domain_keywords = [skill.replace("-", " "), skill]
        if skill == "provider-router":
            domain_keywords += ["provider", "key pool", "cooldown", "route"]
        elif skill == "skill-self-improve":
            domain_keywords += ["hermes", "self-improve", "refine", "distill"]
        elif skill == "redis-caching":
            domain_keywords += ["redis", "cache", "connection", "ioredis"]
            
        for prompt in prompts:
            prompt_lower = prompt.lower()
            if any(kw in prompt_lower for kw in domain_keywords):
                mentions += 1
                
        if mentions > 0:
            print(f"[Miner] Refining skill '{skill}' based on {mentions} recent uses...")
            content = skill_file.read_text(encoding="utf-8")
            usage_marker = "## Usage History"
            note = f"- Observed usage refined on: {mentions} times recently."
            if usage_marker in content:
                lines = content.split("\n")
                idx = lines.index(usage_marker)
                lines.insert(idx + 1, note)
                content = "\n".join(lines)
            else:
                content += f"\n\n{usage_marker}\n{note}\n"
            skill_file.write_text(content, encoding="utf-8")
            
        # Match errors that mention keywords from the skill
        skill_errors = []
        for err in errors:
            err_lower = err.lower()
            if any(kw in err_lower for kw in domain_keywords):
                if err not in skill_errors:
                    skill_errors.append(err)
                    
        if len(skill_errors) > 0:
            print(f"[Miner] Injecting {len(skill_errors)} auto-detected gotchas into '{skill}'...")
            content = skill_file.read_text(encoding="utf-8")
            gotchas_marker = "## Gotchas & Common Failures"
            
            if gotchas_marker in content:
                for se in skill_errors:
                    note = f"- **Auto-Detected:** {se}"
                    if note not in content:
                        lines = content.split("\n")
                        idx = lines.index(gotchas_marker)
                        lines.insert(idx + 1, note)
                        content = "\n".join(lines)
            else:
                notes = "\n".join([f"- **Auto-Detected:** {se}" for se in skill_errors])
                content += f"\n\n{gotchas_marker}\n{notes}\n"
            skill_file.write_text(content, encoding="utf-8")

def main():
    print("[Miner] Starting automatic skill mining and refinement...")
    prompts = get_recent_prompts()
    kb_points = scan_knowledge_base()
    
    print(f"[Miner] Loaded {len(prompts)} recent prompts and {len(kb_points)} knowledge base observations.")
    mine_new_skills(prompts, kb_points)
    refine_existing_skills(prompts)
    print("[Miner] Skill optimization cycle completed.")

if __name__ == "__main__":
    main()
