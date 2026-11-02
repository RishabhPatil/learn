# Orchestrator plan for horizontal deep learning articles

Build a collection of interactive scientific references for software engineers. Organize articles around mechanisms that recur across model families and modalities, rather than around individual model releases. Connect text, image, video, and audio where the connection is substantive; do not force every topic to cover every modality.

Repository: `RishabhPatil/learn`. Site root: `https://rishabhpatil.github.io/learn/`. The existing Position Atlas establishes the reading and visualization style. Preserve it while adding separate articles.

## Visual learning mission

The author learns and thinks visually. This collection shares that way of understanding with other people: **make a concept visible, let the reader change it, and help them explain what happened.** An article is not complete merely because its prose and paper list are comprehensive.

Design the visual experiment before drafting the long explanation:

1. Start with one reader question or misconception and a small, inspectable example.
2. Name what the reader changes, what stays fixed, and the observable consequence. Make the consequence visible in the main view.
3. Invite a prediction, then let the reader act. Show a short explanation tied to the current result; offer a reset for comparison.
4. Use consistent colors and labels to connect the input, operation, and output. Prefer one meaningful control per guided step; disclose the rest in Explore.
5. Make the experience work through touch and keyboard as well as a mouse. Motion must be pausable or replaceable by stepping; respect reduced-motion preferences.
6. State whether the scene shows exact arithmetic on illustrative data, a geometric analogy, or a measured model result. Do not suggest that a toy vector has learned semantic meaning.

Acceptance question: **Can a new reader explain what changed and why after manipulating the visual, without first reading every paragraph?** If not, simplify the experiment before adding more text or controls. Scientific depth stays available through equations, exact values, and primary references on demand.

## Execution contract

The orchestrator owns topic selection, integration, verification, and delivery. It must actually launch subagents when this plan is executed; describing their future work is not completion.

Use these defaults unless the user supplies different constraints:

- Refresh the persistent inventory in `docs/article-backlog.md`; evaluate up to 12 candidates for the current run, shortlist 3, and implement 1 complete article. Preserve all reader-requested ideas even when they are outside this run’s shortlist.
- Read publication status in the backlog first. Positional encoding and Normalization are already published; do not restart them. Inference memory is the current next recommendation unless research or the user changes that choice.
- Keep the remaining topics in an ordered backlog. A larger requested batch repeats the complete article cycle sequentially.
- Use the existing static HTML, CSS, JavaScript, Node tests, and GitHub Pages workflow. Prefer exact browser-local examples without model downloads or paid services.
- Use the current checkout when suitable. Inspect its instructions and changes first; preserve unrelated work.
- Do not turn a planning-only request into article publication. When asked to execute, complete implementation and the authorized deployment, rather than stopping after the outline.

## Candidate article backlog

The table below records the original editorial starting points. The [persistent backlog](article-backlog.md), including its reader-requested visual topics, is authoritative for coverage and publication status. These proposals are not claims that their demonstrations or literature surveys are implemented or fully verified.

