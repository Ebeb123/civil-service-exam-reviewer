// Inline line icons (24px grid, 1.75 stroke) so we don't pull in an icon library.
const paths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  practice: 'M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2m0-14c1.5-1.5 4-2 8-2v14c-4 0-6.5.5-8 2m0-14v14',
  exam: 'M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1m-6 9 2 2 4-4',
  calculator: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 3h8v3H8V6Zm0 6h.01M12 12h.01M16 12h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01',
  language: 'M4 5h9M8.5 3v2m2.5 0c-.8 4.5-3.5 8-7 10m2.5-6c1 2.2 2.8 4.2 5 5.5M13 21l4-9 4 9m-6.8-3h5.6',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12ZM8.5 12h.01M12 12h.01M15.5 12h.01',
  landmark: 'M3 21h18M4 10h16M12 3l8 4.5H4L12 3ZM6 10v8m4-8v8m4-8v8m4-8v8',
  puzzle: 'M10 4a2 2 0 1 1 4 0v1h4a1 1 0 0 1 1 1v4h-1a2 2 0 1 0 0 4h1v4a1 1 0 0 1-1 1h-4v-1a2 2 0 1 0-4 0v1H6a1 1 0 0 1-1-1v-4h1a2 2 0 1 0 0-4H5V6a1 1 0 0 1 1-1h4V4Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4-4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6 6-6-6 6-6',
  check: 'M20 6 9 17l-5-5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l2.5 2.5',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  play: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-1.5-12.5 5 3.5-5 3.5v-7Z',
  x: 'M6 6l12 12M6 18 18 6',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  bulb: 'M9 18h6m-5 3h4m-2-18a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V15h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
}

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.75 }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
