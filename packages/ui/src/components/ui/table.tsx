interface TablePartProps {
  children: React.ReactNode
  className?: string
  colSpan?: number
  key?: string | number
}

export function Table({ children, className, ...rest }: TablePartProps) {
  return (
    <table className={className} {...rest}>
      {children}
    </table>
  )
}

export function TableHeader({ children, className, ...rest }: TablePartProps) {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className, ...rest }: TablePartProps) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  )
}

export function TableFooter({ children, className, ...rest }: TablePartProps) {
  return (
    <tfoot className={className} {...rest}>
      {children}
    </tfoot>
  )
}

export function TableRow({ children, className, ...rest }: TablePartProps) {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className, ...rest }: TablePartProps) {
  return (
    <th className={className} {...rest}>
      {children}
    </th>
  )
}

export function TableCell({ children, className, colSpan, ...rest }: TablePartProps) {
  return (
    <td className={className} colSpan={colSpan} {...rest}>
      {children}
    </td>
  )
}

export function TableCaption({ children, className, ...rest }: TablePartProps) {
  return (
    <caption className={className} {...rest}>
      {children}
    </caption>
  )
}
