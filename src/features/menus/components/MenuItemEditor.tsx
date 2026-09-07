import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { MenuItem } from '../types/menu';
import {
  findMenuItemInTree,
  flattenMenuItems,
  isDescendant,
} from '../utils/navigationTreeUtils';
import { Button, Input, Select, Toggle, Card, Tooltip } from '@/shared/ui';
import { DynamicIcon } from '@/components/Sidebar/IconResolver';

export interface MenuItemEditorProps {
  selectedItemId: string | null;
  sidebarNav: MenuItem[];
  onUpdate: (id: string, updates: Partial<MenuItem>) => void;
  onMoveParent: (id: string, newParentId: string | null) => { success: boolean; error?: string };
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => { success: boolean; error?: string };
}

const COMMON_ICONS = [
  { value: 'LayoutDashboard', label: 'LayoutDashboard (Dashboard)' },
  { value: 'Layers', label: 'Layers (Projects)' },
  { value: 'Activity', label: 'Activity (Resource Usage)' },
  { value: 'Sparkles', label: 'Sparkles (Pricing & Plans)' },
  { value: 'CreditCard', label: 'CreditCard (Subscriptions)' },
  { value: 'Receipt', label: 'Receipt (Invoices)' },
  { value: 'Settings', label: 'Settings (Configuration)' },
  { value: 'KeyRound', label: 'KeyRound (Passwords)' },
  { value: 'Shield', label: 'Shield (Security & 2FA)' },
  { value: 'HelpCircle', label: 'HelpCircle (Support)' },
  { value: 'FileText', label: 'FileText (Documents)' },
];

const PERMISSION_OPTIONS = [
  { value: 'NONE', label: 'No restriction' },
  { value: 'CUSTOMER_ONLY', label: 'Customer Only' },
  { value: 'SUBSCRIBED_USER', label: 'Subscribed User' },
];

