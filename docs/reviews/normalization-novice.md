# Normalization novice/content review

Reviewed 2026-11-01 by the research/math agent, acting as a software-engineer reader. This pass reviews lesson/controller/state content independently of their authorship; it is not an independent review of this agent's own math. Browser layout, focus, and touch checks remain with the orchestrator.

Read `lessons.js`, `index.html`, `app.js`, `state.js`, and renderer text needed to match terms to visible outputs. Checked all twenty lesson entries against their generated inputs, and evaluated all four experiment presets with current and baseline outputs. No implementation files were changed in this review.

## Findings and resolution

All four wording findings below were resolved and source-verified on 2026-11-01. They are retained as the review record.

1. **P2 — distinguish the fixed reference cell from an arbitrary selected probe.** BatchNorm comparison and GroupNorm reduction/comparison prose repeatedly identifies sample 0 as “the probe.” The page permits selecting sample 1 without leaving the guided step. In BatchNorm step 4, the sentence about the probe's unchanged input becomes false for that selection; GroupNorm step 2 can state the wrong selected group mean, and step 4 says the probe's set is untouched although sample 1 was changed. Smallest fix: call n0,c0,s0 the *reference cell* in these fixed passages; explain once that selecting another cell changes the numerical readout. Preserve freely selectable cells and the computed observation.

2. **P2 — distinguish RMS from its epsilon-adjusted divisor.** RMSNorm's experiment description says “RMS nearly doubles along with the inputs.” For positive multiplication by 2, raw RMS doubles; the divisor sqrt(q+epsilon) only nearly doubles. Replace with “RMS doubles; the divisor including fixed epsilon nearly doubles.” This keeps the key explanation consistent with the visible Input RMS and Divisor labels.

3. **P3 — qualify the green-cell help for stored BatchNorm inference.** “How to read this view” says green cells are pooled to calculate the statistics without exception. The figure caption correctly explains that inference uses stored values and green cells show the training reduction set. Add this same exception in the help to prevent the generic instructions contradicting the mode-specific caption.

4. **P3 — define epsilon when entering RMSNorm directly.** Its third lesson uses epsilon without the brief definition/value included in LayerNorm. A reader can choose RMSNorm first or open a shared link. Add “the small stabilizer, here 0.00001” at its first substantive use. No extra panel is needed.

## Evidence and comprehension assessment

- All twenty guided constructions produced finite outputs; lesson count and titles are present. Methods restore explicit baselines and their five-step sequences move from input to pooling/statistics to output to comparison to Explore.
- On the selected reference cell, the ×2 experiment changes LayerNorm output by −0.000004024892172660444 and RMSNorm by +0.00000018257395767440343. The renderer formats these in scientific notation instead of rounding them to zero. Matching-height bars are therefore accompanied by the required numerical evidence.
- Changing only sample 1 moves BatchNorm's sample-0 reference output from −1.3416354199689269 to −1.2362446090308896 (difference +0.10539081093803726). GroupNorm's corresponding difference is zero. The input tables actually reach the promised interventions on the first experiment click.
- The vector-to-tensor transition introduces N/C/S in plain language, and cells label sample/channel/site. BatchNorm and GroupNorm reuse the same tensor, isolating the reduction-set difference.
- Scientific changes enter Explore and clear experiment claims. Experiment buttons restore epsilon, affine settings, and input baseline. Input-only restoration preserves settings and is accurately labeled. Fixed guided prose is therefore protected from edited scientific settings.
- Gain/bias naming is explained in settings and scope, normalized z and affine y remain separately inspectable, and RMSNorm's gain-only convention is explicit.
- Sources, exclusions, author/date, and correction route are accessible on demand. No prose claims that these tiny calculations prove training quality or speed.

## Follow-up verification

The revised BatchNorm comparison names the starting cell n0,c0,s0 and says the readout follows the selected cell. GroupNorm names the starting cell in its reduction lesson and states sample-0 independence without assuming the current selection. RMSNorm now distinguishes raw RMS doubling from approximate divisor doubling, defines epsilon directly, and generic help explains the green-cell exception during stored-stat inference. These resolve all four findings.

Opened and visually inspected `evidence-private/normalization/1440-batch-3.png` (1440×1000): both samples, green reduction membership, selected-cell outline, statistics, baseline/current output comparison, lesson text, experiment action, and Previous/Next are legible and coherent. The starting cell's changed output and unchanged input are visible simultaneously. No desktop comprehension issue found in this representative state.

Opened and visually inspected the refreshed phone screenshots after the visual fix: `390-batch-3.png`, `320-layer-3.png`, `320-settings.png`, and `320-group-1.png`. The result/comparison views now put legible horizontal bars, baseline/current legend, selected output and precise delta above the lesson. The visual explicitly tells readers to scroll for inputs/statistics/exact values. Previous/Next remain visible at the bottom on both widths. The GroupNorm reduction view clearly highlights channels 0–1 within sample 0 and leaves sample 1 unhighlighted. At 320 pixels the larger tensor continues inside the scrollable visual rather than compressing cells to illegible sizes. The settings dialog fits the narrow width; input/select controls, affine option and close action remain readable, with further content below its scroll boundary.

No unresolved novice/content blocker remains. This pass is complete for the reviewed scope: source/code review, executed numerical checks, and the five explicitly identified desktop/phone screenshots. Actual interaction, focus, and all-state browser acceptance are separately verified by the orchestrator; this review does not substitute screenshots for those tests.
