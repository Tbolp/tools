import { Container } from "@mui/material";
import _ from "lodash";
import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

class App {
  private _points: Point[] = []
  private _vec = 1
  private _ctx: CanvasRenderingContext2D
  private _start = 0
  private _cur: Point = { x: 0, y: 0 }
  private _angle = 0

  constructor(private points: Point[], private _radius: number, private _elt: HTMLCanvasElement, unit: number) {
    this._points = _.cloneDeep(points);
    let ctx = this._elt.getContext('2d')!
    ctx.translate(this._elt.width * 0.5, this._elt.height * 0.5)
    ctx.scale(unit, -unit)
    ctx.save()
    this._ctx = ctx
    this._cur = _.cloneDeep(points[0])
    for (let pt of this._points) {
      this._ctx.fillStyle = '#ff0000'
      this._ctx.beginPath()
      this._ctx.ellipse(pt.x, pt.y, 0.05, 0.05, 0, 0, Math.PI * 2)
      this._ctx.fill()
    }
  }

  run() {
    let pre = _.cloneDeep(this._cur)
    const interval = 30 / 1000
    const next = (this._start + 1) % this._points.length
    const len1 = interval * this._vec
    let x = this._points[next].x - this._points[this._start].x
    let y = this._points[next].y - this._points[this._start].y
    x = x / Math.sqrt(x * x + y * y)
    y = y / Math.sqrt(x * x + y * y)
    let nx = this._cur.x + len1 * x
    let ny = this._cur.y + len1 * y
    let len2 = (this._points[next].x - this._cur.x) * (this._points[next].x - this._cur.x) + (this._points[next].y - this._cur.y) * (this._points[next].y - this._cur.y)
    let realLen = 0
    if (len2 > len1) {
      realLen = len1
      this._cur.x = nx
      this._cur.y = ny
    } else {
      realLen = len2
      this._cur.x = this._points[next].x
      this._cur.y = this._points[next].y
      this._start = next
    }
    let preAngle = this._angle
    this._angle += realLen / this._radius

    this._ctx.restore()
    this._ctx.strokeStyle = 'blue'
    this._ctx.lineWidth = 0.01
    this._ctx.beginPath()
    this._ctx.moveTo(pre.x + this._radius * Math.cos(preAngle), pre.y + this._radius * Math.sin(preAngle))
    this._ctx.lineTo(this._cur.x + this._radius * Math.cos(this._angle), this._cur.y + this._radius * Math.sin(this._angle))
    // this._ctx.ellipse(this._cur.x, this._cur.y, 0.1, 0.1, 0, 0, Math.PI * 2)
    this._ctx.stroke()
  }

}

export default function Cycloid() {
  let elt = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let needStop = false
    if (elt.current) {
      let app = new App([{ x: 0, y: 0 }, { x: 0, y: 1 }], 0.3, elt.current, 100)
      // for (let i = 0; i < 1; i++) {
      //   app.run()
      // }
      let callback = () => {
        if (needStop) {
          return
        }
        app.run()
        requestAnimationFrame(callback)
      }
      requestAnimationFrame(callback)
    }
    return () => {
      needStop = true
    }
  }, [])
  return (
    <Container>
      <canvas width={500} height={500} style={{ backgroundColor: 'gray' }} ref={elt}></canvas>
    </Container>
  )
}