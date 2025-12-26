import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  CssBaseline,
} from "@mui/material";
import Commodities from "./components/Commodities.jsx";
import UOMs from "./components/UOMs.jsx";
import Blends from "./components/Blends.jsx";
import BlendComponents from "./components/BlendComponents.jsx";
import CreateBlend from "./components/CreateBlend.jsx";
import Locations from "./components/Locations.jsx";
import CounterParties from "./components/CounterParties.jsx";
import Capacity from "./components/Capacity.jsx";
import Dashboard from "./components/Dashboard.jsx";

const drawerWidth = 240;

function App() {
  return (
    <Router>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Data Management System
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: "auto" }}>
            <List>
              <ListItem button component={Link} to="/">
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem button component={Link} to="/commodities">
                <ListItemText primary="Commodities" />
              </ListItem>
              <ListItem button component={Link} to="/uoms">
                <ListItemText primary="UOMs" />
              </ListItem>
              <ListItem button component={Link} to="/blends">
                <ListItemText primary="Blends" />
              </ListItem>
              <ListItem button component={Link} to="/blend-components">
                <ListItemText primary="Blend Components" />
              </ListItem>
              <ListItem button component={Link} to="/locations">
                <ListItemText primary="Locations" />
              </ListItem>
              <ListItem button component={Link} to="/counter-parties">
                <ListItemText primary="Counter Parties" />
              </ListItem>
              <ListItem button component={Link} to="/capacity">
                <ListItemText primary="Capacity" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="xl">
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
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