| Priority | Article question | Horizontal connection | Signature interactive example | Scope limit |
| --- | --- | --- | --- | --- |
| 1 | **Normalization: what gets centered and rescaled?** | CNNs, recurrent networks, language and vision Transformers | A small tensor with highlighted reduction axes; compare LayerNorm, RMSNorm, BatchNorm, and GroupNorm while changing one input | Separate normalization axes, affine parameters, and training/inference statistics; do not promise universal training stability |
| 2 | **Inference memory: what must a model remember?** | Autoregressive text, image-token and multimodal decoders | Add tokens to a visible KV cache; compare query-head versus KV-head counts and calculate memory | Exact tensor accounting, not invented GPU speed benchmarks; distinguish prefill from decoding |
| 3 | **What is a token outside language?** | Text subwords, image patches, video tubelets, audio frames, discrete latent codes | Step through a fixed input’s grouping, projection, and optional codebook assignment | Patch projection and learned codebook quantization are different operations; illustrative tokenization must be labeled |
| 4 | **Generation order: what gets predicted next?** | Language and visual generation | Animate left-to-right prediction, masked refinement, and coarse-to-fine image scales on a tiny fixed example | Scheduling illustration does not reproduce a trained generator or establish quality equivalence |
| 5 | **Attention computation: same answer, different memory traffic** | Transformer training and inference across modalities | Compute a small exact attention output densely and in tiles; animate reads, writes, and running statistics | FlashAttention is not sparse attention; operation counts are not measured hardware latency |
| 6 | **Conditioning: how does a model receive instructions?** | Text-conditioned vision/audio generation and multimodal models | Trace concatenation, cross-attention, feature modulation, and guidance through a small controlled construction | Distinguish changes to the network from changes to sampling; avoid untrained semantic output claims |
| 7 | **Low-rank adaptation: how can a small update change a large model?** | Language, vision, and diffusion adaptation | Compare a full matrix update with a low-rank factorization; vary rank and inspect reconstruction error | Rank and parameter counts do not by themselves establish downstream task quality |
| 8 | **Quantization: where does precision matter?** | Training and deployment of language and vision models | Quantize a fixed tensor; inspect clipping, scale, outliers, and matrix-output error | Separate weight, activation, and cache quantization; do not substitute error plots for real accuracy evaluation |
| 9 | **Sparse experts: which computation does each token use?** | Conditional computation in language and vision | Route fixed tokens to a small expert bank; inspect top-k choice, capacity, load, and dropped assignments | Toy routing decisions are not learned specialization; distinguish active and total parameters |
| 10 | **Residual paths and gates: how does information survive depth?** | ResNets, Transformers, gated sequence models | Follow a small vector and its derivatives through plain, residual, and gated blocks | A toy Jacobian illustrates a local mechanism, not guaranteed optimization behavior |
| 11 | **Latent bottlenecks: what survives compression?** | Image, audio, and video representation learning and generation | Compare continuous bottlenecks and discrete codebooks on a tiny fixed signal | Distinguish reconstruction error, perceptual quality, and codebook use; learned encoders need real weights or explicit illustrative status |
| 12 | **Training objectives: what signal teaches a representation?** | Autoregressive, masked, contrastive, and denoising learning | Hold a tiny dataset fixed and reveal which targets and gradients each objective supplies | Different objectives are not interchangeable; isolate the mechanism without claiming a winning objective |

## Topic discovery and selection

Launch three short research tasks, bounded by the available agent limit:

1. **Cross-domain scout:** propose mechanisms spanning at least two model families or modalities. For each, identify the shared principle and an important difference that should not be flattened away.
2. **Teaching designer:** propose one concrete interaction and one common misconception per candidate. Reject ideas whose value is primarily a large comparison table or a paper list.
3. **Research skeptic:** check primary-source availability, disputed terminology, overlap with existing articles, and whether the proposed example can demonstrate the claim.

Each scout returns six concise candidates or evaluations. The orchestrator merges duplicates and records the evaluated shortlist in `docs/article-backlog.md` when executing, preserving the full inventory and prior publication status.

Score each candidate from 0–5 on cross-domain usefulness (25%), visual teaching potential (25%), scientific verifiability (20%), distinctive contribution (15%), and implementation feasibility (15%). Record the reason for each score; the weights are editorial choices, not research measurements. Select the best three with varied mechanisms and audiences, rather than three near-identical Transformer variants.

A topic is not ready if it lacks a testable central claim, traceable primary sources, or a useful visualization that can run within this site’s constraints. Move it to the research backlog and choose another.

## Article brief before implementation

For the selected topic, the orchestrator writes a brief under `docs/articles/<slug>.md` containing:

- The reader’s question, prerequisites, and one-sentence outcome.
- Three to five initial constructions or methods, with explicit exclusions.
- A five-step teaching sequence: input, construction, result, controlled comparison, experiment.
- A table mapping each substantive claim to a primary paper section or pinned implementation, equation, test, and visible demonstration.
- A fixed baseline and one counterfactual for every method: what changes, what stays fixed, and what the reader should notice.
- Names, dimensions, units, conventions, and whether quantities are exact, illustrative, or measured.
- Canonical URL, implementation file ownership, and acceptance checks.

Read the relevant full paper sections and official implementations before coding. Search recent primary literature to check terminology and significant revisions; record the review date and source version. Do not use popularity, model-brand association, or an unverified claim of novelty as a substitute for usefulness.

## Subagent implementation workflow

Use at most three concurrent subagents while the orchestrator occupies the fourth slot. Reuse agents between phases. Do not create user-owned chats merely to delegate work.

