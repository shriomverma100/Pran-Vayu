import type { SVGProps } from 'react'

// प्राण-वायु icon set. One family: 24 × 24 grid, 2px stroke, square caps and
// mitred joins to match the brutalist frame. Icons are decorative by default
// (aria-hidden); pass a `title` when the icon carries meaning on its own.

const PATHS = {
  drop: <path d="M12 2.8c-3.2 4.3-6.5 8-6.5 12a6.5 6.5 0 0 0 13 0c0-4-3.3-7.7-6.5-12Z" />,
  oxygen: (
    <>
      <circle cx="9" cy="15" r="5" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="18.5" cy="17.5" r="1.8" />
    </>
  ),
  aerator: (
    <>
      <path d="M12 15V4" />
      <path d="M12 4c-3.2 0-5 2.6-5 6" />
      <path d="M12 4c3.2 0 5 2.6 5 6" />
      <path d="M8.5 8.5 7 10l-1.5-1.5" />
      <path d="M18.5 8.5 17 10l-1.5-1.5" />
      <path d="M2 19c1.7 0 1.7-1.5 3.3-1.5S7 19 8.7 19s1.6-1.5 3.3-1.5 1.7 1.5 3.3 1.5 1.7-1.5 3.4-1.5S20.3 19 22 19" />
    </>
  ),
  flask: (
    <>
      <path d="M9 2.8h6" />
      <path d="M10 2.8v6.4L4.6 18.6A1.7 1.7 0 0 0 6.1 21h11.8a1.7 1.7 0 0 0 1.5-2.4L14 9.2V2.8" />
      <path d="M7.2 15h9.6" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20.5c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2" />
      <circle cx="17.2" cy="9" r="2.4" />
      <path d="M16.4 14.4c2.8 0 4.6 2.3 4.6 5.6" />
    </>
  ),
  broom: (
    <>
      <path d="m15.5 2.5-4 9" />
      <path d="M6 12.5h10l1.5 9h-13Z" />
      <path d="m9 16-.5 5.5M13 16l.5 5.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 22 20.5H2Z" />
      <path d="M12 9.5v5" />
      <path d="M12 17.2v.6" />
    </>
  ),
  exclaim: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6.5" />
      <path d="M12 16.4v.6" />
    </>
  ),
  check: <path d="m4 12.5 5.5 5.5L20 6.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m7.8 12.3 2.9 2.9 5.5-6" />
    </>
  ),
  notTested: (
    <>
      <circle cx="12" cy="12" r="9" strokeDasharray="3.2 2.6" />
      <path d="M8.5 12h7" />
    </>
  ),
  bdl: (
    <>
      <path d="M4 18h16" />
      <path d="m8 10 4 4 4-4" />
      <path d="M12 4v10" />
    </>
  ),
  verify: (
    <>
      <path d="M13 3H5v18h6" />
      <path d="M13 3l5 5v3" />
      <path d="M13 3v5h5" />
      <circle cx="16.5" cy="16.5" r="3.2" />
      <path d="m18.9 18.9 2.6 2.6" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2.8h12v18.4l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 20 6v6c0 4.6-3.4 8-8 9.2C7.4 20 4 16.6 4 12V6Z" />
      <path d="m8.6 12 2.4 2.4 4.4-4.8" />
    </>
  ),
  shuffle: (
    <>
      <path d="M7 4v16" />
      <path d="m4 7 3-3 3 3" />
      <path d="M17 20V4" />
      <path d="m14 17 3 3 3-3" />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 20.5 6 16.3A8.5 8.5 0 1 1 9 19.3Z" />
      <path d="M9 10h6M9 13.5h4" />
    </>
  ),
  print: (
    <>
      <path d="M7 8.5V3h10v5.5" />
      <path d="M7 17H3v-8.5h18V17h-4" />
      <path d="M7 13.5h10V21H7Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20.5h16" />
    </>
  ),
  copy: (
    <>
      <path d="M8.5 8.5h12v12h-12Z" />
      <path d="M15.5 8.5V3.5h-12v12h5" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6 3h12M6 21h12" />
      <path d="M7.5 3v3.5L12 12l-4.5 5.5V21" />
      <path d="M16.5 3v3.5L12 12l4.5 5.5V21" />
    </>
  ),
  calendar: (
    <>
      <path d="M3.5 5.5h17v15h-17Z" />
      <path d="M3.5 10h17" />
      <path d="M8 3v5M16 3v5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 4v15" />
      <path d="m6 13 6 6 6-6" />
    </>
  ),
  close: <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5V17" />
      <path d="M12 7v.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-7-6.4-7-12a7 7 0 0 1 14 0c0 5.6-7 12-7 12Z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
    </>
  ),
  external: (
    <>
      <path d="M14 3.5h6.5V10" />
      <path d="m20.5 3.5-9 9" />
      <path d="M18 14v6.5H3.5V6H10" />
    </>
  ),
  grid: (
    <>
      <path d="M3.5 3.5h7v7h-7ZM13.5 3.5h7v7h-7ZM3.5 13.5h7v7h-7Z" />
      <path d="M13.5 13.5h7v7h-7Z" strokeDasharray="2.4 2" />
    </>
  ),
  trendDown: (
    <>
      <path d="m3 6.5 6.5 6.5 4-4L21 16.5" />
      <path d="M21 10.5v6h-6" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10 4.8 7.5 4 3.5 4v15c4 0 6.5.8 8.5 2.5 2-1.7 4.5-2.5 8.5-2.5V4c-4 0-6.5.8-8.5 2.5Z" />
      <path d="M12 6.5v15" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9.5 5-9.5 5-9.5-5Z" />
      <path d="m2.5 12.5 9.5 5 9.5-5" />
      <path d="m2.5 17 9.5 5 9.5-5" />
    </>
  ),
  textSize: (
    <>
      <path d="M3 19 8.5 5h1L15 19" />
      <path d="M5 14h9" />
      <path d="M17 19l2.5-6.5h.5L22.5 19" />
    </>
  ),
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
} as const

export type IconName = keyof typeof PATHS
export const ICON_NAMES = Object.keys(PATHS) as IconName[]

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  title?: string
  strokeWidth?: number
}

export function Icon({ name, size = 20, title, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}
