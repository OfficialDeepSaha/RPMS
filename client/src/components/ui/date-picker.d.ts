declare module "@/components/ui/date-picker" {
  export interface DatePickerProps {
    date?: Date;
    onSelect: (date: Date) => void;
    disabled?: (date: Date) => boolean;
  }

  export function DatePicker(props: DatePickerProps): JSX.Element;
  export default DatePicker;
} 