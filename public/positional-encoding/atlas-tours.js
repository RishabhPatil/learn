// Five synchronized reading stages per method. The controller owns selection,
// camera state, and parameter changes; prose does not assume hidden mutations.
export const tours = {
  none: [
    { title:'Start with identifiable tokens', body:'The sample has an order and a visible layout before any encoding is applied. Keep those properties separate from the positional information a model is explicitly given.', focus:'source' },
    { title:'Display an index without encoding it', body:'The line assigns a sequence index to each token so we can locate it. For this baseline, those indices are labels for inspection only.', focus:'geometry' },
    { title:'Remove the positional term', body:'There is no added position vector, rotary transformation, or relative-position bias. The empty encoding is the defining feature of this control.', focus:'encoding' },
    { title:'Compare two labeled locations', body:'Tokens A and B can have different displayed indices while receiving no explicit positional representation. Their separation on the screen does not create an encoding.', focus:'compare' },
    { title:'Use this as a reference condition', body:'Explore the tokens, then choose an encoding to see what positional structure it supplies. This baseline makes no claim that all architectures without explicit position embeddings behave identically.', focus:'explore' }
  ],
  sinusoidal: [
    { title:'Begin with the token sequence', body:'Each token will receive a positional vector in addition to its content embedding. If the sample contains an image, its patches enter this construction as an ordered sequence.', focus:'source' },
    { title:'Assign an absolute position', body:'A token’s sequence index p determines its positional vector. Flattening a patch grid supplies one index per patch; it does not preserve separate row and column IDs.', focus:'geometry' },
    { title:'Evaluate sine and cosine channels', body:'Each channel pair contains sin(pθ) and cos(pθ) at a shared frequency. Frequencies decrease across pairs, giving the vector several spatial scales.', focus:'encoding' },
    { title:'Compare the component patterns', body:'The selected tokens produce different values in the same frequency bank. Their phase difference in any pair is their position difference multiplied by that pair’s frequency.', focus:'compare' },
    { title:'Inspect the encoding across scales', body:'Compare different token separations and frequency bases. The component plot shows the positional vector alone, before addition to a token embedding.', focus:'explore' }
  ],
  learned: [
    { title:'Start with tokens that need positions', body:'The sample determines which token occupies each sequence slot. Learned absolute encoding will associate each slot with a trainable vector.', focus:'source' },
    { title:'Use the index as a lookup address', body:'Position p selects row E[p] from a table. The displayed line shows the table addresses, not where the learned vectors lie in embedding space.', focus:'geometry' },
    { title:'Read a position vector', body:'The selected table row is added to the token’s content embedding. There is no required sine–cosine pattern or rotary frequency bank.', focus:'encoding' },
    { title:'Compare two table rows', body:'Tokens A and B retrieve vectors from different rows. Adjacent positions do not have a prescribed vector relationship merely because their indices differ by one.', focus:'compare' },
    { title:'Separate the construction from its weights', body:'Change the example seed to see that the lookup rule does not determine the table values. These reproducible values illustrate the mechanism and are not learned checkpoint weights.', focus:'explore' }
  ],
  shaw: [
    { title:'Start with an ordered pair of tokens', body:'This method describes a token’s position relative to another token. The sample supplies the sequence order from which that signed offset is measured.', focus:'source' },
    { title:'Subtract the two indices', body:'For positions i and j, the operative index is j−i. The line remains a reference layout; it does not become a new absolute embedding space.', focus:'geometry' },
    { title:'Clip the offset and look up a vector', body:'The offset is clipped to the interval from −8 to 8 in this illustration. That clipped value selects a relative-key vector from a learned table.', focus:'encoding' },
    { title:'Inspect what the pair shares', body:'Read the signed offset and the selected vector for A and B. Pairs beyond the clipping distance in the same direction use the same positional vector, even when their raw separations differ.', focus:'compare' },
    { title:'Explore the clipping boundary', body:'Compare short and long separations to see when the selected index stops changing. The plotted table contains example values; the paper’s separate value-relative vectors are outside this illustration.', focus:'explore' }
  ],
  t5: [
    { title:'Begin with relative sequence order', body:'T5’s positional term belongs to a pair of token positions. The sample lets us distinguish both the direction and the size of their separation.', focus:'source' },
    { title:'Turn positions into a signed offset', body:'Subtract the reference index from the comparison index to obtain j−i. Absolute locations are displayed for orientation, but the bucket depends on the relative offset.', focus:'geometry' },
    { title:'Map the offset to a bucket', body:'Short offsets have fine-grained buckets, while larger offsets share logarithmically wider buckets. A learned scalar for the selected bucket supplies the positional bias.', focus:'encoding' },
    { title:'Compare the bucket, then the value', body:'Inspect the bucket chosen for A and B before reading its example scalar. The bucket rule is fixed; the scalar is a parameter that a real model learns.', focus:'compare' },
    { title:'Look for shared relative positions', body:'Compare several distances to find different offsets assigned to one bucket. This example uses 32 bidirectional buckets and illustrative table values, not pretrained T5 weights.', focus:'explore' }
  ],
  alibi: [
    { title:'Start with an earlier-token relationship', body:'ALiBi supplies a positional penalty from sequence distance. In the original causal formulation, the comparison position must be at or before the reference position.', focus:'source' },
    { title:'Measure distance along the sequence', body:'For reference position i and earlier position j, the distance is i−j. ALiBi does not introduce an additional position vector or reshape these coordinates.', focus:'geometry' },
    { title:'Apply a linear positional penalty', body:'The positional term is −m(i−j), where m is a positive head-specific slope. Larger distances produce a more negative term.', focus:'encoding' },
    { title:'Read the penalty for this pair', body:'Compare the index difference with the displayed positional term for A and B. A comparison token after A is outside the original causal domain and receives no substitute symmetric rule here.', focus:'compare' },
    { title:'Vary the slope', body:'Changing the slope changes the penalty per unit distance without changing the token coordinates. This control illustrates one head; it does not reproduce the complete head-slope schedule.', focus:'explore' }
  ],
  rope: [
    { title:'Begin with a sequence of tokens', body:'One-dimensional RoPE starts from one position index per token. Image patches, when present, are flattened into that same sequence.', focus:'source' },
    { title:'Place each token on the index line', body:'The scalar p is the position supplied to the rotary construction. A patch’s row and column do not survive as separate coordinates in this one-dimensional version.', focus:'geometry' },
    { title:'Turn a position into rotation angles', body:'Rotation pair j uses the angle pθⱼ, with θⱼ decreasing across the frequency bank. Each pair rotates within its own two-dimensional channel plane.', focus:'encoding' },
    { title:'Compare relative phase', body:'For two tokens, the rotation difference is (pB−pA)θⱼ. Inspecting another pair changes the frequency and therefore the phase difference for the same token separation.', focus:'compare' },
    { title:'Keep indices and rotated vectors distinct', body:'Explore token pairs and frequency bases to see the phase construction. The scene plots position IDs, while each small circle represents one rotation pair; neither displays trained hidden states.', focus:'explore' }
  ],
  pi: [
    { title:'Keep the sequence, change its position scale', body:'Position Interpolation retains the same tokens and their ordering. Its change is to the position argument supplied to RoPE.', focus:'source' },
    { title:'Compress the position line', body:'Every position is divided by the extension factor s. The tokens occupy a smaller positional span without any token being removed.', focus:'geometry' },
    { title:'Scale every rotary phase uniformly', body:'The angle for pair j becomes (p/s)θⱼ. Equivalently, every original frequency is divided by the same factor.', focus:'encoding' },
    { title:'Compare local phase separation', body:'Two positions now differ in phase by (pB−pA)θⱼ/s. Uniform compression reduces adjacent-token phase differences as well as longer-range ones.', focus:'compare' },
    { title:'Explore the extension factor', body:'Increase s to inspect the trade in positional scale, or set it to one to recover ordinary RoPE. The paper also fine-tunes the model; this illustration performs only the mathematical transformation.', focus:'explore' }
  ],
  yarn: [
    { title:'Keep the original sequence positions', body:'YaRN changes the frequencies used by RoPE while retaining the tokens. The sample’s order and positional IDs provide a common reference before rescaling.', focus:'source' },
    { title:'Leave the index line in place', body:'The token positions themselves are unchanged in this representation. Because different frequencies will be scaled differently, one uniformly compressed line cannot describe the full transform.', focus:'geometry' },
    { title:'Rescale according to frequency', body:'Fast pairs retain their original frequency, slow pairs are interpolated, and a ramp blends the transition. The selected pair reveals which regime it occupies.', focus:'encoding' },
    { title:'Compare the same offset across pairs', body:'The two token IDs determine a fixed positional difference. A fast pair and a slow pair can respond differently to the extension factor because their frequencies receive different scaling.', focus:'compare' },
    { title:'Explore the frequency transformation', body:'Vary the factor and inspect pairs across the spectrum. This demonstration isolates YaRN’s frequency rule and omits its amplitude correction and fine-tuning procedure.', focus:'explore' }
  ],
  axial: [
    { title:'Start with an image patch grid', body:'Each visual token represents a patch containing multiple pixels. Its original row and column are the two coordinates this construction will retain.', focus:'source' },
    { title:'Keep height and width separate', body:'A patch receives the pair (h,w), so its positions form a plane. This two-dimensional encoding supplies neither a text position nor a frame-time coordinate.', focus:'geometry' },
    { title:'Allocate rotations to individual axes', body:'One set of rotation pairs uses width, while the other uses height. In this illustration, the two sets alternate across the frequency strip.', focus:'encoding' },
    { title:'Compare a spatial displacement', body:'For two patches in the same row, only width-driven phases change. For two patches in the same column, only height-driven phases change.', focus:'compare' },
    { title:'Inspect the two axial responses', body:'Compare row and column neighbors to trace which channel pairs respond. Repeated positions in different frames remain identical under this purely spatial construction.', focus:'explore' }
  ],
  mixed: [
    { title:'Begin with the same spatial grid', body:'Mixed RoPE uses each patch’s height and width coordinates. The input grid itself is the same kind of grid used by axial RoPE.', focus:'source' },
    { title:'Preserve the patch coordinates', body:'The patch remains at (h,w); the method does not bend or rotate the position grid. Its change is in how each coordinate contributes to a rotary phase.', focus:'geometry' },
    { title:'Project onto a frequency direction', body:'Each rotation pair uses a two-component frequency vector. The phase fʰh+fʷw can respond to both spatial axes within that single pair.', focus:'encoding' },
    { title:'Compare a displacement along that direction', body:'The phase difference is the dot product of the frequency vector and the patch displacement. A row or column movement can therefore affect the same pair.', focus:'compare' },
    { title:'Explore direction without moving the grid', body:'Rotate the frequency direction and compare the resulting phases. The slider shows an illustrative initialization; the published method learns frequency vectors.', focus:'explore' }
  ],
  mrope: [
    { title:'Start with text and visual tokens', body:'Text supplies an ordered sequence, while visual tokens also have spatial coordinates. A visual token represents a patch or merged patch region rather than an individually encoded pixel.', focus:'source' },
    { title:'Assign temporal, height, and width IDs', body:'Visual positions take the form (s+f,s+h,s+w), with s marking the visual segment’s start. Text uses (p,p,p), placing it on the diagonal of the three-coordinate space.', focus:'geometry' },
    { title:'Divide the rotary pairs into three sections', body:'Contiguous sections of the frequency bank use temporal, height, and width IDs respectively. A tuple therefore drives many rotation pairs rather than becoming a three-dimensional embedding vector.', focus:'encoding' },
    { title:'Compare the axes that changed', body:'Two patches in the same image share a temporal ID but can differ in height or width. Inspect the phase for each axis to connect those coordinate differences to the rotary construction.', focus:'compare' },
    { title:'Explore multimodal coordinate structure', body:'Compare visual patches with text or with patches in another frame. The equal section sizes and simple patch grid here illustrate the construction rather than a checkpoint’s complete tokenization.', focus:'explore' }
  ],
  interleaved: [
    { title:'Use the same multimodal sample', body:'This comparison keeps the same text and visual tokens as the M-RoPE baseline. It isolates a change to frequency allocation rather than introducing another input representation.', focus:'source' },
    { title:'Keep the M-RoPE coordinates', body:'Visual tuples remain (s+f,s+h,s+w), and text retains (p,p,p). The point positions therefore do not explain what changed in this variant.', focus:'geometry' },
    { title:'Interleave the coordinate assignments', body:'Temporal, height, and width assignments repeat across rotation pairs instead of forming contiguous blocks. Each axis consequently appears at several places across the frequency spectrum.', focus:'encoding' },
    { title:'Follow a coordinate into its assigned pairs', body:'The selected patches differ in height, so height-driven pairs change phase while width and temporal pairs do not. Those pairs occupy different frequencies than they do under contiguous M-RoPE allocation.', focus:'compare' },
    { title:'Separate allocation from position design', body:'Compare this method with M-RoPE to isolate channel allocation, or with MRoPE-I to examine spatial reset. This equal-section ablation is not a reproduction of the complete Qwen3-VL pipeline.', focus:'explore' }
  ],
  'mrope-i': [
    { title:'Begin with a visual segment in a sequence', body:'The visual tokens have local rows and columns, while the surrounding text has sequence positions. MRoPE-I combines a spatial-reset convention with an interleaved frequency allocation.', focus:'source' },
    { title:'Reset the visual spatial axes', body:'A visual tuple becomes (s+f,h,w), so height and width start at zero for the segment. Text still uses (p,p,p), and the span reserved before subsequent text is retained.', focus:'geometry' },
    { title:'Distribute all three axes across frequencies', body:'Rotation pairs cycle through temporal, height, and width in this equal-section example. Spatial reset determines the IDs; interleaving determines which ID drives each pair.', focus:'encoding' },
    { title:'Inspect the local spatial difference', body:'For two patches, subtract their height and width IDs to read the local displacement. Their absolute spatial IDs also reveal the reset, which changes their relation to surrounding text positions.', focus:'compare' },
    { title:'Compare reset and allocation separately', body:'Use the interleaved-allocation entry as the comparison without spatial reset. This walkthrough follows the paper’s reset variant; implementations that disable reset use a different position construction.', focus:'explore' }
  ],
  mhrope: [
    { title:'Begin with multiple positional axes', body:'The sample contains visual tokens with temporal and spatial coordinates. Multi-Head RoPE assigns these axes at the head level rather than sharing axes within one head.', focus:'source' },
    { title:'Use spatial-reset coordinates', body:'Visual tokens receive (s+f,h,w), as in the paper’s MRoPE-I variant. The geometry alone does not reveal how whole heads are assigned to those coordinates.', focus:'geometry' },
    { title:'Give one head a complete frequency bank', body:'Every rotary pair in the selected head uses the same positional axis. That axis is represented across the full frequency range of the head.', focus:'encoding' },
    { title:'Compare what this head can distinguish', body:'A temporal-only head gives patches within the same image identical positional phases. A spatial head can distinguish patches only through its assigned height or width coordinate.', focus:'compare' },
    { title:'Explore one axis at a time', body:'Switch the head axis to inspect the three different positional responses. The viewer does not combine trained heads, and Multi-Head RoPE should not be confused with a hierarchical encoding.', focus:'explore' }
  ],
  circle: [
    { title:'Begin with a rectangular patch grid', body:'The source positions form a row–column grid. Circular image projection will assign each patch an angle using both its centered spatial direction and its grid order.', focus:'source' },
    { title:'Project the patches onto a circle', body:'The projected circle lies in a plane perpendicular to the text diagonal. Its center lies on that diagonal, so a fixed text point has equal Euclidean distance to all patches on the circle.', focus:'geometry' },
    { title:'Use the projected coordinates in RoPE', body:'The circle supplies three coordinate streams that drive rotary pairs. Equal geometric distance from a text point does not make those coordinates or their phase differences identical.', focus:'encoding' },
    { title:'Compare patches around the circle', body:'Here A is a text token on the normal axis and B is a patch on the circle. Changing B to another patch preserves their Euclidean distance but can change the coordinate differences and rotary phases.', focus:'compare' },
    { title:'Explore the projection’s scope', body:'Vary the radius and inspect positions around the circle. This example shows CIP; it omits alternating geometry across layers, and its per-frame video circles are a teaching extension.', focus:'explore' }
  ],
  vrope: [
    { title:'Start with a sequence of visual frames', body:'Within each frame, patches have row and column positions. VRoPE will describe those positions through four symmetric spatial directions.', focus:'source' },
    { title:'Construct four directional IDs', body:'The position tuple combines w+h, w−h, −w−h, and −w+h with offsets and a shared frame progression. The three-dimensional scene parameterizes these four IDs; the inspector retains the full tuple.', focus:'geometry' },
    { title:'Interleave the four directional streams', body:'Different rotary pairs receive different directional IDs. All four streams advance together when the frame changes.', focus:'encoding' },
    { title:'Compare the directional changes', body:'The selected patches occupy opposite corners of one frame. Inspect all four ID differences: combining height and width changes some directional streams while canceling in others.', focus:'compare' },
    { title:'Explore symmetry across the frame', body:'Compare opposite corners and corresponding patches in different frames. Keep VRoPE’s four-stream construction distinct from VideoRoPE’s three-coordinate diagonal layout.', focus:'explore' }
  ],
  videorope: [
    { title:'Begin with frames and their patch grids', body:'The source sample separates frame order from each frame’s spatial arrangement. VideoRoPE uses both when constructing temporal, height, and width IDs.', focus:'source' },
    { title:'Advance frame references along the diagonal', body:'Each frame’s reference position lies on the text diagonal, and patch rows and columns become offsets around that reference. The temporal-spacing parameter controls the separation between frame references.', focus:'geometry' },
    { title:'Reserve the slowest pairs for time', body:'Temporal IDs drive the lowest-frequency rotary pairs. Higher-frequency pairs carry interleaved height and width coordinates.', focus:'encoding' },
    { title:'Compare spatial and temporal displacement', body:'Within a frame, patch displacement changes the spatial IDs while the temporal ID stays fixed. Corresponding patches in different frames also reflect the advancing diagonal reference.', focus:'compare' },
    { title:'Explore temporal spacing', body:'Vary frame spacing and inspect the time-driven pairs. This example uses a small equal-section adaptation and the implementation’s floor-centered grid convention.', focus:'explore' }
  ],
  v2pe: [
    { title:'Keep every visual token', body:'A visual segment can contain many tokens even when its information is spatially redundant. V2PE changes their positional increments without removing tokens from the sample.', focus:'source' },
    { title:'Accumulate fractional visual positions', body:'Starting from zero, each text token advances the index by one and each visual token by a smaller chosen increment. The visual run occupies less space on the scalar position line.', focus:'geometry' },
    { title:'Apply ordinary RoPE to fractional IDs', body:'The frequency bank remains one-dimensional RoPE. Only the position argument changes, so visual increments produce smaller phase steps at every frequency.', focus:'encoding' },
    { title:'Compare positions rather than token counts', body:'The selected visual tokens are 15 sequence steps apart, but their positional difference is 15 times the visual increment. With the default increment of one quarter, that difference is 3.75 rather than 15.', focus:'compare' },
    { title:'Explore positional compression', body:'Reduce the visual increment to compress the visual run while retaining its tokens. This demonstration fixes one increment; it does not reproduce the paper’s variable-increment training.', focus:'explore' }
  ],
  'time-mrope': [
    { title:'Start with frames sampled from a timeline', body:'A frame’s ordinal position in a sample need not express when it occurred. Absolute-time MRoPE uses elapsed video time to construct its temporal IDs.', focus:'source' },
    { title:'Convert timestamps into temporal coordinates', body:'The temporal ID is the segment start plus the timestamp multiplied by a ticks-per-time scale. Spatial IDs retain the row and column construction of M-RoPE.', focus:'geometry' },
    { title:'Drive temporal rotations with elapsed time', body:'The temporal section of the rotary frequency bank receives timestamp-based IDs. Height and width sections continue to use spatial IDs.', focus:'encoding' },
    { title:'Separate time differences from spatial differences', body:'Patches within one frame share a temporal ID even when their rows or columns differ. Corresponding patches in distinct frames can have temporal separations determined by unequal elapsed intervals.', focus:'compare' },
    { title:'Explore an irregular timeline', body:'Compare uniform and irregular timestamps, or vary ticks per unit time. This illustration isolates the temporal rule and omits the full model’s temporal patch grouping and special tokens.', focus:'explore' }
  ]
};
