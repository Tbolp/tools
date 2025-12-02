import { Button, Container, Typography, Paper, Box, Alert, Grid, Chip, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { FSM, FSMBuilder } from "../utils/FSM";
import Markdown from "react-markdown";
import PianoIcon from '@mui/icons-material/Piano';
import KeyboardIcon from '@mui/icons-material/Keyboard';

function create_buf(ctx: AudioContext, fre: number, dur: number) {
  let sample_rate = 16000
  let buf = ctx.createBuffer(1, dur * sample_rate, sample_rate)
  let data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = 0.8 * Math.sin(i / sample_rate * 2 * Math.PI * fre) * (dur - i / sample_rate)
  }
  return buf
}

class Key {
  type = 0
  area = [0, 0, 0, 0]
  fre = 0
}

class App {
  ctx: AudioContext
  keys: Key[] = []
  str2key: Map<string, Key> = new Map()

  constructor() {
    this.ctx = new AudioContext()
    this.initKey()
  }
  initKey() {
    const freqs = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88]
    let white = [0, 2, 4, 5, 7, 9, 11]
    let keyStrList = ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 7; i++) {
        let key = new Key()
        key.area[0] = j * 140 + i * 20
        key.area[1] = 0
        key.area[2] = 19
        key.area[3] = 80
        key.fre = freqs[white[i]]
        let keyStr = keyStrList[i]
        if (j === 0) {
          key.fre = key.fre * 0.5
          keyStr = '[' + keyStr
        } else if (j === 2) {
          key.fre = key.fre * 2
          keyStr = ']' + keyStr
        }
        this.str2key.set(keyStr, key)
        this.keys.push(key)
      }
    }
    let black = [1, 3, -1, 6, 8, 10]
    keyStrList = ['s', 'd', '', 'g', 'h', 'j']
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 6; i++) {
        if (i === 2) {
          continue
        }
        let key = new Key()
        key.type = 1
        key.area[0] = j * 140 + (i + 1) * 20 - 7.5
        key.area[1] = -5
        key.area[2] = 15
        key.area[3] = 60
        key.fre = freqs[black[i]]
        let keyStr = keyStrList[i]
        if (j === 0) {
          keyStr = '[' + keyStr
          key.fre = key.fre * 0.5
        } else if (j === 2) {
          keyStr = ']' + keyStr
          key.fre = key.fre * 2
        }
        this.str2key.set(keyStr, key)
        this.keys.push(key)
      }
    }
  }

  onKey(keyStr: string) {
    console.log(keyStr)
    let key = this.str2key.get(keyStr)
    if (key) {
      this.press(key)
    }
  }
  private press(key: Key) {
    let node = this.ctx.createBufferSource()
    node.buffer = create_buf(this.ctx, key.fre, 0.5)
    node.connect(this.ctx.destination)
    node.start()
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 1000, 1000)
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, 1000, 1000)
    ctx.save()
    ctx.scale(2, 2)
    ctx.translate(10, 0)
    for (let key of this.keys) {
      if (key.type === 0) {
        ctx.fillStyle = '#eeeeee'
      } else {
        ctx.fillStyle = '#222222'
      }
      ctx.beginPath()
      ctx.roundRect(key.area[0], key.area[1], key.area[2], key.area[3], 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

export default function Piano() {
  let elt = useRef<HTMLCanvasElement>(null)
  let keyStatus = useRef<[boolean, boolean]>([false, false])
  const [octave, setOctave] = useState(0)

  useEffect(() => {
    let app = new App()

    // Handle keydown events at document level
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent key events when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      setOctave((val) => {
        let prefix = val === -1 ? '[' : val === 1 ? ']' : ''
        const key = prefix + e.key.toLowerCase()
        app.onKey(key)
        return val
      })

      // Handle octave controls
      if (e.key === '[') {
        keyStatus.current[0] = true
        setOctave(-1)
      } else if (e.key === ']') {
        keyStatus.current[1] = true
        setOctave(1)
      }
      e.preventDefault()
    }

    // Handle keyup events at document level
    const handleKeyUp = (e: KeyboardEvent) => {
      // Prevent key events when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === '[') {
        keyStatus.current[0] = false
      } else if (e.key === ']') {
        keyStatus.current[1] = false
      }

      setOctave((val) => {
        if (keyStatus.current[0] === false && keyStatus.current[1] === false) {
          return 0
        } else if (keyStatus.current[0] && keyStatus.current[1] === false) {
          return -1
        } else if (keyStatus.current[1] && keyStatus.current[0] === false) {
          return 1
        }
        return val
      })
      e.preventDefault()
    }

    // Attach event listeners to document
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // Draw the piano
    if (elt.current) {
      app.draw(elt.current.getContext('2d')!)
    }

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <Container maxWidth="lg" sx={{ mb: '2em', mt: '2em' }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Virtual Piano
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          An interactive virtual piano with keyboard controls. Play music using your computer keyboard
          with support for multiple octaves and sound synthesis.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>How to use:</strong> Click on the piano canvas to focus it, then use your keyboard to play notes.
          Press [ or ] keys to change octaves.
        </Alert>
      </Paper>

      {/* Keyboard Guide Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          1. Keyboard Controls
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on the piano below to activate keyboard controls
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                Musical Notes
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Z" size="small" />
                  <Typography variant="body2">C</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="S" size="small" />
                  <Typography variant="body2">C#</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="X" size="small" />
                  <Typography variant="body2">D</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="D" size="small" />
                  <Typography variant="body2">D#</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="C" size="small" />
                  <Typography variant="body2">E</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="V" size="small" />
                  <Typography variant="body2">F</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                Musical Notes (continued)
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="G" size="small" />
                  <Typography variant="body2">F#</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="B" size="small" />
                  <Typography variant="body2">G</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="H" size="small" />
                  <Typography variant="body2">G#</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="N" size="small" />
                  <Typography variant="body2">A</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="J" size="small" />
                  <Typography variant="body2">A#</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="M" size="small" />
                  <Typography variant="body2">B</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="warning.dark">
            Octave Controls
          </Typography>
          <Stack direction="row" spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="[" size="small" color="warning" variant="outlined" />
              <Typography variant="body2">Lower octave (hold)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="]" size="small" color="warning" variant="outlined" />
              <Typography variant="body2">Raise octave (hold)</Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* Status Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          2. Current Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Octave:
          </Typography>
          <Chip
            label={octave === -1 ? 'Lower' : octave === 1 ? 'Higher' : 'Normal'}
            color={octave === -1 ? 'info' : octave === 1 ? 'error' : 'success'}
            icon={<PianoIcon />}
          />
        </Box>
      </Paper>

      {/* Piano Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          3. Interactive Piano
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the piano to focus, then use your keyboard to play
        </Typography>

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          p: 3,
          borderRadius: 1,
          border: '2px solid #e0e0e0'
        }}>
          <canvas
            width={880}
            height={160}
            ref={elt}
            style={{
              width: "100%",
              maxWidth: '880px',
              cursor: 'pointer',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
        </Box>
      </Paper>
    </Container>
  )
}

