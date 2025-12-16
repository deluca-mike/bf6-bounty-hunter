import { FFASpawning } from 'bf6-portal-utils/ffa-spawning';

export const EASTWOOD_SPAWNS: FFASpawning.SpawnData[] = [
    {
        location: mod.CreateVector(-296.85, 235.07, -68.62),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-263.63, 235.47, -81.83),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-183.3, 237.29, -90.6),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-148.71, 236.77, -78.93),
        orientation: 0,
    },
    {
        location: mod.CreateVector(-118.32, 239.35, 15.71),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-149.41, 237.77, 10.04),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-208.97, 238.23, -4.04),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-245.57, 236.44, 3.57),
        orientation: 0,
    },
    {
        location: mod.CreateVector(-289.62, 235.2, 53.69),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-253.38, 234.52, 74.99),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-159.43, 237.38, 96.86),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-128.28, 237.49, 104.55),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-156.21, 237.18, 166.81),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-156.21, 237.18, 166.81),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-83.35, 239.04, 217.75),
        orientation: 270,
    },
    {
        location: mod.CreateVector(279.12, 232.46, -11.11),
        orientation: 180,
    },
    {
        location: mod.CreateVector(206.62, 240.11, -160.75),
        orientation: 270,
    },
    {
        location: mod.CreateVector(194.76, 240.08, -201.06),
        orientation: 180,
    },
    {
        location: mod.CreateVector(218.22, 230.12, 44.09),
        orientation: 90,
    },
    {
        location: mod.CreateVector(120.66, 231.78, 5.75),
        orientation: 180,
    },
    {
        location: mod.CreateVector(94.32, 233.69, -30.49),
        orientation: 180,
    },
    {
        location: mod.CreateVector(25.72, 227.23, 305.69),
        orientation: 0,
    },
    {
        location: mod.CreateVector(140.24, 226.12, 189.48),
        orientation: 270,
    },
    {
        location: mod.CreateVector(224.47, 225.83, 100.33),
        orientation: 0,
    },
    {
        location: mod.CreateVector(328.33, 233.86, 30.59),
        orientation: 270,
    },
    {
        location: mod.CreateVector(62.51, 234.33, 45.48),
        orientation: 90,
    },
    {
        location: mod.CreateVector(10.91, 232.19, 81.13),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-48.83, 238.32, 92.06),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-95.22, 235.34, 61.43),
        orientation: 0,
    },
    {
        location: mod.CreateVector(-197.68, 233.88, 23.08),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-224.46, 231.68, 45.27),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-226.03, 232.04, 21.26),
        orientation: 270, // 32
    },
    {
        location: mod.CreateVector(178.51, 240.89, -177.08),
        orientation: 90,
    },
    {
        location: mod.CreateVector(220.78, 237.68, -134.05),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-375.86, 233.6, -16.3),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-238.17, 253.83, -167.73),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-22.73, 238.87, -98.5),
        orientation: 180,
    },
    {
        location: mod.CreateVector(87.33, 239.7, -135.99),
        orientation: 90,
    },
    {
        location: mod.CreateVector(96.97, 229.28, 27.41),
        orientation: 100,
    },
    {
        location: mod.CreateVector(74.03, 229.28, 50.2),
        orientation: 100,
    },
    {
        location: mod.CreateVector(292.51, 235.34, -79.08),
        orientation: 255,
    },
    {
        location: mod.CreateVector(95.86, 233.02, -34.06),
        orientation: 345,
    },
    {
        location: mod.CreateVector(-5.62, 232.57, -27.09),
        orientation: 105,
    },
];

export const EASTWOOD_FFA_SPAWNING_SOLDIER_OPTIONS: FFASpawning.InitializeOptions = {
    minimumSafeDistance: 40,
    maximumInterestingDistance: 80,
    safeOverInterestingFallbackFactor: 1.5,
};