export const MenuItemEditor: React.FC<MenuItemEditorProps> = ({
  selectedItemId,
  sidebarNav,
  onUpdate,
  onMoveParent,
  onAddChild,
  onDelete,
}) => {
  const selectedItem = selectedItemId ? findMenuItemInTree(sidebarNav, selectedItemId) : null;
  const [formState, setFormState] = useState<Partial<MenuItem>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      setFormState({
        label: selectedItem.label,
        icon: selectedItem.icon || 'LayoutDashboard',
        path: selectedItem.path || '',
        parentId: selectedItem.parentId || '',
        order: selectedItem.order || 1,
        isVisible: selectedItem.isVisible !== false,
        permissions: selectedItem.permissions || ['NONE'],
        badge: selectedItem.badge || '',
      });
      setErrorMsg(null);
    }
  }, [selectedItemId, selectedItem]);

  if (!selectedItem) {
    return (
      <Card variant="flat" padding="lg" className="h-[640px] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-[#6B778C] mb-3" />
        <h3 className="text-base font-semibold text-[#091E42]">No Menu Item Selected</h3>
        <p className="text-xs text-[#42526E] max-w-xs mt-1">
          Select a menu item from the tree on the left to edit its properties.
        </p>
      </Card>
    );
  }

  const childCount = selectedItem.children ? selectedItem.children.length : 0;
  const hasChildren = childCount > 0;
  const isTopLevel = !selectedItem.parentId;

  const flattenedList = flattenMenuItems(sidebarNav);
  const parentOptions = [
    { value: '', label: 'None (Top Level)' },
    ...flattenedList.map(({ item, label }) => {
      const invalid = item.id === selectedItem.id || isDescendant(sidebarNav, selectedItem.id, item.id);
      return {
        value: item.id,
        label,
        disabled: invalid,
      };
    }),
  ];

  const handleChange = (field: keyof MenuItem, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    onUpdate(selectedItem.id, { [field]: value });
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParent = e.target.value || null;
    const res = onMoveParent(selectedItem.id, newParent);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update parent menu.');
    } else {
      setErrorMsg(null);
      setFormState((prev) => ({ ...prev, parentId: newParent || undefined }));
    }
  };

  const handleDelete = () => {
    const res = onDelete(selectedItem.id);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to delete item.');
    }
  };

  const labelLength = (formState.label || '').length;

  return (
    <Card variant="default" padding="md" className="h-[640px] flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="pb-3 mb-3 border-b border-[#E5EAF0]">
          <h2 className="text-base font-bold text-[#091E42]">Menu Item Properties</h2>
          <p className="text-xs text-[#6B778C] mt-0.5">Configure the selected menu item.</p>
        </div>

        {/* Selected Summary Card */}
        <div className="p-3 mb-4 rounded-2xl bg-[#E8F1FF]/60 border border-[#0652CC]/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0652CC] text-white flex items-center justify-center shadow-xs">
              <DynamicIcon name={formState.icon} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#091E42]">{formState.label || 'Item'}</h3>
              <span className="text-[11px] font-medium text-[#42526E]">
                {isTopLevel ? 'Main Menu' : 'Sub Menu Item'}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0652CC] text-white font-semibold">
            {isTopLevel ? 'Main Menu' : 'Sub Menu'}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <Shield className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* Label with character counter */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#091E42]">Label *</label>
              <span className="text-[10px] text-[#6B778C] font-mono">{labelLength}/50</span>
            </div>
            <Input
              value={formState.label || ''}
              maxLength={50}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="Dashboard"
            />
          </div>

          {/* Icon Picker */}
          <Select
            label="Icon"
            value={formState.icon || 'LayoutDashboard'}
            onChange={(e) => handleChange('icon', e.target.value)}
            options={COMMON_ICONS}
          />

          {/* Route / URL */}
          <div>
            <label className="text-xs font-semibold text-[#091E42] mb-1 block">Route / URL *</label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-[#6B778C] absolute left-3 top-2.5 pointer-events-none" />
              <Input
                value={formState.path || ''}
                onChange={(e) => handleChange('path', e.target.value)}
                placeholder="/dashboard"
                className="pl-8"
              />
            </div>
          </div>

          {/* Parent Menu */}
          <Select
            label="Parent Menu"
            value={formState.parentId || ''}
            onChange={handleParentChange}
            options={parentOptions}
          />

          {/* Order */}
          <Input
            label="Order"
            type="number"
            value={formState.order || 1}
            onChange={(e) => handleChange('order', parseInt(e.target.value, 10) || 1)}
          />

          {/* Visibility Switch */}
          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#091E42]">Visibility</span>
              <p className="text-[11px] text-[#6B778C]">
                {formState.isVisible !== false ? 'Visible' : 'Hidden'} — Show this menu item in the navigation.
              </p>
            </div>
            <Toggle
              checked={formState.isVisible !== false}
              onChange={(checked) => handleChange('isVisible', checked)}
              size="sm"
            />
          </div>

          {/* Required Permission */}
          <div className="pt-2 border-t border-[#E5EAF0]">
            <div className="flex items-center space-x-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-[#0652CC]" />
              <label className="text-xs font-semibold text-[#091E42]">Required Permission</label>
            </div>
            <Select
              value={formState.permissions?.[0] || 'NONE'}
              onChange={(e) => handleChange('permissions', [e.target.value])}
              options={PERMISSION_OPTIONS}
              helperText="Only users with the selected permission can see this menu item."
            />
          </div>

          {/* Status Switch */}
          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#091E42]">Status</span>
              <p className="text-[11px] text-[#6B778C]">Active — Enable or disable this menu item.</p>
            </div>
            <Toggle
              checked={formState.isVisible !== false}
              onChange={(checked) => handleChange('isVisible', checked)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer Action Buttons */}
      <div className="pt-4 mt-6 border-t border-[#E5EAF0] grid grid-cols-2 gap-3">
        <Tooltip content={hasChildren ? 'Cannot delete a menu item with children.' : ''}>
          <Button
            variant="outline"
            size="sm"
            disabled={hasChildren}
            onClick={handleDelete}
            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Menu Item</span>
          </Button>
        </Tooltip>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddChild(selectedItem.id)}
          className="w-full text-[#0652CC] border-[#0652CC]/30 hover:bg-[#E8F1FF] flex items-center justify-center space-x-1.5 font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Child Item</span>
        </Button>
      </div>
    </Card>
  );
};

export default MenuItemEditor;
