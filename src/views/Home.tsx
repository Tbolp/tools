import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Avatar,
  Container,
  AppBar,
  Toolbar,
  Paper,
} from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import ImageIcon from '@mui/icons-material/Image';
import FunctionsIcon from '@mui/icons-material/Functions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PianoIcon from '@mui/icons-material/Piano';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import AppsIcon from '@mui/icons-material/Apps';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

interface Tool {
  id: string;
  name: string;
  description: string;
  details: string;
  category: string;
  icon: React.ReactNode;
  color: string;
}

export default function Home() {
  const toolsData: Tool[] = [
    {
      id: 'cheese',
      name: 'Cheese',
      description: 'Chinese Chess (Xiangqi) game',
      details: 'Play traditional Chinese Chess with an interactive board. Features include move validation, game rules enforcement, and an intuitive interface for chess enthusiasts.',
      category: 'Game',
      icon: <SportsEsportsIcon />,
      color: '#f57c00',
    },
    {
      id: 'gaussian',
      name: 'Gaussian',
      description: 'Gaussian blur filter for images',
      details: 'Apply Gaussian blur effect to your images with adjustable intensity and radius. Perfect for creating smooth, professional-looking blur effects.',
      category: 'Image',
      icon: <ImageIcon />,
      color: '#1976d2',
    },
    {
      id: 'julia',
      name: 'Julia',
      description: 'Julia set fractal generator',
      details: 'Generate beautiful Julia set fractals with real-time rendering and customizable mathematical parameters.',
      category: 'Graphics',
      icon: <BlurOnIcon />,
      color: '#7b1fa2',
    },
    {
      id: 'mandelbrot',
      name: 'Mandelbrot',
      description: 'Mandelbrot set visualization',
      details: 'Explore the famous Mandelbrot set with interactive zoom and high-resolution rendering capabilities.',
      category: 'Graphics',
      icon: <BlurOnIcon />,
      color: '#c2185b',
    },
    {
      id: 'pinao',
      name: 'Piano',
      description: 'Virtual piano instrument',
      details: 'An interactive virtual piano with multiple octaves, sound synthesis, and recording features.',
      category: 'Audio',
      icon: <PianoIcon />,
      color: '#2e7d32',
    },
    {
      id: 'player',
      name: 'Player',
      description: 'Media player interface',
      details: 'A full-featured media player supporting multiple formats with playlist management and controls.',
      category: 'Media',
      icon: <PlayArrowIcon />,
      color: '#0288d1',
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Raw image format viewer',
      details: 'Display raw image formats including RGB, YUV, and other uncompressed pixel data. Perfect for viewing and analyzing raw image files with custom resolution and format settings.',
      category: 'Image',
      icon: <VisibilityIcon />,
      color: '#5e35b1',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <AppsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Creative Toolkit
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            v1.0.0
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            padding: 4,
            mt: 4,
            mb: 4,
          }}
        >
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Welcome to Creative Toolkit
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: '800px' }}>
            A comprehensive suite of creative and computational tools designed to enhance your productivity. 
            From mathematical visualizations to media processing, everything you need in one place.
          </Typography>
        </Paper>

        {/* Tools Section */}
        <Box sx={{ pb: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              Available Tools
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select a tool below to get started with your creative project
            </Typography>
          </Box>

          <Grid container spacing={3}>
          {toolsData.map((tool) => (
            <Grid item xs={12} sm={6} md={4} key={tool.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: tool.color,
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      {tool.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold">
                        {tool.name}
                      </Typography>
                      <Chip
                        label={tool.category}
                        size="small"
                        sx={{ mt: 0.5 }}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                    {tool.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tool.details}
                  </Typography>
                </CardContent>
                <CardActions sx={{ padding: 2, pt: 0 }}>
                  <Button
                    component={Link}
                    to={tool.id}
                    size="small"
                    variant="contained"
                    fullWidth
                  >
                    Launch Tool
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        </Box>
      </Container>
      <Outlet />
    </Box>
  );
}