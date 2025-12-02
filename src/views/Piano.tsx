import { Button, Container, Typography, Paper, Box, Alert, Grid, Chip, Stack, FormControl, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { FSM, FSMBuilder } from "../utils/FSM";
import Markdown from "react-markdown";
import PianoIcon from '@mui/icons-material/Piano';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import TouchAppIcon from '@mui/icons-material/TouchApp'

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
  isKeep = false
  isTouch = false
}

interface TouchInfo extends Touch {
  key: Key
}

class App {
  private ctx: AudioContext
  private keys: Key[] = []
  private str2key: Map<string, Key> = new Map()
  private _renderCtx: CanvasRenderingContext2D | null = null
  private _showCircle = true

  set showCircle(val: boolean) {
    this._showCircle = val
  }

  set renderCtx(ctx: CanvasRenderingContext2D | null) {
    this._renderCtx = ctx
    this.draw()
  }

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
    // console.log(keyStr)
    let key = this.str2key.get(keyStr)
    if (key) {
      this.press(key)
    }
  }

  private touchList: TouchInfo[] = []

  onTouch(e: TouchEvent) {
    let keys = new Set<Key>
    for (let it of e.touches) {
      let touchKey: Key | null = null
      let rect = (e.target as HTMLElement).getBoundingClientRect()
      let x = (it.clientX - rect.left) / rect.width * 420
      let y = (it.clientY - rect.top) / rect.height * 80
      // console.log(x, y)
      for (let key of this.keys) {
        if (key.type == 1) {
          if (x > key.area[0] &&
            x < key.area[0] + key.area[2] &&
            y > key.area[1] &&
            y < key.area[1] + key.area[3]) {
            touchKey = key
            break
          }
        }
      }
      if (touchKey == null) {
        for (let key of this.keys) {
          if (key.type == 0) {
            if (x > key.area[0] &&
              x < key.area[0] + key.area[2] &&
              y > key.area[1] &&
              y < key.area[1] + key.area[3]) {
              touchKey = key
              break
            }
          }
        }
      }
      if (touchKey != null) {
        keys.add(touchKey)
      }
    }
    // console.log(keys, this.keys)
    for (let key of this.keys) {
      if (key.isTouch == true) {
        if (!keys.has(key)) {
          key.isTouch = false
        }
      } else {
        if (keys.has(key)) {
          key.isTouch = true
          this.press(key)
        }
      }
    }
    e.preventDefault()
  }

  private press(key: Key) {
    let node = this.ctx.createBufferSource()
    node.buffer = create_buf(this.ctx, key.fre, 0.5)
    node.connect(this.ctx.destination)
    node.start()
    key.isKeep = true
    this.draw()
    node.onended = () => {
      key.isKeep = false
      this.draw()
    }
  }

  draw() {
    if (this._renderCtx === null) {
      return
    }
    let ctx = this._renderCtx
    ctx.clearRect(0, 0, 1000, 1000)
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, 1000, 1000)
    ctx.save()
    ctx.translate(1, 0)
    ctx.scale(2, 2)

    for (let key of this.keys) {
      if (key.type === 0) {
        ctx.fillStyle = '#eeeeee'
      } else {
        ctx.fillStyle = '#222222'
      }
      ctx.beginPath()
      ctx.roundRect(key.area[0], key.area[1], key.area[2], key.area[3], 2)
      ctx.fill()
      if (key.isTouch) {
        ctx.fillStyle = '#1e8fe088'
        ctx.beginPath()
        ctx.roundRect(key.area[0], key.area[1], key.area[2], key.area[3], 2)
        ctx.fill()
      }
    }
    for (let key of this.keys) {
      if (key.isKeep && this._showCircle) {
        ctx.fillStyle = '#1e8fe0ff'
        ctx.beginPath()
        ctx.ellipse(key.area[0] + key.area[2] * 0.5, key.area[1] + (key.area[3] - key.area[1]) * 0.8, 3, 3, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }
}

export default function Piano() {
  const [controlMode, setControlMode] = useState<'keyboard' | 'touch'>('keyboard');

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
          <strong>How to use:</strong> Choose your control mode below, then either use your keyboard or touch the piano keys to play notes.
        </Alert>
      </Paper >
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          1. Control Mode
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose how you want to control the piano:
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={controlMode}
            onChange={(e) => setControlMode(e.target.value as 'keyboard' | 'touch')}
          >
            <FormControlLabel
              value="keyboard"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyboardIcon />
                  <Typography>Keyboard</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="touch"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TouchAppIcon />
                  <Typography>Touch</Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          {controlMode === 'keyboard' && (<Alert severity="info">
            {
              'Use your computer keyboard to play notes. Click on the piano to focus, then use keys Z-X-C-V-B-N-M for white keys and S-D-G-H-J for black keys.'
            }
          </Alert>)
          }
        </Box>
      </Paper>
      {controlMode === 'keyboard' ? <KeyboardPiano /> : <TouchPiano />}
    </Container>
  )
}

function KeyboardPiano() {
  let elt = useRef<HTMLCanvasElement>(null)
  let keyStatus = useRef<Map<string, boolean>>(new Map())
  const [octave, setOctave] = useState(0)

  useEffect(() => {
    let app = new App()

    // Handle keydown events at document level
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyStatus.current.has(e.key)) {
        if (keyStatus.current.get(e.key)) {
          return
        } else {
          keyStatus.current.set(e.key, true)
        }
      } else {
        keyStatus.current.set(e.key, true)
      }

      // Prevent key events when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      setOctave((val) => {
        let prefix = val === -1 ? '[' : val === 1 ? ']' : ''
        const key = prefix + e.key.toLowerCase()
        app.onKey(key)
        if (e.key === '[') {
          return -1
        } else if (e.key === ']') {
          return 1
        }
        return val
      })
      e.preventDefault()
    }

    // Handle keyup events at document level
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keyStatus.current.has(e.key)) {
        if (keyStatus.current.get(e.key) === true) {
          keyStatus.current.set(e.key, false)
        } else {
          return
        }
      } else {
        return
      }
      // Prevent key events when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      setOctave((val) => {
        if (keyStatus.current.get('[') === false && keyStatus.current.get(']') === false) {
          return 0
        } else if (keyStatus.current.get('[') && keyStatus.current.get(']') === false) {
          return -1
        } else if (keyStatus.current.get('[') === false && keyStatus.current.get(']')) {
          return 1
        }
        return val
      })
      e.preventDefault()
    }

    keyStatus.current.set('[', false)
    keyStatus.current.set(']', false)

    // Attach event listeners to document
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // Draw the piano
    if (elt.current) {
      app.renderCtx = elt.current.getContext('2d')
    }

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <>
      {/* Keyboard Guide Section */}
      < Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          2. Keyboard Controls
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
      </Paper >

      {/* Status Section */}
      < Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          3. Current Status
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
      </Paper >

      {/* Piano Section */}
      < Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          4. Interactive Piano
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use your keyboard to play
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
            width={840}
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
      </Paper >
    </>
  )
}

function TouchPiano() {
  let elt = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let app = new App
    app.showCircle = false
    if (elt.current) {
      app.renderCtx = elt.current.getContext('2d')
      elt.current.addEventListener('touchstart', (e) => app.onTouch(e))
      elt.current.addEventListener('touchmove', (e) => app.onTouch(e))
      elt.current.addEventListener('touchend', (e) => app.onTouch(e))
    }
  }, [])

  return (
    <>
      {/* Piano Section */}
      < Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          4. Interactive Piano
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Press piano to play
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
            width={840}
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
      </Paper >
    </>
  )
}