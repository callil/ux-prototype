import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Settings,
  ShieldCheck,
  LogOut,
  Eye,
  Printer,
  Download,
  Plus,
  ChevronDown,
  SlidersHorizontal,
  CircleCheck,
  Upload,
  Tag,
  Check,
  Save,
  Bell,
  HelpCircle,
  ScanBarcode,
  SquarePen,
  Trash2,
  Copy,
  Search,
} from 'lucide-react';
import type { AgGridReact } from 'ag-grid-react';

import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import type { Item } from '@/types/extras';

// Canary organisms
import { ArdaSidebar } from '@/components/canary/organisms/sidebar/sidebar';
import { ArdaSidebarHeader } from '@/components/canary/molecules/sidebar/sidebar-header';
import { SidebarNav } from '@/components/canary/molecules/sidebar/sidebar-nav';
import { SidebarNavItem } from '@/components/canary/molecules/sidebar/sidebar-nav-item';
import { SidebarUserMenu } from '@/components/canary/molecules/sidebar/sidebar-user-menu';
import { ArdaAppHeader } from '@/components/canary/organisms/app-header/app-header';
import { ArdaItemDetails } from '@/components/canary/organisms/item-details/item-details';
import { ItemGrid } from '@/components/canary/organisms/item-grid/item-grid';
import { itemGridFixtures } from '@/components/canary/molecules/item-grid/item-grid-fixtures';
import { OverflowToolbar } from '@/components/canary/molecules/overflow-toolbar/overflow-toolbar';

// --- Mock data ---

const mockLookups = {
  supplier: async (search: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const suppliers = [
      'Medline Industries',
      'Cardinal Health',
      'Fisher Scientific',
      'VWR International',
      'Eppendorf',
      '3M Healthcare',
    ];
    return suppliers
      .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
      .map((s) => ({ label: s, value: s }));
  },
  classificationType: async (search: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const types = [
      'PPE – Gloves',
      'PPE – Masks',
      'Chemicals – Disinfectants',
      'Lab Supplies – Consumables',
      'Safety – Sharps',
      'Sterilization',
    ];
    return types
      .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
      .map((c) => ({ label: c, value: c }));
  },
};

function itemToFields(item: Item) {
  return [
    { key: 'sku', label: 'SKU', value: item.internalSKU || '—', mono: true },
    { key: 'gl', label: 'GL Code', value: item.generalLedgerCode || '—', mono: true },
    {
      key: 'classification',
      label: 'Classification',
      value: item.classification
        ? item.classification.subType
          ? `${item.classification.type} – ${item.classification.subType}`
          : item.classification.type
        : '—',
    },
    { key: 'supplier', label: 'Supplier', value: item.primarySupply?.supplier || '—' },
    {
      key: 'orderMethod',
      label: 'Order Method',
      value:
        item.primarySupply?.orderMechanism
          ?.replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()) || '—',
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      value: item.primarySupply?.unitCost
        ? `$${item.primarySupply.unitCost.value.toFixed(2)}`
        : '—',
    },
    {
      key: 'orderCost',
      label: 'Order Cost',
      value: item.primarySupply?.orderCost
        ? `$${item.primarySupply.orderCost.value.toFixed(2)}`
        : '—',
    },
    {
      key: 'taxable',
      label: 'Taxable',
      value: item.taxable ? 'Yes' : item.taxable === false ? 'No' : '—',
    },
    { key: 'notes', label: 'Notes', value: item.notes || '—' },
  ];
}

// --- Action button for grid rows ---

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className="flex cursor-pointer items-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Icon size={16} />
    </button>
  );
}

// --- Page Component ---

