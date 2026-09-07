import React, { useState } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { MenuTreeItem } from '../components/MenuTreeItem';
import { AvailablePagesPanel, AvailablePage } from '../components/AvailablePagesPanel';
import { MenuItemEditor } from '../components/MenuItemEditor';
import { PreviewNavigationModal } from '../components/PreviewNavigationModal';
import { Button, Input, Card } from '@/shared/ui';
import {
  Plus,
  RotateCcw,
  Save,
  Search,
  Eye,
  Workflow,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const MenuBuilderPage: React.FC = () => {
  const {
    sidebarNav,
    selectedItemId,
    setSelectedItemId,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    reorderSibling,
    duplicateItem,
    resetToDefault,
    saveChanges,
    isDirty,
    loading,
  } = useNavigation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isExpandedAll, setIsExpandedAll] = useState<boolean | undefined>(undefined);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSave = async () => {
    await saveChanges();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddRootItem = () => {
    const newItem = addItem({ label: 'New Menu', icon: 'LayoutDashboard', path: '/new-page' }, null);
    setSelectedItemId(newItem.id);
  };

  const handleAddChildItem = (parentId: string) => {
    const newItem = addItem({ label: 'New Item', icon: 'FileText', path: '/new-sub-page' }, parentId);
    setSelectedItemId(newItem.id);
  };

  const handleAddPageFromLibrary = (page: AvailablePage) => {
    const newItem = addItem(
      { label: page.label, icon: page.icon, path: page.path },
      selectedItemId || null
    );
    setSelectedItemId(newItem.id);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#0652CC] flex items-center justify-center text-white font-bold shadow-xs">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight">
                Navigation Builder
              </h1>
              {isDirty ? (
                <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">
                  Unsaved Changes
                </span>
              ) : savedSuccess ? (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Saved</span>
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[#42526E] mt-0.5">
              Manage the system navigation structure. Add, edit, reorder and configure menu items for your application.
            </p>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-1.5 text-[#0652CC] border-[#0652CC]/30 hover:bg-[#E8F1FF]"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Navigation</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="flex items-center space-x-1.5 text-[#42526E]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={loading}
            className="flex items-center space-x-1.5 font-bold shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* 3-Column Desktop Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: Menu Structure */}
        <Card variant="default" padding="md" className="h-[640px] flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-3 border-b border-[#E5EAF0] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#091E42]">Menu Structure</h2>
                <p className="text-xs text-[#6B778C] mt-0.5">
                  Drag & drop to reorder. Click to edit items.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRootItem}
                className="flex items-center space-x-1 text-[#0652CC] border-[#0652CC]/30 hover:bg-[#E8F1FF]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Menu</span>
              </Button>
            </div>

            {/* Controls */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Input
                  placeholder="Filter menu tree..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs py-1.5"
                />
                <Search className="w-3.5 h-3.5 text-[#6B778C] absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B778C]">
                <span>Total items: {sidebarNav.length}</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsExpandedAll(true)}
                    className="hover:text-[#0652CC] flex items-center space-x-0.5"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand All</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setIsExpandedAll(false)}
                    className="hover:text-[#0652CC] flex items-center space-x-0.5"
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Collapse All</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tree Items List */}
            <div className="overflow-y-auto max-h-[460px] pr-1 space-y-0.5">
              {sidebarNav.map((item) => (
                <MenuTreeItem
                  key={item.id}
                  item={item}
                  selectedItemId={selectedItemId}
                  onSelect={(id) => setSelectedItemId(id)}
                  onAddChild={handleAddChildItem}
                  onDelete={(id) => deleteItem(id)}
                  onDuplicate={(id) => duplicateItem(id)}
                  onReorder={reorderSibling}
                  searchTerm={searchTerm}
                  isExpandedAll={isExpandedAll}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* COLUMN 2: Available Pages */}
        <AvailablePagesPanel onAddPageToMenu={handleAddPageFromLibrary} />

        {/* COLUMN 3: Menu Item Properties */}
        <MenuItemEditor
          selectedItemId={selectedItemId}
          sidebarNav={sidebarNav}
          onUpdate={updateItem}
          onMoveParent={moveItem}
          onAddChild={handleAddChildItem}
          onDelete={deleteItem}
        />
      </div>

      {/* Preview Navigation Modal */}
      <PreviewNavigationModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sidebarNav={sidebarNav}
        selectedItemId={selectedItemId}
      />
    </div>
  );
};

export default MenuBuilderPage;
