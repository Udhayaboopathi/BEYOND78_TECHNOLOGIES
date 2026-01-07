import { useState, useEffect } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleCheckbox,
  MenuToggleElement,
  Pagination,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  PaginationVariant,
  Button,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

export interface Column {
  key: string;
  title: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  renderCell?: (item: T, columnKey: string) => React.ReactNode;
  getRowId: (item: T) => string | number;
  actions?: React.ReactNode;
  bulkActions?: (selectedIds: (string | number)[]) => React.ReactNode;
  defaultPerPage?: number;
}

export function DataTable<T>({
  data,
  columns,
  onEdit,
  onDelete,
  renderCell,
  getRowId,
  actions,
  bulkActions,
  defaultPerPage = 10,
}: DataTableProps<T>) {
  const [isBulkSelectDropdownOpen, setIsBulkSelectDropdownOpen] = useState(false);
  const [bulkSelection, setBulkSelection] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [paginatedRows, setPaginatedRows] = useState<T[]>([]);
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  useEffect(() => {
    const startIdx = (page - 1) * perPage;
    const endIdx = startIdx + perPage;
    setPaginatedRows(data.slice(startIdx, endIdx));
  }, [data, page, perPage]);

  const handleSetPage = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    _perPage?: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    const start = startIdx ?? (newPage - 1) * perPage;
    const end = endIdx ?? start + perPage;
    setPaginatedRows(data.slice(start, end));
    setPage(newPage);
  };

  const handlePerPageSelect = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    const start = startIdx ?? (newPage - 1) * newPerPage;
    const end = endIdx ?? start + newPerPage;
    setPaginatedRows(data.slice(start, end));
    setPage(newPage);
    setPerPage(newPerPage);
  };

  const setRowSelected = (row: T, isSelecting: boolean) => {
    const rowId = getRowId(row);
    setSelectedRows((prevSelected) => {
      const otherSelectedRows = prevSelected.filter((r) => r !== rowId);
      return isSelecting ? [...otherSelectedRows, rowId] : otherSelectedRows;
    });
  };

  const selectAllRows = (isSelecting: boolean) =>
    setSelectedRows(isSelecting ? data.map((r) => getRowId(r)) : []);

  const selectPageRows = (isSelecting: boolean) =>
    setSelectedRows(isSelecting ? paginatedRows.map((r) => getRowId(r)) : []);

  const isRowSelected = (row: T) => selectedRows.includes(getRowId(row));

  const buildPagination = (variant: 'bottom' | 'top' | PaginationVariant, isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={data.length}
      page={page}
      perPage={perPage}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
      variant={variant}
      titles={{
        paginationAriaLabel: `${variant} pagination`,
      }}
    />
  );

  const buildBulkSelectDropdown = () => {
    const numSelected = selectedRows.length;
    const allSelected = numSelected === data.length;
    const anySelected = numSelected > 0;
    const someChecked = anySelected ? null : false;
    const isChecked = allSelected ? true : someChecked;

    const items = (
      <>
        <DropdownItem value="none">Select none (0 items)</DropdownItem>
        <DropdownItem value="page">Select page ({Math.min(perPage, data.length)} items)</DropdownItem>
        <DropdownItem value="all">Select all ({data.length} items)</DropdownItem>
      </>
    );

    return (
      <Dropdown
        role="menu"
        onSelect={(_event?: React.MouseEvent<Element, MouseEvent>, value?: string | number) => {
          if (value === 'all') {
            selectAllRows(bulkSelection !== 'all');
          } else if (value === 'page') {
            selectPageRows(bulkSelection !== 'page');
          } else {
            setSelectedRows([]);
          }
          setBulkSelection(value as string);
        }}
        isOpen={isBulkSelectDropdownOpen}
        onOpenChange={(isOpen: boolean) => setIsBulkSelectDropdownOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isBulkSelectDropdownOpen}
            onClick={() => setIsBulkSelectDropdownOpen(!isBulkSelectDropdownOpen)}
            aria-label="Select items"
            splitButtonItems={[
              <MenuToggleCheckbox
                id="split-dropdown-checkbox"
                key="split-dropdown-checkbox"
                aria-label={anySelected ? 'Deselect all items' : 'Select all items'}
                isChecked={isChecked}
                onClick={() => {
                  anySelected ? setSelectedRows([]) : selectAllRows(bulkSelection !== 'all');
                }}
              >
                {numSelected !== 0 && `${numSelected} selected`}
              </MenuToggleCheckbox>
            ]}
          />
        )}
      >
        <DropdownList>{items}</DropdownList>
      </Dropdown>
    );
  };

  const toolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>{buildBulkSelectDropdown()}</ToolbarItem>
          {bulkActions && selectedRows.length > 0 && (
            <ToolbarItem>{bulkActions(selectedRows)}</ToolbarItem>
          )}
        </ToolbarGroup>
        {actions && <ToolbarGroup align={{ default: 'alignEnd' }}>{actions}</ToolbarGroup>}
        <ToolbarItem variant="pagination">{buildPagination('top', false)}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const renderDefaultCell = (item: T, columnKey: string): React.ReactNode => {
    return (item as any)[columnKey];
  };

  const cellRenderer = renderCell || renderDefaultCell;

  return (
    <div>
      {toolbar}
      <Table aria-label="Data table">
        <Thead>
          <Tr>
            <Th screenReaderText="Row select" />
            {columns.map((column) => (
              <Th key={column.key}>{column.title}</Th>
            ))}
            {(onEdit || onDelete) && <Th>Actions</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {paginatedRows.map((row, rowIndex) => (
            <Tr key={getRowId(row)}>
              <Td
                select={{
                  rowIndex,
                  onSelect: (_event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) =>
                    setRowSelected(row, isSelecting),
                  isSelected: isRowSelected(row),
                }}
              />
              {columns.map((column) => (
                <Td key={column.key} dataLabel={column.title}>
                  {cellRenderer(row, column.key)}
                </Td>
              ))}
              {(onEdit || onDelete) && (
                <Td isActionCell>
                  {onEdit && (
                    <Button variant="plain" onClick={() => onEdit(row)} aria-label="Edit">
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="plain" isDanger onClick={() => onDelete(row)} aria-label="Delete">
                      Delete
                    </Button>
                  )}
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
      {buildPagination('bottom', true)}
    </div>
  );
}