function ItemsPage() {
  const [activeTab, setActiveTab] = useState('published');
  const [selected, setSelected] = useState<Item[]>([]);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [_notesItem, setNotesItem] = useState<Item | null>(null);
  const gridRef = useRef<AgGridReact<Item>>(null);

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const toggleableColumns = [
    { field: 'imageUrl', label: 'Image' },
    { field: 'internalSKU', label: 'SKU' },
    { field: 'generalLedgerCode', label: 'GL Code' },
    { field: 'classification.type', label: 'Classification' },
    { field: 'primarySupply.supplier', label: 'Supplier' },
    { field: 'primarySupply.orderMechanism', label: 'Order Method' },
    { field: 'primarySupply.unitCost', label: 'Unit Cost' },
    { field: 'primarySupply.orderCost', label: 'Order Cost' },
    { field: 'taxable', label: 'Taxable' },
    { field: 'notes', label: 'Notes' },
  ];

  const toggleColumn = useCallback((field: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      const api = gridRef.current?.api;
      if (api) api.setColumnsVisible([field], !next.has(field));
      return next;
    });
  }, []);

  const openDetail = (item: Item) => setDetailItem(item);

  const actionsColumn = {
    actionCount: 3,
    cellRenderer: (params: { data?: Item }) => {
      if (!params.data) return null;
      const item = params.data;
      return (
        <div className="flex h-full items-center gap-1">
          <ActionButton icon={Eye} label="View" onClick={() => openDetail(item)} />
          <ActionButton
            icon={ShoppingCart}
            label="Order"
            onClick={() => console.log('Order:', item.name)}
          />
          <ActionButton
            icon={Printer}
            label="Print"
            onClick={() => console.log('Print:', item.name)}
          />
        </div>
      );
    },
  };

  return (
    <ArdaSidebar
      defaultOpen
      content={
        <SidebarInset>
          {/* App Header */}
          <ArdaAppHeader
            leading={<SidebarTrigger />}
            showSearch={false}
            actions={[
              {
                key: 'search',
                icon: Search,
                label: 'Search',
                onClick: () => console.log('Global search'),
              },
              { key: 'scan', icon: ScanBarcode, label: 'Scan', onClick: () => console.log('Scan') },
              { key: 'help', icon: HelpCircle, label: 'Help' },
              { key: 'notifications', icon: Bell, label: 'Notifications', badgeCount: 3 },
            ]}
          >
            <div className="group/help relative flex items-center gap-1.5">
              <h1 className="text-lg font-semibold">Items</h1>
              <span
                className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                aria-label="About items"
              >
                ?
              </span>
              <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-4 opacity-0 shadow-md transition-opacity group-hover/help:pointer-events-auto group-hover/help:opacity-100">
                <p className="text-sm font-medium text-foreground">Items</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create and manage your inventory items. Set up suppliers, order methods, and
                  thresholds — then print kanban cards to place in your bins.
                </p>
              </div>
            </div>
          </ArdaAppHeader>

          {/* Tab bar */}
          <nav className="flex h-11 items-stretch border-b px-6">
            {(['published', 'draft', 'uploaded'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 text-sm font-medium transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-opacity ${
                  activeTab === tab
                    ? 'text-foreground after:bg-foreground after:opacity-100'
                    : 'text-muted-foreground after:opacity-0 hover:text-foreground'
                }`}
              >
                {tab === 'published' ? 'Published' : tab === 'draft' ? 'Drafts' : 'Uploaded'}
              </button>
            ))}
          </nav>

          {/* Grid */}
          <main className="p-6">
            <ItemGrid
              items={itemGridFixtures}
              autoHeight
              editable
              enableRowSelection
              lookups={mockLookups}
              actionsColumn={actionsColumn}
              gridRef={gridRef}
              onSelectionChange={setSelected}
              onNotesClick={setNotesItem}
              onPublishRow={async (rowId, changes) => {
                console.log(`Publishing row ${rowId}:`, changes);
                await new Promise((r) => setTimeout(r, 500));
              }}
              toolbar={
                selected.length > 0 ? (
                  <OverflowToolbar>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-overflow-label="Clear"
                      onClick={() => {
                        gridRef.current?.api?.deselectAll();
                        setSelected([]);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-overflow-label="Print cards"
                      onClick={() => console.log('Print cards for', selected.length, 'items')}
                    >
                      <Printer className="mr-1.5 h-4 w-4" />
                      Print cards
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-overflow-label="Add to queue"
                      onClick={() => console.log('Add to queue', selected.length, 'items')}
                    >
                      <ShoppingCart className="mr-1.5 h-4 w-4" />
                      Add to queue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-overflow-label="Export"
                      onClick={() => console.log('Export', selected.length, 'items')}
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      data-overflow-label="Delete"
                      onClick={() => console.log('Delete', selected.length, 'items')}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete
                    </Button>
                  </OverflowToolbar>
                ) : (
                  <OverflowToolbar>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" data-overflow-label="View">
                          <SlidersHorizontal className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">View</span>
                          <ChevronDown className="ml-0.5 h-3.5 w-3.5 sm:ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setHiddenColumns(new Set());
                            const api = gridRef.current?.api;
                            if (api)
                              api.setColumnsVisible(
                                toggleableColumns.map((c) => c.field),
                                true,
                              );
                          }}
                        >
                          Show all
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {toggleableColumns.map((col) => (
                          <DropdownMenuItem
                            key={col.field}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleColumn(col.field);
                            }}
                            className="gap-2"
                          >
                            {!hiddenColumns.has(col.field) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="h-4 w-4" />
                            )}
                            {col.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => console.log('Save view')}>
                          <Save className="h-4 w-4" />
                          Save view
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" data-overflow-label="Actions">
                          <CircleCheck className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Actions</span>
                          <ChevronDown className="ml-0.5 h-3.5 w-3.5 sm:ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => console.log('Print cards')}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print cards
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Print labels')}>
                          <Tag className="mr-2 h-4 w-4" />
                          Print labels
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Export')}>
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Add item split button */}
                    <div
                      className="flex"
                      data-overflow-label="Add item"
                      onClick={() => console.log('Add item')}
                    >
                      <Button
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => console.log('Add item')}
                      >
                        <Plus className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Add item</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="rounded-l-none border-l border-primary-foreground/20 px-2"
                            aria-label="More add options"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('Import CSV')}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Bulk add')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Bulk add
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </OverflowToolbar>
                )
              }
            />
          </main>

          {/* Item Details Drawer — wired to grid row click / View action */}
          {detailItem && (
            <ArdaItemDetails
              open={!!detailItem}
              onOpenChange={(open) => !open && setDetailItem(null)}
              title={detailItem.name}
              fields={itemToFields(detailItem)}
              actions={[
                {
                  key: 'edit',
                  label: 'Edit',
                  icon: SquarePen,
                  onAction: () => console.log('Edit:', detailItem.name),
                },
                {
                  key: 'duplicate',
                  label: 'Duplicate',
                  icon: Copy,
                  onAction: () => console.log('Duplicate:', detailItem.name),
                },
                {
                  key: 'queue',
                  label: 'Queue',
                  icon: ShoppingCart,
                  onAction: () => console.log('Queue:', detailItem.name),
                },
                {
                  key: 'print',
                  label: 'Print',
                  icon: Printer,
                  onAction: () => console.log('Print:', detailItem.name),
                },
              ]}
              overflowActions={[
                {
                  key: 'delete',
                  label: 'Delete item',
                  icon: Trash2,
                  onAction: () => console.log('Delete:', detailItem.name),
                  destructive: true,
                },
              ]}
              cardCount={3}
              renderCard={(i) => (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
                  Card {i} of 3
                </div>
              )}
            />
          )}
        </SidebarInset>
      }
    >
      <ArdaSidebarHeader teamName="Arda Cards" />
      <SidebarNav>
        <SidebarNavItem icon={LayoutDashboard} label="Dashboard" />
        <SidebarNavItem icon={Package} label="Items" active />
        <SidebarNavItem icon={ShoppingCart} label="Order Queue" badge={3} />
        <SidebarNavItem icon={Building2} label="Suppliers" />
      </SidebarNav>
      <SidebarUserMenu
        user={{ name: 'Uriel Eisen', email: 'uriel@arda.cards', role: 'Account Admin' }}
        actions={[
          { key: 'admin', label: 'Admin', icon: ShieldCheck, onClick: () => {} },
          { key: 'settings', label: 'Settings', icon: Settings, onClick: () => {} },
          { key: 'logout', label: 'Log out', icon: LogOut, onClick: () => {}, destructive: true },
        ]}
      />
    </ArdaSidebar>
  );
}

// --- Story ---

const meta = {
  title: 'Canary Refactor/Reference/Items/Items Page',
  component: ItemsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full items page composition — sidebar, app header, tab bar, item grid with editing, ' +
          'and item details drawer. All canary organisms wired together.',
      },
    },
  },
} satisfies Meta<typeof ItemsPage>;

export default meta;
type Story = StoryObj<typeof ItemsPage>;

/** Full page — click a row\'s View action to open the detail panel. */
export const Default: Story = {};
