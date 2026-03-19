export const PARAMS = [
  { key: 'multiplier'   as const, label: 'Speed Multiplier', min: 0,   max: 5,   step: 0.05,
    description: 'Scales overall movement speed. Typical: 0.8–2.0' },
  { key: 'minspeed'     as const, label: 'Min Speed',         min: 0,   max: 1,   step: 0.01,
    description: 'Minimum speed for any detected movement. Typical: 0.0–0.3' },
  { key: 'minrange'     as const, label: 'Min Range',         min: 0,   max: 1,   step: 0.01,
    description: 'Lower bound of thumbstick input mapping. Typical: 0.0–0.4' },
  { key: 'maxrange'     as const, label: 'Max Range',         min: 0,   max: 1.5, step: 0.01,
    description: 'Upper bound of thumbstick input mapping. Can exceed 1.0. Typical: 0.5–1.0' },
  { key: 'maxspeed'     as const, label: 'Max Speed',         min: 0,   max: 1,   step: 0.01,
    description: '0 = no speed cap (disabled). Typical: 0.0–1.0' },
  { key: 'omnicoupling' as const, label: 'Omni Coupling',     min: 0,   max: 1,   step: 0.05,
    description: '0 = follow head, 1 = follow torso. Default: 0.7' },
]
