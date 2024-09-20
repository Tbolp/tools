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
  area = [0, 0, 0, 0]
  fre = 0
}

class App {
  ctx: AudioContext
  scale: number = 1
  map: Map<string, number>
  keys: Key[] = []
  constructor() {
    this.ctx = new AudioContext()
    this.map = new Map()
    this.map.set('a', 220.63)
    this.map.set('z', 261.63)
    this.map.set('s', 277.18)
    this.map.set('x', 293.66)
    this.map.set('d', 311.13)
    this.map.set('c', 329.63)
    this.map.set('v', 349.23)
    this.map.set('g', 369.99)
    this.map.set('b', 392)
    this.map.set('h', 415.3)
    this.map.set('n', 440)
    this.map.set('j', 466.16)
    this.map.set('m', 493.88)
    this.map.set('k', 523.25)
    this.initKey()
  }
  initKey() {
    for (let i = 0; i < 21; i++) {
      let key = new Key()
      key.area[0] = i * 20
      key.area[1] = 0
      key.area[2] = 19
      key.area[3] = 80
      this.keys.push(key)
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
    ctx.save()
    ctx.translate(20, 0)
    for (let key of this.keys) {
      ctx.fillStyle = '#eeeeee'
      ctx.roundRect(key.area[0], key.area[1], key.area[2], key.area[3])
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
      console.log(e.key)
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
    app.draw(elt.current!.getContext('2d')!)
  })
  return (
    <Container>
      <canvas width={440} height={80} tabIndex={1} ref={elt}></canvas>
    </Container>
  )
}