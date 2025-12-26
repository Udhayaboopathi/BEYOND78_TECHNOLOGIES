import React from "react";
import { Typography, Paper, Grid, Box } from "@mui/material";

function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Commodities
            </Typography>
            <Typography variant="body2">
              Manage commodity data including name, description, UOM, and
              density information.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              UOMs
            </Typography>
            <Typography variant="body2">
              Unit of Measurement definitions with type and base conversions.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Blends
            </Typography>
            <Typography variant="body2">
              Manage blend configurations and their commodity compositions.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Counter Parties
            </Typography>
            <Typography variant="body2">
              Counterparty information including credit status and limits.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Locations
            </Typography>
            <Typography variant="body2">
              Location data with hierarchical relationships.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Capacity
            </Typography>
            <Typography variant="body2">
              Track capacity by commodity and location with date ranges.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{ p: 2, display: "flex", flexDirection: "column", height: 140 }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Blend Components
            </Typography>
            <Typography variant="body2">
              Individual components that make up blends with proportions.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
