import React from 'react';
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Flex,
  FlexItem,
  Label
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrendUpIcon,
  UsersIcon,
  ServerIcon
} from '@patternfly/react-icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const chartData = [
  { name: 'Mon', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Tue', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Wed', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Thu', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Fri', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Sat', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Sun', uv: 3490, pv: 4300, amt: 2100 },
];

export const Dashboard: React.FC = () => {
  return (
    <>
      <PageSection>
        <div>
          <Title headingLevel="h1" size="2xl">Executive Dashboard</Title>
          <p style={{ marginTop: '0.5rem' }}>Real-time overview of system performance and business metrics.</p>
        </div>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          {/* KPI Cards */}
          <GridItem span={12} md={6} xl={3}>
            <Card isCompact>
              <CardTitle>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>Total Revenue</FlexItem>
                    <FlexItem><TrendUpIcon color="green" /></FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Title headingLevel="h2" size="3xl">$124,500</Title>
              </CardBody>
              <CardFooter>
                 <Label color="green" icon={<TrendUpIcon />}>+12% this week</Label>
              </CardFooter>
            </Card>
          </GridItem>

          <GridItem span={12} md={6} xl={3}>
            <Card isCompact>
              <CardTitle>
                 <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>Active Users</FlexItem>
                    <FlexItem><UsersIcon color="#0066CC" /></FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Title headingLevel="h2" size="3xl">1,240</Title>
              </CardBody>
              <CardFooter>
                 <Label color="blue">Active now</Label>
              </CardFooter>
            </Card>
          </GridItem>

          <GridItem span={12} md={6} xl={3}>
            <Card isCompact>
                <CardTitle>
                 <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>System Health</FlexItem>
                    <FlexItem><ServerIcon /></FlexItem>
                </Flex>
                </CardTitle>
              <CardBody>
                <Title headingLevel="h2" size="3xl">99.9%</Title>
              </CardBody>
              <CardFooter>
                 <Label color="green" icon={<CheckCircleIcon />}>Operational</Label>
              </CardFooter>
            </Card>
          </GridItem>

            <GridItem span={12} md={6} xl={3}>
            <Card isCompact>
               <CardTitle>
                 <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>Pending Alerts</FlexItem>
                    <FlexItem><ExclamationTriangleIcon color="orange" /></FlexItem>
                </Flex>
               </CardTitle>
              <CardBody>
                <Title headingLevel="h2" size="3xl">3</Title>
              </CardBody>
              <CardFooter>
                 <Label color="orange">Requires attention</Label>
              </CardFooter>
            </Card>
          </GridItem>

          {/* Charts Row */}
          <GridItem span={12} xl={8}>
            <Card style={{ height: '400px' }}>
              <CardTitle>Traffic Overview</CardTitle>
              <CardBody>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area type="monotone" dataKey="uv" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={12} xl={4}>
            <Card style={{ height: '400px' }}>
              <CardTitle>Server Load</CardTitle>
              <CardBody>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="pv" fill="#0066CC" />
                    </BarChart>
                 </ResponsiveContainer>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};
