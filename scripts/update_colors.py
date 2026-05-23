import os
import re

# Mapping of hardcoded colors to semantic Tailwind classes
REPLACEMENTS = [
    # Backgrounds
    ('bg-[#020617]', 'bg-background'),
    ('bg-[#0F172A]', 'bg-card'),
    ('bg-[#1E293B]', 'bg-muted'),
    ('bg-[#162032]', 'bg-muted'),
    ('bg-[#334155]', 'bg-muted'),

    # Text
    ('text-[#F8FAFC]', 'text-foreground'),
    ('text-[#94A3B8]', 'text-muted-foreground'),
    ('text-[#64748B]', 'text-muted-foreground'),
    ('text-[#CBD5E1]', 'text-muted-foreground'),

    # Borders
    ('border-[#334155]', 'border-border'),
    ('border-slate-700/30', 'border-border'),
    ('border-slate-700/50', 'border-input'),

    # Interactive states
    ('hover:text-[#F8FAFC]', 'hover:text-foreground'),
    ('hover:bg-[#162032]', 'hover:bg-muted'),
    ('focus:border-[#3B82F6]', 'focus:border-primary'),

    # Common rgba patterns that map to semantic colors
    ('bg-[rgba(168,85,247,0.15)]', 'bg-[rgba(168,85,247,0.15)]'),  # keep purple
    ('border-[rgba(168,85,247,0.3)]', 'border-[rgba(168,85,247,0.3)]'),  # keep purple
    ('bg-[rgba(6,182,212,0.15)]', 'bg-accent/15'),
    ('border-[rgba(6,182,212,0.3)]', 'border-accent/30'),
    ('bg-[rgba(34,197,94,0.1)]', 'bg-[rgba(34,197,94,0.1)]'),  # keep green
    ('hover:bg-[rgba(239,68,68,0.1)]', 'hover:bg-destructive/10'),

    # Specific text colors that should use semantic classes
    ('text-[#3B82F6]', 'text-primary'),
    ('text-[#06B6D4]', 'text-accent'),
    ('text-[#EF4444]', 'text-destructive'),
    ('text-[#A855F7]', 'text-[#A855F7]'),  # keep purple
    ('text-[#22C55E]', 'text-[#22C55E]'),  # keep green

    # Button/action backgrounds
    ('bg-[#3B82F6]', 'bg-primary'),
    ('bg-[#06B6D4]', 'bg-accent'),
    ('hover:bg-[#2563EB]', 'hover:bg-primary/90'),
    ('hover:bg-[#06B6D4]/90', 'hover:bg-accent/90'),

    # Input backgrounds
    ('bg-[#1E293B]', 'bg-muted'),

    # Placeholder
    ('placeholder:text-[#64748B]', 'placeholder:text-muted-foreground'),

    # Divider backgrounds
    ('bg-[#334155]/50', 'bg-border/50'),

    # Specific border colors
    ('border-[#3B82F6]', 'border-primary'),
    ('border-[#06B6D4]', 'border-accent'),

    # Shadow and other static utilities that reference dark colors
    ('text-white', 'text-primary-foreground'),  # mostly for buttons
]

# Files that were already manually updated - skip them
SKIP_FILES = {
    'index.css',
    'App.tsx',
    'Layout.tsx',
    'Navbar.tsx',
    'Sidebar.tsx',
    'Footer.tsx',
    'PageHeader.tsx',
    'Login.tsx',
    'Settings.tsx',
    'ThemeContext.tsx',
}

SRC_DIR = '/Users/yaoxiong/Downloads/下载文件/Compressed/app/src'


def process_file(filepath):
    filename = os.path.basename(filepath)
    if filename in SKIP_FILES:
        print(f'Skipping {filename} (already updated)')
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changes = []

    for old, new in REPLACEMENTS:
        if old == new:
            continue
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            changes.append(f'  {old} -> {new} ({count}x)')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filename}:')
        for c in changes:
            print(c)
    else:
        print(f'No changes in {filename}')


def main():
    for root, dirs, files in os.walk(SRC_DIR):
        # Skip node_modules and other non-source dirs
        dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', 'dist', 'build'}]

        for filename in files:
            if filename.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, filename)
                process_file(filepath)


if __name__ == '__main__':
    main()
