# The Position Atlas: scope and implementation

Reviewed November 1, 2026. The catalog is deliberately extensible and explicitly **not exhaustive**. Twenty teaching configurations currently have source-backed introductions and fixed interactive examples; a separate further-reading queue is not labeled as implemented.

## Three different spaces

1. **Source layout** retains the input patch grids for reference.
2. **Position IDs** displays indices supplied to a positional method, not hidden states. M-RoPE uses `[t,h,w]`, with `h` as row and `w` as column. VRoPE has four directional indices; its 3D display is a labeled invertible parameterization.
3. **Rotary phases** are high-dimensional. The frequency strip and phase wheel show their axis assignments and selected components. Identical 3D geometry can produce different positional kernels.

The renderer uses orthographic projection and a depth-sorted painter's algorithm. Mouse drag and arrow keys orbit; the wheel and +/- zoom. There is no WebGL dependency, external CDN, or model download. Mouse picking chooses a displayed glyph; the token A/B dropdowns and full coordinate table are the exact accessible alternative when glyphs overlap. `Reset view` restores the camera.

## Guided reading

On desktop the left pane holds the scientific narrative and the right pane holds the synchronized construction. Five steps lead from source tokens to IDs, encoding components, a concrete comparison, and free exploration. Previous/Next and the numbered outline select deterministic presets; Restart resets the current method. Free exploration keeps the current settings and reveals all controls. Narrow screens put the explorer above the narrative, with bounded scrollable panels and persistent Previous/Next controls. The visualization header provides a 3D explorer button on every step, plus an Encoding details shortcut when those details are available.

`atlas-tours.js` contains the method-specific narrative. `atlas-walkthrough.js` defines fixed token pairs and component selections; the controller updates the live observation from the actual displayed numbers. It never claims to run a trained model. Arrow keys on the focused step heading navigate the guide; arrow keys on the canvas continue to orbit the scene. Links include zero-based `step`; older configuration links without this field open the free explorer.