| Phase | Agent assignments | Orchestrator responsibility |
| --- | --- | --- |
| Specification | Research engineer checks equations and conventions; novice reader challenges the teaching sequence; visualization engineer designs the minimal example | Resolve disagreements and freeze the brief and module interfaces |
| Implementation | Math engineer owns pure calculations and mathematical tests; visualization engineer owns the topic renderer and styles; writer owns lesson data and source notes | Build the page shell, bind controls, and integrate against the agreed interfaces |
| Independent review | Research reviewer checks math and visual semantics; novice reviewer checks comprehension and cognitive load; QA reviewer checks interactions and accessibility | Prefer reviewers who did not author the code under review; assign bounded fixes and reconcile findings |
| Release | Subagents report remaining issues and supporting evidence | Run final checks, update site navigation/metadata, commit and deploy when authorized, verify the published page |

Every assignment must state its inputs, owned files, interfaces, expected output, validation, and stopping condition. Subagents must not change shared navigation, analytics, deployment files, or another agent’s files without coordination. They should report uncertainties and blockers promptly, not fill gaps with plausible formulas. The orchestrator alone integrates shared files and publishes.

Useful assignment templates:

- **Research engineer:** “For `<topic>`, validate the specified constructions against primary sources. Return equations, conventions, counterexamples, independent expected values, and scope limits. Identify any demo that cannot support its lesson.”
- **Math engineer:** “Implement the agreed pure functions in your owned module. Add tests from independently derived examples and invariants. Do not modify UI, analytics, or shared files.”
- **Visualization engineer:** “Implement one dominant visual using the agreed data contract. Show only the current step’s relevant quantities. Support keyboard and touch interaction; disclose exact data without making it the default screen.”
- **Novice reviewer:** “Read as a software engineer new to this topic. Explain where the reader loses the connection between a term, control, and visible change. Suggest the smallest useful fix, not more panels.”
- **Research reviewer:** “Check correctness, misleading geometry, units, boundary behavior, and claims exceeding the simulation. Prioritize defects over optional extensions.”

An agent’s completion message is not proof of correctness. Inspect its changes and evidence. Fix material findings, then rerun only the affected checks. If a construction remains uncertain after focused investigation, exclude it from the implemented scope and disclose it as further reading; do not weaken the article’s core question to make an incomplete page appear finished.

## Visual and editorial contract

Preserve the simple Position Atlas interaction pattern, without copying its positional-encoding terminology into unrelated topics:

- One reading pane and one main visualization. On phones, keep the visual above a scrollable lesson and keep Next/Previous reachable.
- A short introduction per method; one computed takeaway explaining the current result; one focused Explore action.
- Keep equations, notation, detailed settings, sources, and “How to read this view” explanations available on demand.
- Every guided example must actually reach the behavior it claims to teach. A clipping lesson must reach the clipping boundary; a routing lesson must exercise a capacity conflict.
- An experiment starts from a known baseline and changes the intended variable. The first click must visibly do the promised thing. Changing scientific settings should enter Explore so fixed prose cannot contradict the current state.
- Prefer SVG or Canvas. Use 3D only when the concept has meaningful spatial structure; do not turn every abstract vector into a decorative 3D cloud.
- Distinguish model position IDs, activations, weights, probabilities, and illustrative geometry. Label axes and units. Preserve small numerical differences rather than rounding the lesson away.
- Do not add a context builder or unrelated material to Position Atlas. Attention or normalization belongs in its own article where relevant.

## Repository integration

Create each article under `public/<slug>/`. Prefer a small page/controller, pure math module, lesson/source data, and renderer; choose a simpler structure when appropriate. Add focused tests under `tests/`.

The orchestrator owns updates to `public/index.html`, its structured metadata and collection count, `public/sitemap.xml`, relevant navigation, and README. Use one `article.article-row[data-article]` per published article on the homepage. Its script derives the article count and row numbers from these entries; keep the HTML fallback count current too. Companion guides stay inside their parent entry and archived notes remain separate. Add published entries only after their pages pass review; do not put placeholder cards in the public collection.

Reuse the shared consent-based analytics module and measurement configuration. Verify article page identity and page views without duplicate tag initialization. New event labels must be predefined and meaningful, such as completing a lesson or running an experiment; never send arbitrary input, uploaded data, or numeric tensor contents. Preserve browser privacy preferences and the existing policy.

Record the author, publication/update date, source versions, and correction route. Keep reproducible examples and an honest distinction between synthesis and original findings. Traffic is evidence of reach, not evidence that a technical claim is correct; avoid manufactured engagement or unsupported claims about professional impact.

