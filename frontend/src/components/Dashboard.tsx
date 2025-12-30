import React from "react";
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Gallery,
  GalleryItem,
} from "@patternfly/react-core";
import {
  CubeIcon,
  InfrastructureIcon,
  LayerGroupIcon,
  BoxIcon,
  MapMarkerIcon,
  UsersIcon,
  DatabaseIcon,
} from "@patternfly/react-icons";

const Dashboard: React.FC = () => {
  const cards = [
    {
      title: "Commodities",
      description: "Manage commodity data including name, description, UOM, and density information.",
      icon: <CubeIcon />,
    },
    {
      title: "Units of Measure",
      description: "Define and manage units of measurement with conversion factors and types.",
      icon: <InfrastructureIcon />,
    },
    {
      title: "Blends",
      description: "Create and manage blends with multiple commodity components and proportions.",
      icon: <LayerGroupIcon />,
    },
    {
      title: "Blend Components",
      description: "View and edit individual components that make up commodity blends.",
      icon: <BoxIcon />,
    },
    {
      title: "Locations",
      description: "Manage location data including hierarchical relationships and geographic information.",
      icon: <MapMarkerIcon />,
    },
    {
      title: "Counter Parties",
      description: "Manage counter party information including credit status and limits.",
      icon: <UsersIcon />,
    },
    {
      title: "Capacity",
      description: "Track capacity data with commodity, location, and temporal constraints.",
      icon: <DatabaseIcon />,
    },
  ];

  return (
    <>
      <PageSection>
        <Title headingLevel="h1" size="2xl">
          Dashboard
        </Title>
      </PageSection>
      <PageSection>
        <Gallery hasGutter minWidths={{ default: "100%", md: "50%", lg: "33.33%", xl: "25%" }}>
          {cards.map((card, index) => (
            <GalleryItem key={index}>
              <Card isFullHeight>
                <CardTitle>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {card.icon}
                    {card.title}
                  </div>
                </CardTitle>
                <CardBody>{card.description}</CardBody>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </PageSection>
    </>
  );
};

export default Dashboard;
