import { Grid, MenuItem, Select, SelectProps, Stack } from "@mui/material";
import { ReactNode, useState } from "react";

/**
 * @deprecated
 */
export default function TSelect(props: {
  text: string,
  disabled?: boolean,
  select_props: SelectProps,
  children: ReactNode,
}) {
  return (
    <Grid container style={{
      alignItems: 'center'
    }}>
      <Grid item xs={true}>
        <p>{props.text}</p>
      </Grid>
      <Grid item xs={true}>
        <Select disabled={props.disabled} {...props.select_props} >
          {props.children}
        </Select>
      </Grid>
    </Grid>
  );
}

export interface TSelectValue {
  label: string
  value: number
}

export interface TSelectProps {
  text: string,
  disabled?: boolean,
  values: TSelectValue[]
  defaultValue?: number,
  onSelect?: (value: TSelectValue) => void
}

export function TSelect2(props: TSelectProps) {
  let [value, set_value] = useState(props.defaultValue)
  return (
    <Stack justifyContent={'space-between'} direction={'row'}>
      <p>{props.text}</p>
      <Select disabled={props.disabled} value={value} onChange={(e) => {
        set_value(e.target.value as number)
        let value = props.values.find((v) => v.value === e.target.value)
        if (value) {
          props.onSelect?.(value)
        }
      }}>
        {props.values.map((value, index) => (
          <MenuItem key={index} value={value.value}>
            {value.label}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  )
}