## Release acceptance

An article is complete only when all of the following hold:

1. Its core question is answered through a working example, with primary references and explicit scope.
2. Each implemented method has a meaningful baseline/comparison and a functioning experiment.
3. Independent mathematical tests cover the teaching claims, boundaries, units, and numerical stability; they do not merely duplicate implementation expressions.
4. All guided states and experiment transitions render without errors. Shared-link loading, reset, selection, dialogs, and keyboard focus work.
5. Representative desktop and phone views have been inspected visually, including a narrow screen. Labels remain legible and controls remain reachable.
6. Expert and novice review findings are resolved or clearly excluded from scope. No unresolved issue invalidates the central demonstration.
7. Existing tests still pass; the production build succeeds; shared navigation, metadata, and analytics work.
8. For a publishing run, the repository workflow succeeds and the deployed URL is verified. Capture screenshots outside published assets, stop owned preview servers, and report the URL, validation, and material limitations.

Do not report simulated checks, fabricated benchmarks, a saved screenshot without inspection, or a queued deployment as completed verification. If an external blocker prevents publication, leave the completed local work intact and state the exact blocker.

## Completed first article specification (reference)

Normalization shipped on 2026-11-01. This retained brief is an example, not the next assignment.

**Working title:** Normalization Explained. **Slug:** `normalization`.

**Question:** Which numbers are normalized together, and what does centering change?

Begin with LayerNorm and RMSNorm on a four-component vector. Show the mean, RMS, variance, normalized output, and optional affine transform one step at a time. Compare a constant shift and a positive scale change, with epsilon and affine settings explicit. Then introduce BatchNorm and GroupNorm using a small labeled tensor; the selected reduction axes are the main visual difference. Separate BatchNorm training statistics from stored inference statistics.

Required checks include known numerical outputs, constant and zero inputs, epsilon-sensitive cases, axis/group selection, and affine transforms. Avoid claiming exact scale invariance with finite epsilon. Do not infer real training quality from this small construction.

Deliver the initial four-method reference before adding conditional/adaptive normalization, residual-placement variants, or training diagnostics. Those are follow-ups, not prerequisites for shipping the first article.

## Primary source starting points

These anchors support the initial subject choices. They are not a substitute for the full-section and implementation audit required above.

- [Layer Normalization](https://arxiv.org/abs/1607.06450) and [RMSNorm](https://arxiv.org/abs/1910.07467): starting points for centering, rescaling, and normalization behavior.
- [Batch Normalization](https://arxiv.org/abs/1502.03167) and [Group Normalization](https://arxiv.org/abs/1803.08494): starting points for batch statistics and grouped channel reductions.
- [GQA](https://arxiv.org/abs/2305.13245): query versus key/value head grouping for the inference-memory article.
- [Vision Transformer](https://arxiv.org/abs/2010.11929) and [VQ-VAE](https://arxiv.org/abs/1711.00937): separate image-patch sequences from learned discrete latent representations.
- [FlashAttention](https://arxiv.org/abs/2205.14135): exact attention with a different memory-access schedule.
- [Visual Autoregressive Modeling](https://arxiv.org/abs/2404.02905) and [Large Language Diffusion Models](https://arxiv.org/abs/2502.09992): distinct generation constructions to research, not evidence of universal superiority.

## Launch prompt

Use the following when ready to execute:

> Act as the orchestrator for this repository. Read `docs/article-orchestrator-plan.md`, repository instructions, and the current site. Refresh and rank the horizontal deep-learning article backlog using primary sources. Launch bounded subagents for research, mathematical implementation, visualization/writing, and independent expert/novice review, respecting the available concurrency limit and file ownership. Preserve the visual-learning mission and all reader-requested topics in `docs/article-backlog.md`. Check publication status first: Positional encoding and Normalization are already published. Design the visual experiment before the long explanation. Implement one unpublished article, starting with KV caching / inference memory unless the user or a clearly documented candidate changes that selection. Integrate it into Learn, preserve the existing Position Atlas and consent-based analytics, run the acceptance checks, and publish through the existing GitHub Pages workflow. Continue through implementation and verification rather than stopping at a proposal. Finish with the deployed URL, what readers can learn and manipulate, validation, limitations, and the next two recommended articles. Do not initiate the next article beyond this batch unless requested.
