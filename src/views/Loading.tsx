import * as React from 'react'
import { Container, Box, CircularProgress, Typography } from "@mui/material"
import { useEffect, useState } from 'react'

export default function Loading() {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length >= 3) {
          return '.'
        }
        return prevDots + '.'
      })
    }, 500)

    return () => {
      clearInterval(dotsTimer)
    }
  }, [])

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3
        }}
      >
        {/* 转圈动画 */}
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: 'primary.main',
          }}
        />

        {/* 加载文字 */}
        <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
          Loading{dots}
        </Typography>
      </Box>
    </Container>
  )
}