import React, { useState } from 'react';
import {
  Page,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Avatar,
  SkipToContent
} from '@patternfly/react-core';
import { BarsIcon, BellIcon, CogIcon, QuestionCircleIcon } from '@patternfly/react-icons';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState(0);

  const onNavSelect = (result: { itemId: number | string }) => {
    setActiveItem(result.itemId as number);
  };

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const headerToolbar = (
    <Toolbar id="toolbar" isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarItem>
          <BellIcon />
        </ToolbarItem>
        <ToolbarItem>
          <CogIcon />
        </ToolbarItem>
        <ToolbarItem>
          <QuestionCircleIcon />
        </ToolbarItem>
        <ToolbarItem>
            <Avatar src="" alt="avatar" /> 
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const masthead = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
          id="vertical-nav-toggle"
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>EnterpriseCmd</span>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{headerToolbar}</MastheadContent>
    </Masthead>
  );

  const navigation = (
    <Nav onSelect={(_event, result) => onNavSelect(result)} aria-label="Nav">
      <NavList>
        <NavItem itemId={0} isActive={activeItem === 0}>
          Dashboard
        </NavItem>
        <NavItem itemId={1} isActive={activeItem === 1}>
          Inventory
        </NavItem>
        <NavItem itemId={2} isActive={activeItem === 2}>
          Reports
        </NavItem>
        <NavItem itemId={3} isActive={activeItem === 3}>
          Settings
        </NavItem>
      </NavList>
    </Nav>
  );

  const sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen} id="vertical-sidebar">
      <PageSidebarBody>
        {navigation}
      </PageSidebarBody>
    </PageSidebar>
  );
  
  const pageId = 'main-content-page-layout-default-nav';
  const pageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>;

  return (
    <Page
      masthead={masthead}
      sidebar={sidebar}
      isManagedSidebar
      skipToContent={pageSkipToContent}
      mainContainerId={pageId}
      style={{ height: '100vh' }}
    >
      {children}
    </Page>
  );
};
