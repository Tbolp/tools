import { Box, Slider, Stack } from "@mui/material"

export interface TSliderProp {
  text: string,
  defaultValue: number,
  min: number,
  max: number,
  step: number,
  onChange?: (val: number) => void
}

export function TSlider(prop: TSliderProp) {
  return (
    <Stack alignItems={'center'} justifyContent={'space-between'} direction={'row'}>
      <p>{prop.text} </p>
      <Box minWidth={200} />
      <Slider min={prop.min} max={prop.max} step={prop.step} defaultValue={prop.defaultValue} onChange={(_, val) => {
        prop.onChange?.(val as number)
      }} />
    </Stack>
  )
}