import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Box,
  Paper,
  Container,
  AppBar,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { Link, Outlet } from 'react-router-dom';

interface Item {
  id: number;
  title: string;
  description: string;
}

export default function Home() {
  let items = ['cheese', 'gaussian', 'julia', 'mandelbrot', 'pinao', 'player', 'viewer']
  return (
    <Container>
      <List>
        {items.map((item, index) => {
          return (
            <ListItem key={index}>
              <Link to={item}>{item}</Link>
            </ListItem>
          )
        })}
      </List>
      <Outlet />
    </Container>
  );
}