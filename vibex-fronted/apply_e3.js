const fs = require('fs');
const path = '/root/.openclaw/vibex/vibex-fronted/src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const e3Code = "\n  // E3: 批量选择状态\n  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());\n  const bulkActionBarVisible = selectedProjectIds.size > 0;\n  const toggleSelect = useCallback((projectId, e) => { e.stopPropagation(); e.preventDefault(); setSelectedProjectIds(prev => { const n = new Set(prev); if (n.has(projectId)) n.delete(projectId); else n.add(projectId); return n; }); }, []);\n  const toggleSelectAll = useCallback(() => { setSelectedProjectIds(prev => prev.size === displayProjects.length ? new Set() : new Set(displayProjects.map(p => p.id))); }, [displayProjects]);\n  const clearSelection = useCallback(() => setSelectedProjectIds(new Set()), []);\n  const handleBulkDelete = useCallback(async () => { const ids = Array.from(selectedProjectIds); openConfirm('批量删除', '确定要删除选中的 ' + ids.length + ' 个项目吗？', async () => { try { await Promise.all(ids.map(id => apiService.softDeleteProject(id))); queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() }); clearSelection(); } catch (err) { setActionError(err instanceof Error ? err.message : '删除失败'); } }, true); }, [selectedProjectIds, queryClient, clearSelection, openConfirm]);\n  const handleBulkExport = useCallback(() => { const selected = projects.filter(p => selectedProjectIds.has(p.id)); const json = JSON.stringify(selected.map(p => ({ id: p.id, name: p.name, description: p.description, createdAt: p.createdAt, updatedAt: p.updatedAt })), null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vibex-projects-export-' + Date.now() + '.json'; a.click(); URL.revokeObjectURL(url); }, [selectedProjectIds, projects]);\n  const handleBulkArchive = useCallback(async () => { const ids = Array.from(selectedProjectIds); openConfirm('批量归档', '确定要归档选中的 ' + ids.length + ' 个项目吗？', async () => { try { await Promise.all(ids.map(id => apiService.softDeleteProject(id))); queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() }); clearSelection(); } catch (err) { setActionError(err instanceof Error ? err.message : '归档失败'); } }, false); }, [selectedProjectIds, queryClient, clearSelection, openConfirm]);\n";

const vm = "const [viewMode, setViewMode] = useState<ViewMode>('grid');";
content = content.replace(vm, vm + e3Code);

const h2old = "            <h2 className={styles.sectionTitle}>项目列表</h2>";
const h2new = "            <div className={styles.selectAllRow}>\n              <input type=\"checkbox\" className={styles.selectAllCheckbox}\n                checked={displayProjects.length > 0 && selectedProjectIds.size === displayProjects.length}\n                ref={el => { if (el) el.indeterminate = selectedProjectIds.size > 0 && selectedProjectIds.size < displayProjects.length; }}\n                onChange={toggleSelectAll}\n                data-testid=\"select-all-projects\"\n                aria-label=\"全选/取消全选所有项目\" />\n              <h2 className={styles.sectionTitle}>项目列表</h2>\n            </div>";
content = content.replace(h2old, h2new);

const linkOld = "              <Link\n                key={project.id}\n                href={`/project?id=${project.id}`}\n                className={`${styles.projectCard} ${styles.active} ${viewMode === 'list' ? styles.projectCardList : ''}`}\n              >";
const linkNew = "              <div\n                key={project.id}\n                className={`${styles.projectCard} ${styles.active} ${viewMode === 'list' ? styles.projectCardList : ''} ${selectedProjectIds.has(project.id) ? styles.projectCardSelected : ''}`}\n                onClick={(e) => { if ((e.target).closest('[data-testid')) return; router.push(`/project?id=${project.id}`); }}\n              >";
content = content.replace(linkOld, linkNew);

const nameOld = "                <h3 className={styles.projectName}>{project.name}</h3>";
const nameNew = "                <input type=\"checkbox\" className={styles.projectCheckbox}\n                  checked={selectedProjectIds.has(project.id)}\n                  onChange={(e) => toggleSelect(project.id, e)}\n                  onClick={(e) => e.stopPropagation()}\n                  data-testid={`project-checkbox-${project.id}`}\n                  aria-label={`选择项目 ${project.name}`} />\n                <h3 className={styles.projectName}>{project.name}</h3>";
content = content.replace(nameOld, nameNew);

// Step 5: Change </Link> to </div> for card close
// The pattern after Link->div replacement:
const glowClose = "                <div className={styles.cardGlow} />\n              </Link>";
const glowNew = "                <div className={styles.cardGlow} />\n              </div>";
content = content.replace(glowClose, glowNew);

// Step 6: Add bulk action bar after projectGrid map
const mapClose = "              </div>\n            )))";
const bulkBar = "              </div>\n            ))\n            {bulkActionBarVisible && (\n              <div className={styles.bulkActionBar} data-testid=\"bulk-action-bar\">\n                <div className={styles.bulkActionInfo}>已选择 {selectedProjectIds.size} 个项目</div>\n                <div className={styles.bulkActionButtons}>\n                  <button type=\"button\" className={styles.bulkArchiveBtn} onClick={handleBulkArchive} data-testid=\"bulk-archive-btn\">📁 归档</button>\n                  <button type=\"button\" className={styles.bulkDeleteBtn} onClick={handleBulkDelete} data-testid=\"bulk-delete-btn\">🗑️ 删除</button>\n                  <button type=\"button\" className={styles.bulkExportBtn} onClick={handleBulkExport} data-testid=\"bulk-export-btn\">📤 导出</button>\n                  <button type=\"button\" className={styles.bulkCloseBtn} onClick={clearSelection} data-testid=\"bulk-close-btn\" aria-label=\"取消选择\">✕</button>\n                </div>\n              </div>\n            )}";

// Try exact pattern
if (content.includes(mapClose)) {
  content = content.replace(mapClose, bulkBar);
  console.log("Step6: exact match");
} else {
  // Try: </Link> was changed to </div> so pattern is </div>...</div>...</div>  ))}
  // Find the map closing - look for pattern: </div> then spaces then )))} near the end of projectGrid
  const idx = content.indexOf('            )))');
  if (idx !== -1) {
    const before = content.substring(idx - 60, idx);
    console.log("Found ))) at", idx, "before:", JSON.stringify(before));
    // Replace: some </div> + spaces + ))) -> </div> + bulk bar + )))
    content = content.replace(before + '            )))', before + bulkBar);
    console.log("Step6: alternate match");
  } else {
    console.log("Step6: no match found, skipping bulk bar");
  }
}

fs.writeFileSync(path, content);
console.log("Written:", content.includes('selectedProjectIds') ? 'HAS CHANGES' : 'NO CHANGES');