The interaction pattern is inspired by [Brendan Bycroft’s LLM Visualization](https://bbycroft.net/llm); no architecture-inference code is imported from that project.

## Reference and examples

Each method has a short introduction and a five-step narrative. Expand “Method notes & primary sources” for the full scientific introduction, equations, notation, primary-source citations, and the distinction between the published construction and the example. The notes live in `public/positional-encoding/atlas-reference.js`; method metadata and scope live in `public/positional-encoding/atlas-data.js`.

Fixed presets provide text, text plus one image, three video frames, or two interleaved images. All visuals use a 4×4 patch grid over a locally generated 48×48 texture. There is no context builder, editable prompt, image upload, or model tokenizer. Two-dimensional vision methods exclude text and ignore frame order. Text examples are disabled for vision-only methods.

## Displayed quantities

The atlas displays position IDs, coordinate differences, Euclidean distance in the plotted space, frequency assignments, and rotary phases. Sinusoidal and learned absolute entries show position-vector components. Shaw displays an illustrative clipped-offset vector; T5 displays a signed bucket and illustrative scalar; ALiBi displays its raw causal positional bias, with later comparison positions marked outside the causal domain.

There are no attention distributions, content modes, masks, temperature controls, or model inference. Token A/B labels specify a positional comparison. A phase cosine is a geometric quantity for one rotation pair, not a model attention weight. MHRoPE displays one selected head’s positional axis at a time.

Configuration links include only encoding and fixed-example settings. JSON exports include IDs, phases, additive components, and relative terms, with sources and scope notes. No user text or images are collected.

## Source conventions and deliberate simplifications

| Method | Convention used here | Primary implementation/paper |
| --- | --- | --- |
| M-RoPE | Visual IDs `(start+frame,start+row,start+column)`; subsequent text starts after maximum ID. | [Qwen2-VL](https://arxiv.org/abs/2409.12191), [pinned HF code](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/models/qwen2_vl/modeling_qwen2_vl.py) |
| Interleaved allocation | Isolates interleaving with unchanged baseline geometry; does not claim to implement the whole Qwen3 video pipeline. | [Qwen3-VL pinned implementation](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/models/qwen3_vl/modeling_qwen3_vl.py) |
| MRoPE-I / MHRoPE | Paper spatial reset `(start+frame,row,column)`, preserving unreset segment extent for following text. Equal thirds of pairs or selected full-spectrum head. | [Paper](https://arxiv.org/html/2510.23095v1), [authors' spatial-reset implementation](https://github.com/JJJYmmm/Multimodal-RoPEs/blob/main/multimodal_ropes/pos_design/mrope_i.py) |
| Circle-RoPE | CIP with 50/50 mixed angle, adjustable fixed radius, circle normal `(1,1,1)`. Text and image centers use a diagonal sequence. AGE alternation not simulated; per-frame circles are a teaching extension. | [v3 paper](https://arxiv.org/html/2505.16416v3), [authors' code](https://github.com/lose4578/CircleRoPE/blob/main/code/circle_rope.py) |
| VRoPE | Paper four-direction ordering, frame advance `H+W−1`. Plot `(frame center, centered row, centered column)`, expose four IDs. | [v2 paper](https://arxiv.org/html/2502.11664v2) |
| VideoRoPE | Floor-centered row/column offsets around frame time; text resumes at last temporal ID + 1. Spatial pairs interleaved, temporal pairs use low frequencies. | [Paper](https://arxiv.org/html/2502.05173v1), [official implementation](https://github.com/Wiselnn570/VideoRoPE/blob/main/videorope-transformer/modeling_videorope.py) |
| YaRN | Frequency-ramp construction, original length 128, beta-fast 32, beta-slow 1; the frequency construction is shown; the full method’s magnitude correction is described but not simulated. | [Paper](https://arxiv.org/html/2309.00071v2), [pinned HF code](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/modeling_rope_utils.py) |
| V2PE | First position zero; each subsequent text token adds 1, each visual token adds the selected fractional increment. | [Paper §3.2](https://arxiv.org/html/2412.09616v2) |

All rotary examples use 24 pairs / 48 dimensions for inspectability. The three-axis examples use equal allocations to isolate mechanisms. These are **not** released checkpoint ratios. For example Qwen2-VL commonly uses `[16,24,24]` pairs and a Qwen3-VL interleaved configuration uses `[24,20,20]`; unequal interleaving must preserve global pair frequencies and its appropriate tail assignment. Do not generalize `j % 3` to arbitrary unequal checkpoint sections.

Learned absolute, Shaw, and T5 values are deterministic example tables, not learned checkpoint parameters. The 2D mixed RoPE directions are illustrative initializations. Context-extension demos transform indices/frequencies; they do not run finetuning or establish benchmark improvements. Equal Circle-RoPE Euclidean distances do not imply equal trained attention, nor preservation of every original image-grid distance.

## Adding a method

1. Read a primary source and, when available, its official implementation. Record version-specific behavior.
2. Add a source-linked catalog entry in `public/positional-encoding/atlas-data.js` and a scientific introduction in `public/positional-encoding/atlas-reference.js`, with explicit scope and limitations.
3. Implement coordinate, phase, vector, or positional-bias behavior in `public/positional-encoding/atlas-math.js`. Keep encoding quantities separate from model inference.
4. Add independent mathematical checks: boundary cases, expected coordinates, components, and invariants from the construction.
5. Add a method-specific walkthrough and verify its selected examples. Add only necessary parameter controls. Do not draw a new geometry when a method changes frequencies or positional biases alone.
6. Verify fixed image/video/text examples in the browser, including keyboard operation and mobile layout.
7. If the exact construction is not yet checked, keep it in `furtherReading`, not the implemented selector.

Tests run with `npm test`; build and GitHub Pages deployment use the existing pipeline.
