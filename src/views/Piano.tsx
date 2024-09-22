import { Button, Container } from "@mui/material";
import { useEffect, useRef } from "react";
import { FSM, FSMBuilder } from "../utils/FSM";

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
  scale: number = 1
  map: Map<string, number>
  keys: Key[] = []
  freqs = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392, 415.3, 440, 466.16, 493.88]
  constructor() {
    this.ctx = new AudioContext()
    this.map = new Map()
    this.map.set('z', this.freqs[0])
    this.map.set('s', this.freqs[1])
    this.map.set('x', this.freqs[2])
    this.map.set('d', this.freqs[3])
    this.map.set('c', this.freqs[4])
    this.map.set('v', this.freqs[5])
    this.map.set('g', this.freqs[6])
    this.map.set('b', this.freqs[7])
    this.map.set('h', this.freqs[8])
    this.map.set('n', this.freqs[9])
    this.map.set('j', this.freqs[10])
    this.map.set('m', this.freqs[11])
    this.initKey()
  }
  initKey() {
    let white = new Map<number, number>()
    white.set(0, 0)
    white.set(1, 2)
    white.set(2, 4)
    white.set(3, 5)
    white.set(4, 7)
    white.set(5, 9)
    white.set(6, 11)
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 7; i++) {
        let key = new Key()
        key.area[0] = j * 140 + i * 20
        key.area[1] = 0
        key.area[2] = 19
        key.area[3] = 80
        key.fre = this.freqs[white.get(i)!]
        if (j == 0) {
          key.fre = key.fre * 0.5
        } else if (j == 2) {
          key.fre = key.fre * 2
        }
        this.keys.push(key)
      }
    }
    let black = new Map<number, number>()
    black.set(0, 1)
    black.set(1, 3)
    black.set(2, 6)
    black.set(3, 8)
    black.set(4, 10)
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 6; i++) {
        if (i == 2) {
          continue
        }
        let key = new Key()
        key.type = 1
        key.area[0] = j * 140 + (i + 1) * 20 - 7.5
        key.area[1] = -5
        key.area[2] = 15
        key.area[3] = 60
        key.fre = this.freqs[black.get(i)!]
        if (j == 0) {
          key.fre = key.fre * 0.5
        } else if (j == 2) {
          key.fre = key.fre * 2
        }
        this.keys.push(key)
      }
    }
  }
  onKey(key: string) {
    let fre = this.map.get(key)
    if (fre) {
      let node = this.ctx.createBufferSource()
      node.buffer = create_buf(this.ctx, fre * this.scale, 0.5)
      node.connect(this.ctx.destination)
      node.start()
    }
  }
  up() {
    this.scale = 2
  }
  down() {
    this.scale = 0.5
  }
  u2n() {
    if (this.scale === 2) {
      this.scale = 1
    }
  }
  d2n() {
    if (this.scale === 0.5) {
      this.scale = 1
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 1000, 1000)
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, 1000, 1000)
    ctx.save()
    ctx.scale(2, 2)
    ctx.translate(10, 0)
    for (let key of this.keys) {
      if (key.type == 0) {
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
  useEffect(() => {
    let app = new App()
    elt.current!.onkeydown = (e) => {
      app.onKey(e.key)
      if (e.key === '[') {
        app.down()
      } else if (e.key === ']') {
        app.up()
      }
      e.preventDefault()
    }
    elt.current!.onkeyup = (e) => {
      if (e.key === '[') {
        app.d2n()
      } else if (e.key === ']') {
        app.u2n()
      }
      e.preventDefault()
    }
    elt.current!.onmousedown = (e) => {
      console.log(e)
    }
    app.draw(elt.current!.getContext('2d')!)
  })
  return (
    <Container>
      <canvas width={880} height={160} tabIndex={1} ref={elt} style={{ width: "100%" }} />
    </Container>
  )
}