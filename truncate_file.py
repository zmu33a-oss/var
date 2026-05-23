path = r'F:\Users\Xtik\WEBPLUS.worktrees\agents-assistant-comparison-between-assistants\src\screens\XFeedScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

marker_idx = next((i for i, l in enumerate(lines) if 'MARKER_END' in l), None)
print(f'MARKER_END at line index: {marker_idx} (1-based: {marker_idx+1})')

kept = lines[:marker_idx]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(kept)

print(f'Done. Kept {len(kept)} lines.')
