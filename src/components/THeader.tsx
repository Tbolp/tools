import { Alert, Paper, Typography } from "@mui/material"
import { ReactNode } from "react";
import './THeader.css'

export function THeader(props: {
  title: string,
  desp: string,
  tips: string
}) {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        {props.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {props.desp}
      </Typography>
      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>How to use:</strong> {props.tips}
      </Alert>
    </Paper>
  )
}

export function TSection(props: {
  title: string,
  desp: string,
  children?: ReactNode
}) {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        {props.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {props.desp}
      </Typography>
      {props.children}
    </Paper>
  )
}

export function TDesp(props: {
  children?: ReactNode,
}) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {props.children}
    </Typography>
  )
}
