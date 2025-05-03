import { Box, Grid, Stack, TextField } from "@mui/material";

export interface TInputProp {
  text: string,
  value?: string,
  disabled?: boolean,
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
}

export default function TInput(props: TInputProp) {
  return (
    <Stack justifyContent={'space-between'} direction={'row'}>
      <p>{props.text}</p>
      <TextField type="" variant="standard" value={props.value} onChange={props.onChange} disabled={props.disabled} />
    </Stack>
  )
}