/**
 * Pigment Database
 * Per-pigment Arrhenius parameters and colour references for Dunhuang/Mogao heritage pigments.
 *
 * Ea_dark for vermilion, azurite, and malachite are the dark-pathway
 * activation energies measured in the accelerated-ageing pilot (53, 49, 43 kJ/mol
 * respectively; see the Heritage Science paper, Table "Per-pigment Arrhenius
 * kinetic parameters"). Ea_light for these three is assigned from literature
 * photolytic kinetics, not measured in the pilot.
 * The humidity-coupling exponent q is anchored at the literature value 0.8 for
 * these three measured pigments, matching the paper's Methods.
 * Remaining pigments' Ea values are literature estimates sourced from:
 *   - Strlič et al. 2015, Heritage Science 3:40
 *   - Johnston-Feller et al. 1984, JAIC 23(2):114
 *   - Bacci et al. 2003, J. Cultural Heritage 4:238
 *
 * NOTE: k0_dark / k0_light are illustrative demo rate constants for the interactive
 * simulation, NOT the paper's calibrated pre-exponentials. The paper tunes k0 to
 * reproduce the ~48% archaeological colour-loss anchor while consuming these Ea
 * unchanged; reproducing absolute fading magnitudes here would require recalibrating
 * k0 against that anchor.
 * These demo values were rescaled by (10091.7)^q per pigment when the
 * Paltakari–Karlsson isotherm was corrected from a Kelvin+abs surrogate to the
 * physical Celsius form (see PigmentAnalysis._arrheniusRateConstant), so the
 * renderer's fade speed is preserved; they remain order-of-magnitude illustrative.
 * Colour targets from Dunhuang Academy conservation reports.
 */

export const PIGMENT_DATABASE = {
    background: {
        id: 0,
        displayName: '底色 Ground/Substrate',
        displayZh: '底色',
        displayEn: 'Ground/Substrate',
        Ea_dark: 70000,
        Ea_light: 25000,
        k0_dark: 0.16,
        k0_light: 1.6,
        q: 0.8,
        p: 0.9,
        targetRGB: [200, 180, 150],
        fadedRGB: [180, 165, 140],
        description: 'Clay/lime ground layer'
    },
    azurite: {
        id: 1,
        displayName: '石青 Azurite',
        displayZh: '石青',
        displayEn: 'Azurite',
        Ea_dark: 39000,  // dark-pathway barrier, literature-anchored (pilot measured rate ratios only; see paper Table 1)
        Ea_light: 18000,
        k0_dark: 0.080,
        k0_light: 4.0,
        q: 0.8,   // anchored at literature value (paper Methods)
        p: 0.85,
        targetRGB: [0, 80, 180],
        fadedRGB: [90, 110, 130],
        // Secondary ageing tint applied after the base fade in the worker.
        // Green shift from CuO formation: +G, -B (R unchanged).
        agingTint: { amount: 8, dR: 0, dG: 0.4, dB: -0.2 },
        description: 'Copper carbonate, darkens to tenorite (CuO) in humid conditions'
    },
    malachite: {
        id: 2,
        displayName: '石绿 Malachite',
        displayZh: '石绿',
        displayEn: 'Malachite',
        Ea_dark: 43000,  // dark-pathway barrier, literature-anchored (pilot measured rate ratios only; see paper Table 1)
        Ea_light: 22000,
        k0_dark: 0.048,
        k0_light: 2.4,
        q: 0.8,   // anchored at literature value (paper Methods)
        p: 0.9,
        targetRGB: [0, 140, 60],
        fadedRGB: [80, 120, 80],
        description: 'Copper carbonate hydroxide, relatively stable'
    },
    vermilion: {
        id: 3,
        displayName: '朱砂 Vermilion',
        displayZh: '朱砂',
        displayEn: 'Vermilion',
        Ea_dark: 60000,  // dark-pathway barrier, literature-anchored (pilot measured rate ratios only; see paper Table 1)
        Ea_light: 18000,
        k0_dark: 0.13,
        k0_light: 4.8,
        q: 0.8,   // anchored at literature value (paper Methods)
        p: 0.95,
        targetRGB: [200, 30, 15],
        fadedRGB: [130, 80, 70],
        // Meta-cinnabar darkening: all three channels drop, R fastest.
        agingTint: { amount: 12, dR: -1, dG: -0.6, dB: -0.4 },
        description: 'Mercury sulfide (HgS), meta-cinnabar darkening under light'
    },
    leadWhite: {
        id: 4,
        displayName: '铅白 Lead White',
        displayZh: '铅白',
        displayEn: 'Lead White',
        Ea_dark: 65000,
        Ea_light: 30000,
        k0_dark: 0.95,
        k0_light: 5.1,
        q: 0.95,
        p: 0.8,
        targetRGB: [245, 240, 230],
        fadedRGB: [200, 190, 170],
        // Slight yellowing with age: +R/+G, -B.
        agingTint: { amount: 10, dR: 1, dG: 0.5, dB: -0.4 },
        description: 'Basic lead carbonate, darkens with H₂S, yellows with age'
    },
    goldLeaf: {
        id: 5,
        displayName: '金箔 Gold Leaf',
        displayZh: '金箔',
        displayEn: 'Gold Leaf',
        Ea_dark: 120000,
        Ea_light: 50000,
        k0_dark: 0.0000025,
        k0_light: 0.00025,
        q: 0.1,
        p: 0.5,
        targetRGB: [212, 175, 55],
        fadedRGB: [190, 165, 60],
        description: 'Metallic gold, extremely chemically stable'
    },
    redOchre: {
        id: 6,
        displayName: '赭石 Red Ochre',
        displayZh: '赭石',
        displayEn: 'Red Ochre',
        Ea_dark: 95000,
        Ea_light: 35000,
        k0_dark: 0.0051,
        k0_light: 0.13,
        q: 0.6,
        p: 0.7,
        targetRGB: [180, 70, 30],
        fadedRGB: [155, 100, 75],
        description: 'Iron oxide (Fe₂O₃), very lightfast and stable'
    },
    carbonBlack: {
        id: 7,
        displayName: '墨 Carbon Black',
        displayZh: '墨',
        displayEn: 'Carbon Black',
        Ea_dark: 110000,
        Ea_light: 45000,
        k0_dark: 0.000079,
        k0_light: 0.0032,
        q: 0.3,
        p: 0.6,
        targetRGB: [15, 15, 15],
        fadedRGB: [50, 50, 50],
        description: 'Amorphous carbon, extremely stable pigment'
    }
};

export const PIGMENT_NAMES = Object.keys(PIGMENT_DATABASE);
export const NUM_CLASSES = PIGMENT_NAMES.length;

/** Look up a pigment entry by its numeric class ID */
export function getPigmentById(id) {
    return Object.values(PIGMENT_DATABASE).find(p => p.id === id) || PIGMENT_DATABASE.background;
}

/** Overlay colour for each class (used in pigment-map visualisation) */
export const OVERLAY_COLORS = PIGMENT_NAMES.map(name => PIGMENT_DATABASE[name].targetRGB);
