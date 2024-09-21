import * as React from 'react'
import { useState, Suspense, lazy } from 'react'
import './App.css';
import { AppBar, Container, Drawer, IconButton, Toolbar, Typography, Box, List, LinkProps, ListItemButton, ListItemText, Divider, ListItemIcon, Button } from '@mui/material';
import { MenuOutlined, AccountBalanceOutlined } from '@mui/icons-material'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
const Player = lazy(() => import('./views/Player'))
const Viewer = lazy(() => import('./views/Viewer'))
const Cheese = lazy(() => import('./views/Cheese'))
const Julia = lazy(() => import('./views/Julia'))
const Mandelbrot = lazy(() => import('./views/Mandelbrot'))
const Gaussian = lazy(() => import('./views/Gaussian'))
const ImageEffect = lazy(() => import('./views/ImageEffect'))
const Piano = lazy(() => import('./views/Piano'))

function createRoutes(routes: any[][]) {
  let elts_1 = []
  let elts_2 = []
  for (let i = 0; i < routes.length; i++) {
    let it = routes[i]
    let elt = (
      <ListItemButton component={Link} to={it[0]}>
        <ListItemText key={i} primary={it[1]} />
      </ListItemButton>
    )
    elts_1.push(elt)
    elt = (
      <Route path={it[0]} Component={it[2]} />
    )
    elts_2.push(elt)
  }
  return [elts_1, elts_2]
}

const routes_info = [
  ["tools/cheese", "CHEESE", Cheese],
  ["tools/player", "PLAYER", Player],
  ["tools/viewer", "VIEWER", Viewer],
  ["tools/julia", "JULIA", Julia],
  ["tools/mandelbrot", "MANDELBROT", Mandelbrot],
  ["tools/gaussian", "GAUSSIAN", Gaussian],
  // ["tools/besizer", "BESIZER", Besizer],
  ["tools/piano", "PIANO", Piano],
]

function App() {
  let [menu, set_menu] = useState(false)
  let routes = createRoutes(routes_info)
  return (
    <Box>
      <BrowserRouter>
        <Drawer anchor='left' open={menu} onClose={(e) => {
          set_menu((val) => !val)
        }}>
          <Box onClick={() => {
            set_menu((val) => !val)
          }}>
            <List>
              <ListItemIcon sx={{ width: '12em', display: 'flex', justifyContent: 'center' }}>
                <AccountBalanceOutlined />
              </ListItemIcon>
            </List>
            <Divider />
            <List>
              {routes[0]}
            </List>
            <Divider />
          </Box>
        </Drawer>
        <AppBar position='static'>
          <Toolbar>
            <IconButton aria-label='menu' edge='start' color='inherit' sx={{ mr: 2 }} onClick={() => {
              set_menu((val) => !val)
            }}>
              <MenuOutlined />
            </IconButton>
            <Typography>Tools</Typography>
          </Toolbar>
        </AppBar>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {routes[1]}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Box >
  );
}

export default App;
