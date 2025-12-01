import * as React from 'react'
import { useState, Suspense, lazy } from 'react'
import './App.css';
import { AppBar, Container, Drawer, IconButton, Toolbar, Typography, Box, List, LinkProps, ListItemButton, ListItemText, Divider, ListItemIcon, Button } from '@mui/material';
import { MenuOutlined, AccountBalanceOutlined, Pin } from '@mui/icons-material'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
const Player = lazy(() => import('./views/Player'))
const Viewer = lazy(() => import('./views/Viewer'))
const Cheese = lazy(() => import('./views/Cheese'))
const Julia = lazy(() => import('./views/Julia'))
const Mandelbrot = lazy(() => import('./views/Mandelbrot'))
const Gaussian = lazy(() => import('./views/Gaussian'))
const ImageEffect = lazy(() => import('./views/ImageEffect'))
const Piano = lazy(() => import('./views/Piano'))
const Home = lazy(() => import('./views/Home'))

function App() {
  return (
    <Box>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path={process.env.PUBLIC_URL} >
              <Route index Component={Home} />
              <Route path='julia' Component={Julia} />
              <Route path='pinao' Component={Piano} />
              <Route path='cheese' Component={Cheese} />
              <Route path='player' Component={Player} />
              <Route path='viewer' Component={Viewer} />
              <Route path='mandelbrot' Component={Mandelbrot} />
              <Route path='gaussian' Component={Gaussian} />
              <Route path='imageeffect' Component={ImageEffect} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Box >
  );
}

export default App;
