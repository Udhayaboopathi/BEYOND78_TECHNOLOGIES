import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  PageToggleButton,
} from "@patternfly/react-core";
import {
  BarsIcon,
  CubeIcon,
  InfrastructureIcon,
  LayerGroupIcon,
  BoxIcon,
  MapMarkerIcon,
  UsersIcon,
  DatabaseIcon,
  TachometerAltIcon,
} from "@patternfly/react-icons";
import Commodities from "./components/Commodities";
import UOMs from "./components/UOMs";
import Blends from "./components/Blends";
import BlendComponents from "./components/BlendComponents";
import CreateBlend from "./components/CreateBlend";
import Locations from "./components/Locations";
import CounterParties from "./components/CounterParties";
import Capacity from "./components/Capacity";
import Dashboard from "./components/Dashboard";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Dashboard", icon: <TachometerAltIcon /> },
    { to: "/commodities", label: "Commodities", icon: <CubeIcon /> },
    { to: "/uoms", label: "Units of Measure", icon: <InfrastructureIcon /> },
    { to: "/blends", label: "Blends", icon: <LayerGroupIcon /> },
    { to: "/blend-components", label: "Blend Components", icon: <BoxIcon /> },
    { to: "/locations", label: "Locations", icon: <MapMarkerIcon /> },
    { to: "/counter-parties", label: "Counter Parties", icon: <UsersIcon /> },
    { to: "/capacity", label: "Capacity", icon: <DatabaseIcon /> },
  ];

  return (
    <Nav>
      <NavList>
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            itemId={item.to}
            isActive={location.pathname === item.to}
            onClick={() => navigate(item.to)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {item.icon}
              <span>{item.label}</span>
            </span>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#151515" }}>
            Data Management System
          </span>
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen}>
      <PageSidebarBody>
        <Navigation />
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page masthead={header} sidebar={sidebar}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/commodities" element={<Commodities />} />
        <Route path="/uoms" element={<UOMs />} />
        <Route path="/blends" element={<Blends />} />
        <Route path="/create-blend" element={<CreateBlend />} />
        <Route path="/blend-components" element={<BlendComponents />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/counter-parties" element={<CounterParties />} />
        <Route path="/capacity" element={<Capacity />} />
      </Routes>
    </Page>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
