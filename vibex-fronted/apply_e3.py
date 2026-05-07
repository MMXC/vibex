#!/usr/bin/env python3
"""Apply E3 Dashboard bulk operations to dashboard/page.tsx"""
import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add state and handlers after "type ViewMode = 'grid' | 'list';"
e3_handlers = '''
  // E3: 批量选择状态
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const bulkActionBarVisible = selectedProjectIds.size > 0;

  // E3: 选中切换
  const toggleSelect = useCallback((projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // E3: 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    setSelectedProjectIds(prev => {
      if (prev.size === displayProjects.length) return new Set();
      return new Set(displayProjects.map(p => p.id));
    });
  }, [displayProjects]);

  // E3: 清空选择
  const clearSelection = useCallback(() => {
    setSelectedProjectIds(new Set());
  }, []);

  // E3: 批量删除
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedProjectIds);
    openConfirm(
      '批量删除',
      `确定要删除选中的 ${ids.length} 个项目吗？`,
      async () => {
        try {
          await Promise.all(ids.map(id => apiService.softDeleteProject(id)));
          queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
          clearSelection();
        } catch (err: unknown) {
          setActionError(err instanceof Error ? err.message : '删除失败');
        }
      },
      true
    );
  }, [selectedProjectIds, queryClient, clearSelection, openConfirm]);

  // E3: 批量导出 JSON
  const handleBulkExport = useCallback(() => {
    const selected = projects.filter(p => selectedProjectIds.has(p.id));
    const json = JSON.stringify(selected.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibex-projects-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedProjectIds, projects]);

  // E3: 批量归档（soft delete）
  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedProjectIds);
    openConfirm(
      '批量归档',
      `确定要归档选中的 ${ids.length} 个项目吗？`,
      async () => {
        try {
          await Promise.all(ids.map(id => apiService.softDeleteProject(id)));
          queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
          clearSelection();
        } catch (err: unknown) {
          setActionError(err instanceof Error ? err.message : '归档失败');
        }
      },
      false
    );
  }, [selectedProjectIds, queryClient, clearSelection, openConfirm]);
'''

pattern = r"(  // E4: 视图模式 \(Grid\/List\)\n  type ViewMode = 'grid' \| 'list';\n  const \[viewMode, setViewMode\] = useState<ViewMode>\('grid'\);)"
replacement = r"\1" + e3_handlers
content = re.sub(pattern, replacement, content)

# 2. Replace section header h2 with select-all + h2
content = content.replace(
    "            <h2 className={styles.sectionTitle}>项目列表</h2>",
    """            <div className={styles.selectAllRow}>
              <input
                type=\"checkbox\"
                className={styles.selectAllCheckbox}
                checked={displayProjects.length > 0 && selectedProjectIds.size === displayProjects.length}
                ref={el => { if (el) el.indeterminate = selectedProjectIds.size > 0 && selectedProjectIds.size < displayProjects.length; }}
                onChange={toggleSelectAll}
                data-testid=\"select-all-projects\"
                aria-label=\"全选/取消全选所有项目\"
              />
              <h2 className={styles.sectionTitle}>项目列表</h2>
            </div>"""
)

# 3. Change <Link ... key={project.id} href={`/project?id=${project.id}`} className=...>
# to <div ... key={project.id} className=... onClick=...>
# The opening <Link tag:
content = re.sub(
    r"<Link\s+key=\{project\.id\}\s+href=\{`/project\?id=\$\{project\.id\}`\}\s+className=\{`\$\{styles\.projectCard\}",
    '<div key={project.id} className={`${styles.projectCard}',
    content
)

# 4. Add isSelected to the card className and change <Link to <div
# Find: className={`${styles.projectCard} ${styles.active} ${viewMode === 'list' ? styles.projectCardList : ''}`}
# and add selected state
content = re.sub(
    r"(className=\{`\$\{styles\.projectCard\} \$\{styles\.active\} \$\{viewMode === 'list' \? \$\{styles\.projectCardList\} : ''\})\}\s*/>",
    r"\1 `${isSelected ? ' ' + styles.projectCardSelected : ''}`}>",
    content
)

# 5. Add checkbox before projectHeader
content = re.sub(
    r'(                <h3 className=\{styles\.projectName\}>\{project\.name\}</h3>\s*</div>\s*<div className=\{styles\.projectBody\}>)',
    r'''                <input
                  type=\"checkbox\"
                  className={styles.projectCheckbox}
                  checked={selectedProjectIds.has(project.id)}
                  onChange={(e) => toggleSelect(project.id, e as unknown as React.MouseEvent)}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`project-checkbox-${project.id}`}
                  aria-label={`选择项目 ${project.name}`}
                />
                <h3 className={styles.projectName}>{project.name}</h3>
                </div>
                <div className={styles.projectBody}>''',
    content
)

# 6. Close </Link> -> </div> for the project card
# This is tricky - only the project card </Link>, not other </Link>s
# Find the project card closing </Link> - it's </div>\n                </div>\n              </Link>
# The pattern: after projectActions closing, then projectFooter closing, then cardGlow, then projectCard </Link>
# Look for the pattern: </Link> that follows cardGlow inside displayProjects.map

# Actually let's find the specific </Link> that closes the project card
# Pattern: ...cardGlow... </Link>   where this is the only </Link> that follows cardGlow in the file
# Find cardGlow and its containing </Link>
content = re.sub(
    r'(                <div className=\{styles\.cardGlow\} />)\s*(</div>)\s*(</Link>)\s*(\)\)\))',
    r'\1\n              \2\n            \4',
    content
)

# 7. After displayProjects.map closing, add bulk action bar
content = re.sub(
    r"(\s*\{\/\* 空状态 - 项目列表为空 \*\}\})",
    r''',

            {/* E3-S3.2: 批量操作栏 */}
            {bulkActionBarVisible && (
              <div className={styles.bulkActionBar} data-testid="bulk-action-bar">
                <div className={styles.bulkActionInfo}>
                  已选择 {selectedProjectIds.size} 个项目
                </div>
                <div className={styles.bulkActionButtons}>
                  <button type="button" className={styles.bulkArchiveBtn} onClick={handleBulkArchive} data-testid="bulk-archive-btn">📁 归档</button>
                  <button type="button" className={styles.bulkDeleteBtn} onClick={handleBulkDelete} data-testid="bulk-delete-btn">🗑️ 删除</button>
                  <button type="button" className={styles.bulkExportBtn} onClick={handleBulkExport} data-testid="bulk-export-btn">📤 导出</button>
                  <button type="button" className={styles.bulkCloseBtn} onClick={clearSelection} data-testid="bulk-close-btn" aria-label="取消选择">✕</button>
                </div>
              </div>
            )}
            \1''',
    content
)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

print("Done")