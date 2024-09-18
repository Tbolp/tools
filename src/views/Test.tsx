import { useEffect, useRef } from "react";
import { FSM, FSMBuilder, State } from "../utils/FSM";
class Person {
  private _fsm: FSM
  private _fsm2: FSM
  public pos = [0, 0]
  public vec = [0, 0]
  public acc = [0, 0]
  constructor() {
    this._fsm = new FSMBuilder()
      .registerState('stand', () => {
        return {
          onEnter: () => {
            this.vec[1] = 0
            this.acc[1] = 0
          },
          onK: () => {
            return 'jump'
          }
        } as State
      })
      .registerState('jump', () => {
        return {
          onEnter: () => {
            this.vec[1] = 150
            this.acc[1] = -600
          },
          onSTAND: () => {
            return 'stand'
          },
          onD: () => {
            this.vec[0] = 100
          }
        }
      })
      .build('stand')
    this._fsm2 = new FSMBuilder()
      .registerState('stand', () => {
        return {
          onA: () => {
            this.vec[0] = -150
          },
          onD: () => {
            this.vec[0] = 150
          },
          onUD: () => {
            if (this.vec[0] > 0) {
              this.vec[0] = 0
            }
          },
          onUA: () => {
            if (this.vec[0] < 0) {
              this.vec[0] = 0
            }
          },
        } as State
      })
      .build('stand')
  }
  onEvent(key: string) {
    this._fsm.onEvent({ name: key.toUpperCase(), data: null })
    this._fsm2.onEvent({ name: key.toUpperCase(), data: null })
  }
}

export default function Test() {
  let elt = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let person = new Person()
    elt.current!.addEventListener('keydown', (evt) => {
      person.onEvent(evt.key)
    })
    elt.current!.onkeyup = (evt) => {
      person.onEvent(`U${evt.key}`)
    }
    let ctx = elt.current!.getContext('2d')!
    let previous_ts = Date.now()
    let render = (ts: DOMHighResTimeStamp) => {
      let dt = (Date.now() - previous_ts) / 1000
      previous_ts = Date.now()
      person.vec[1] += person.acc[1] * dt
      person.pos[0] += person.vec[0] * dt
      person.pos[1] += person.vec[1] * dt
      if (person.pos[1] < 0) {
        person.pos[1] = 0
        person.onEvent('STAND')
      }
      ctx.clearRect(0, 0, 1000, 1000)
      ctx.save()
      ctx.translate(0, 400)
      ctx.scale(1, -1)
      ctx.fillRect(person.pos[0], person.pos[1], 10, 20)
      ctx.restore()
      requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
  })
  return (
    <canvas tabIndex={1} width={400} height={400} ref={elt} />
  )
}