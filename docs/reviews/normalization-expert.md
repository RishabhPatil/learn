# Independent expert review — 2026-11-01

Reviewer role: research skeptic, independent of mathematical implementation, state/controller and renderer authorship. The reviewer previously authored lesson text; this review therefore concentrates on the independently authored code and its mathematical/visual contract. Inputs: frozen brief, research source audit, `math.js`, `state.js`, `app.js`, `renderer.js`, page shell and mathematical/state tests.

## Result

No blocking mathematical or scientific defect found. All four methods implement the declared reductions and affine conventions. The experiments change their intended variable and restore fixed baselines. Both initial wording findings have been resolved and the changes inspected.

## Evidence actually checked

- Ran `node --test tests/normalization-math.test.js tests/normalization-state.test.js`: 16 tests passed.
- Independently checked probe outputs from sufficient statistics, without reusing the implementation's moment calculation: doubled LN baseline is −3/sqrt(5+epsilon); doubled RMS baseline is 2/sqrt(30+epsilon); changed-batch probe is −4.5/sqrt(13.25+epsilon); unchanged first-sample GN probe is −1.5/sqrt(1.25+epsilon). All agree within 1e−12 at epsilon 1e−5.
- Exercised 96 independent shared-link states: four methods × three group settings × two modes × affine on/off × epsilon endpoints 1e−8/1, using alternating −1000/+1000 inputs. Encode/decode exactly preserved each valid state; each resulting output was finite.
- Read the explicit group membership tests: feature-wise LN/RMS reduce C independently per n,s; training BN pools N,S at fixed C; GN pools grouped C and S inside fixed N. The baseline and counterfactual tensor sets match the lesson fixtures.
- Checked mathematical edge cases covered by the tests: zeros, nonzero constants, finite-epsilon scale effects, unit conversion with squared epsilon, affine channel sharing, stored-stat independence, large-offset variance, invalid values and no input mutation.
- Verified the renderer uses a shared scale for baseline/current outputs, exposes tiny scale-experiment deltas in scientific notation, labels pre-affine and post-affine values, and preserves precise values in the on-demand table. This was a source inspection, not a screenshot/browser inspection.
- Verified stored BN mean/variance are used for calculation while current-input RMS remains separately labeled. The green training reduction set is explicitly distinguished in the renderer's inference caption. Stored statistics remain fixed and are not fabricated moving averages.
- Verified settings enter Explore, experiment labels survive URL decoding only for exact presets, and scientific controls compare the baseline input under the same settings. Reset/guided navigation restore fixtures. Full browser focus/visual QA is the orchestrator's separate check.

## Findings

1. **Resolved — inference help.** The page shell's “How to read this view” now explicitly says that green marks the training reduction set during BatchNorm inference, while fixed stored statistics supply the calculation. Inspected the revised page source; it agrees with the renderer.
2. **Resolved — selected versus starting probe.** The fixed tensor lesson now names the starting cell n0,c0,s0 and tells readers that the readout follows their current selection. Inspected both BatchNorm and GroupNorm comparison wording and the GroupNorm construction step. The computed current-selection readout remains correct. This issue was noticed while matching behavior to the authored prose and is not presented as an independent assessment of all lesson writing.

Neither fix changes formulas or mathematical test expectations.

## Supplemental analytics and browser-check review

Inspected the shared analytics diff and controller integration. The change adds the normalization page identity and four fixed method labels to the existing allowlist. One `createAnalytics` instance is created at module load; render/selection do not initialize another tag. Configured page location uses only origin and path, so tensor-containing fragments are excluded. Existing consent gates, browser privacy signals, preview suppression, shared consent key and cookie settings remain unchanged. Ran `node --test tests/analytics.test.js`: all five tests passed, including both canonical/index.html page identities, repeated acceptance producing one pageview, predefined labels, arbitrary-label removal and privacy suppression. This verifies the module contract, not receipt inside a live GA account.

Read `scripts/check-normalization.mjs` and its generated local `browser-checks.json`. The script exercises all 20 guided states by Next navigation, four experiment presets, keyboard cell selection and retained focus, scientific settings, reload/share-URL preservation, dialog Escape/focus restoration, and reset. The saved report records zero page errors and zero HTTP responses at status 400 or above. It also checks horizontal overflow and step-navigation viewport bounds at 1440×1000, 390×844 and 320×720. The browser run was performed by the orchestrator; this reviewer independently inspected the check implementation and report rather than claiming a second browser run.

Coverage limits communicated to the orchestrator: the initial script did not click Previous or exercise Copy link. The orchestrator added both actions and reran the script successfully after the mobile result-layout adjustment. Copy checks the resulting success or fallback status; it does not force every browser permission condition. Capturing screenshots does not verify legibility, output visibility or phone usability; the report correctly states that visual inspection is separate. The orchestrator and novice/visual reviewers performed that inspection, including the final narrow reduction refinement. No verification follow-up remains that invalidates the core example.

## Deliberate scope limits

The module's range checking may reject extreme finite arrays whose variance exceeds JavaScript's representable range; the UI limits inputs to ±1000 and epsilon to [1e−8,1], so these rejected arrays are outside the interactive scope. This is not a low-precision kernel comparison. No training convergence, model accuracy, or universally superior normalization claim is supported or made. BN inference covers fixed tracked statistics, not the untracked-stat evaluation variant. No moving-average training history is simulated.
