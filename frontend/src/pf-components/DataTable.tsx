import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Pagination,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  EmptyStateFooter,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Label,
  EmptyStateActions
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons';

interface DataRow {
  id: number;
  name: string;
  status: 'Running' | 'Stopped' | 'Maintenance' | 'Down';
  dataCenter: string;
  cpu: number;
  lastUpdate: string;
}

const mockData: DataRow[] = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  name: `node-${i + 100}.enterprise.internal`,
  status: (['Running', 'Stopped', 'Maintenance', 'Down'] as const)[Math.floor(Math.random() * 4)],
  dataCenter: (['US-East', 'EU-West', 'AP-South'] as const)[Math.floor(Math.random() * 3)],
  cpu: Math.floor(Math.random() * 100),
  lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
}));

export const DataTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeSortIndex, setActiveSortIndex] = useState<number | undefined>(0);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');

  // Filtering
  const filteredRows = mockData.filter(row => 
    row.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Sorting
  const sortedRows = filteredRows.sort((a, b) => {
    const aValue = Object.values(a)[activeSortIndex || 0];
    const bValue = Object.values(b)[activeSortIndex || 0];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    const aString = String(aValue);
    const bString = String(bValue);
    return activeSortDirection === 'asc' 
      ? aString.localeCompare(bString) 
      : bString.localeCompare(aString);
  });

  // Pagination
  const paginatedRows = sortedRows.slice((page - 1) * perPage, page * perPage);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex
  });

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const renderPagination = (variant: 'top' | 'bottom') => (
    <Pagination
      itemCount={filteredRows.length}
      perPage={perPage}
      page={page}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
      variant={variant}
      isCompact
    />
  );

  return (
    <React.Fragment>
      <PageSection>
        <Title headingLevel="h1">Resource Inventory</Title>
      </PageSection>

      <PageSection>
        <div style={{ backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)', padding: '1rem' }}>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput 
                    placeholder="Filter by name..." 
                    value={searchValue}
                    onChange={(_event, value) => {
                        setSearchValue(value);
                        setPage(1);
                    }}
                    onClear={() => setSearchValue('')}
                />
              </ToolbarItem>
              <ToolbarItem variant="pagination">
                {renderPagination('top')}
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {paginatedRows.length > 0 ? (
            <Table aria-label="Simple Table">
              <Thead>
                <Tr>
                  <Th sort={getSortParams(0)}>Node Name</Th>
                  <Th sort={getSortParams(1)}>Status</Th>
                  <Th sort={getSortParams(2)}>Region</Th>
                  <Th sort={getSortParams(3)}>CPU Load (%)</Th>
                  <Th sort={getSortParams(4)}>Last Updated</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedRows.map((row) => (
                  <Tr key={row.id}>
                    <Td dataLabel="Node Name">{row.name}</Td>
                    <Td dataLabel="Status">
                        {row.status === 'Running' && <Label color="green">Running</Label>}
                        {row.status === 'Stopped' && <Label color="grey">Stopped</Label>}
                        {row.status === 'Maintenance' && <Label color="blue">Maintenance</Label>}
                        {row.status === 'Down' && <Label color="red">Down</Label>}
                    </Td>
                    <Td dataLabel="Region">{row.dataCenter}</Td>
                    <Td dataLabel="CPU Load">{row.cpu}%</Td>
                    <Td dataLabel="Last Updated">{row.lastUpdate}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <EmptyState variant={EmptyStateVariant.lg}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <SearchIcon style={{ fontSize: '48px', color: 'gray' }} />
                </div>
              <Title headingLevel="h4" size="lg">No results found</Title>
              <EmptyStateBody>
                No results match the filter criteria. Clear all filters and try again.
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                    <Button variant="link" onClick={() => setSearchValue('')}>Clear all filters</Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          )}

          {paginatedRows.length > 0 && (
             <Toolbar>
                <ToolbarContent>
                    <ToolbarItem variant="pagination">
                        {renderPagination('bottom')}
                    </ToolbarItem>
                </ToolbarContent>
             </Toolbar>
          )}
        </div>
      </PageSection>
    </React.Fragment>
  );
};
