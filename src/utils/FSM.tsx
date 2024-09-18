
export interface State {
  [x: string]: any
  onEnter?(): void
  onExit?(): void
  on?(evt: Event): string
}

export interface Event {
  name: string
  data: any
}

export interface FSM {
  onEvent(evt: Event): void
}

export type StateBuilder = () => State

export class FSMBuilder {
  private _state_map: Map<string, StateBuilder> = new Map()

  registerState(name: string, builder: StateBuilder): FSMBuilder {
    this._state_map.set(name, builder)
    return this
  }

  build(st: string): FSM {
    return new FSMImpl(this._state_map, st)
  }
}

class FSMImpl implements FSM {
  private _state_map: Map<string, StateBuilder> = new Map()
  private _state: State
  private _state_name: string

  constructor(state_map: Map<string, StateBuilder>, st: string) {
    this._state_map = new Map(state_map)
    this._state_name = st
    this._state = this._state_map.get(st)!()
    this._state.onEnter?.()
  }

  onEvent(evt: Event): void {
    let ret = ''
    if ((this._state as any)[`on${evt.name}`]) {
      ret = (this._state as any)[`on${evt.name}`]() as string
    } else {
      ret = this._state.on?.(evt) as string
    }
    if (ret && ret !== "") {
      console.debug(`FSM: ${evt.name}: ${this._state_name} -> ${ret}`)
      let state = this._state_map.get(ret)!()
      this._state.onExit?.()
      this._state = state
      this._state_name = ret
      this._state.onEnter?.()
    } else {
      console.debug(`FSM: ${evt.name}: ${this._state_name}`)
    }
  }

}