export const EMPIRE_STATE_SPAWNS: FFASpawning.SpawnData[] = [
    {
        location: mod.CreateVector(-734.85, 55.51, -201.63), // -734.85, 55.51, -201.63, 130
        orientation: 130,
    },
    {
        location: mod.CreateVector(-687.65, 55.53, -209.33), // -687.65, 55.53, -209.33, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-655.35, 55.53, -190.42), // -655.35, 55.53, -190.42, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-629.26, 53.58, -187.67), // -629.26, 53.58,-187.67, 100
        orientation: 100,
    },
    {
        location: mod.CreateVector(-599.66, 55.4, -183.89), // -599.66, 55.40, -183.89, 165
        orientation: 165,
    },
    {
        location: mod.CreateVector(-601.05, 53.95, -166.36), // -601.05, 53.95, -166.36, 15
        orientation: 15,
    },
    {
        location: mod.CreateVector(-572.73, 53.81, -169.83), // -572.73, 53.81, -169.83, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-546.36, 57.17, -152.7), // -546.36, 57.17, -152.70, 140
        orientation: 140,
    },
    {
        location: mod.CreateVector(-541.88, 54.22, -131.05), // -541.88, 54.22, -131.05, 12
        orientation: 12,
    },
    {
        location: mod.CreateVector(-558.5, 54.14, -134.86), // -558.50, 54.14, -134.86, 15
        orientation: 15,
    },
    {
        location: mod.CreateVector(-583.95, 54.11, -142.1), // -583.95, 54.11, -142.10, 285
        orientation: 285,
    },
    {
        location: mod.CreateVector(-597.59, 54.12, -144.59), // -597.59, 54.12, -144.59, 15
        orientation: 15,
    },
    {
        location: mod.CreateVector(-607.91, 53.96, -148.15), // -607.91, 53.96, -148.15, 195
        orientation: 195,
    },
    {
        location: mod.CreateVector(-605.18, 53.96, -138.8), // -605.18, 53.96, -138.80, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-609.13, 53.96, -156.55), // -609.13, 53.96, -156.5, 210
        orientation: 210,
    },
    {
        location: mod.CreateVector(-603.25, 53.92, -161.07), // -603.25, 53.92, -161.07, 105
        orientation: 105,
    },
    {
        location: mod.CreateVector(-713.72, 55.51, -123.17), // -713.72, 55.51, -123.17, 60
        orientation: 60,
    },
    {
        location: mod.CreateVector(-688.12, 53.88, 88.88), // -688.12, 53.88, 88.88, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-671.92, 53.69, 130.71), // -671.92, 53.69, 130.71, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-631.21, 53.35, 116.63), // -631.21, 53.35, 116.63, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-655.82, 53.18, 114.35), // -655.82, 53.18, 114.35, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-640.35, 63.92, 139.18), // -640.35, 63.92, 139.18, 345
        orientation: 345,
    },
    {
        location: mod.CreateVector(-619.06, 67.11, 106.43), // -619.06, 67.11, 106.43, 135
        orientation: 135,
    },
    {
        location: mod.CreateVector(-602.5, 60.03, 119.62), // -602.50, 60.03, 119.62, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-555.67, 60.01, 61.52), // -555.67, 60.01, 61.52, 315
        orientation: 315,
    },
    {
        location: mod.CreateVector(-628.17, 53.76, 72.84), // -628.17, 53.76, 72.84, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-658.57, 53.81, 64.01), // -658.57, 53.81, 64.01, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-676.66, 50.91, -1.26), // -676.66, 50.91, -1.26, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-676.8, 50.9, -11.68), // -676.80, 50.90, -11.68, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-679.45, 55.33, -56.34), // -679.45, 55.33, -56.34, 167
        orientation: 167,
    },
    {
        location: mod.CreateVector(-664.22, 53.84, -89.28), // -664.22, 53.84, -89.28, 172
        orientation: 172,
    },
    {
        location: mod.CreateVector(-648.75, 53.95, -63.93), // -648.75, 53.95, -63.93, 300
        orientation: 300,
    },
    {
        location: mod.CreateVector(-656.32, 58.72, -22.4), // -656.32, 58.72, -22.40, 135
        orientation: 135,
    },
    {
        location: mod.CreateVector(-650.03, 59.15, 7.81), // -650.03, 59.15, 7.81, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-654.99, 54.41, 56.23), // -654.99, 54.41, 56.23, 30
        orientation: 30,
    },
    {
        location: mod.CreateVector(-577.6, 63.71, 33.96), // -577.60, 63.71, 33.96, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-552.68, 65.13, 72.39), // -552.68, 65.13, 72.39, 45
        orientation: 45,
    },
    {
        location: mod.CreateVector(-520.48, 65.01, 48.25), // -520.48, 65.01, 48.25, 330
        orientation: 330,
    },
    {
        location: mod.CreateVector(-512.44, 59.41, -2.87), // -512.44, 59.41, -2.87, 300
        orientation: 300,
    },
    {
        location: mod.CreateVector(-515.46, 58.72, -48.61), // -515.46, 58.72, -48.61, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-528.53, 54.31, -118.11), // -528.53, 54.31, -118.11, 190
        orientation: 190,
    },
    {
        location: mod.CreateVector(-545.1, 54.23, -119.99), // -545.10, 54.23, -119.99, 190
        orientation: 190,
    },
    {
        location: mod.CreateVector(-562.49, 54.14, -123.81), // -562.49, 54.14, -123.81, 190
        orientation: 190,
    },
    {
        location: mod.CreateVector(-593.8, 57.28, -138.38), // -593.80, 57.28, -138.38, 150
        orientation: 150,
    },
    {
        location: mod.CreateVector(-641.84, 54.04, -100.91), // -641.84, 54.04, -100.91, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-624.9, 54.1, -88.99), // -624.90, 54.10, -88.99, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-624.65, 54.15, -80.79), // -624.65, 54.15, -80.79, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-622.93, 54.27, -75.62), // -622.93, 54.27, -75.62, 185
        orientation: 185,
    },
    {
        location: mod.CreateVector(-642.74, 54.04, -89.46), // -642.74, 54.04, -89.46, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-616.13, 53.97, -94.49), // -616.13, 53.97, -94.49, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-591.21, 54.16, -93.33), // -591.21, 54.16, -93.33, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-582.85, 54.16, -93.77), // -582.85, 54.16, -93.77, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-574.61, 54.2, -92.79), // -574.61, 54.20, -92.79, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-560.21, 54.15, -81.57), // -560.21, 54.15, -81.57, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-551.29, 57.32, -87.07), // -551.29, 57.32, -87.07, 320
        orientation: 320,
    },
    {
        location: mod.CreateVector(-549.44, 57.36, -87.11), // -549.44, 57.36, -87.11, 52
        orientation: 52,
    },
    {
        location: mod.CreateVector(-549.33, 54.19, -81.07), // -549.33, 54.19, -81.07, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-571.71, 54.99, -48.15), // -571.71, 54.99, -48.15, 315
        orientation: 315,
    },
    {
        location: mod.CreateVector(-544.9, 58.72, -42.49), // -544.90, 58.72, -42.49, 285
        orientation: 285,
    },
    {
        location: mod.CreateVector(-587.56, 58.72, -50.29), // -587.56, 58.72, -50.29, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-570.26, 58.72, -23.35), // -570.26, 58.72, -23.35, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-531.83, 58.72, -40.35), // -531.83, 58.72, -40.35, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-549.18, 58.72, -24.43), // -549.18, 58.72, -24.43, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-547.73, 58.72, -38.94), // -547.73, 58.72, -38.94, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-572.69, 58.72, -24.02), // -572.69, 58.72, -24.02, 30
        orientation: 30,
    },
    {
        location: mod.CreateVector(-588.32, 63.2, -16.33), // -588.32, 63.20, -16.33, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-586.75, 63.2, -46.06), // -586.75, 63.20, -46.06, 105
        orientation: 105,
    },
    {
        location: mod.CreateVector(-649.9, 63.21, -6.24), // -649.90, 63.21, -6.24, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-648.79, 63.2, -32.73), // -648.79, 63.20, -32.73, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-626.02, 63.2, 7.7), // -626.02, 63.20, 7.70, 60
        orientation: 60,
    },
    {
        location: mod.CreateVector(-630.83, 58.72, -48.37), // -630.83, 58.72, -48.37, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-620.66, 58.72, -35.48), // -620.66, 58.72, -35.48, 330
        orientation: 330,
    },
    {
        location: mod.CreateVector(-592.22, 54.16, -81.5), // -592.22, 54.16, -81.50, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-583.83, 54.16, -82.12), // -583.83, 54.16, -82.12, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-575.53, 54.2, -81.39), // -575.53, 54.20, -81.39, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-670.32, 62.58, 28.07), // -670.32, 62.58, 28.07, 120
        orientation: 120,
    },
    {
        location: mod.CreateVector(-649.1, 58.72, 20.38), // -649.10, 58.72, 20.38, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-645.78, 58.72, 11.86), // -645.78, 58.72, 11.86, 12
        orientation: 12,
    },
    {
        location: mod.CreateVector(-629.98, 58.72, -10.13), // -629.98, 58.72, -10.13, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-600.25, 55.21, -35.98), // -600.25, 55.21, -35.98, 120
        orientation: 120,
    },
    {
        location: mod.CreateVector(-619.69, 57.44, -75.57), // -619.69, 57.44, -75.57, 135
        orientation: 135,
    },
    {
        location: mod.CreateVector(-615.33, 54.15, -81.16), // -615.33, 54.15, -81.16, 60
        orientation: 60,
    },
    {
        location: mod.CreateVector(-612.86, 54.1, -88.07), // -612.86, 54.10, -88.07, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-595.17, 54.29, -67.62), // -595.17, 54.29, -67.62, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-583.7, 54.29, -66.67), // -583.70, 54.29, -66.67, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-573.42, 57.96, 5.52), // -573.42, 57.96, 5.52, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-540.28, 59.95, 13.92), // -540.28, 59.95, 13.92, 330
        orientation: 330,
    },
    {
        location: mod.CreateVector(-585.35, 63.72, 31.45), // -585.35, 63.72, 31.45, 30
        orientation: 30,
    },
    {
        location: mod.CreateVector(-614.29, 53.92, -164.92), // -614.29, 53.92, -164.92, 285
        orientation: 285,
    },
    {
        location: mod.CreateVector(-607.0, 57.12, -167.2), // -607.00, 57.12, -167.20, 330
        orientation: 330,
    },
];

export const EMPIRE_STATE_FFA_SPAWNING_SOLDIER_OPTIONS: FFASpawning.InitializeOptions = {
    minimumSafeDistance: 20,
    maximumInterestingDistance: 40,
    safeOverInterestingFallbackFactor: 1.5,
};
