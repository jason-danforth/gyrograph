// ------------------------------------------Tags-------------------------------------------------------------------------------------------------------------------------------------

/* Tags are, without a doubt, the wonkiest part of this entire project...
Each tag is a reference to a potential placement, or "target". For example, if a Tube 1 has
already been made part of the drawing machine, it can accept new parts in several placements:
there are two identical ends, labeled a and b, and each end can accept geometry along the outside
of the tube (e.g. a Motor 5) or on the inside of the tube (e.g. a Tube 2, Tube 3, or Nib).
The value of each tag is a long string of potential placements that it accepts, so the outside
of a Tube 1 can accept Motor 3 (one placement option), Motor 4 (two placement options), or
Motor 5 (two placement options).

As mentioned above, all of the below tags represent "targets" that can accept additional geometry.
Within the functions that define each part, there are also "source" tags, which define each possible
placement for a given part. Source tags are singular. An example would be "motor4_tube1_a", whice defines
one of two options for placing a Motor 4 part onto a Tube 1. The generate_selection_pairs() function
takes each source tag from a desired part and generates a list of available pairings (such as "motor4_tube1_a"
and tag_tube1_a_outer) so that the user can select a placement. The steps of this process are defined in more
detail within the functions for each individual part (such as tube1(), motor4(), etc.).

Note that the Base geometry does not receive unique tags.
Tubes 2/3 will drop the source axes/guides for their inner placement (i.e. available for Nibs)
when they are placed inside Tube 1, but that logic will need to be updated in order to to also
drop the inner axes/guides if placed in the Base. Otherwise a Nib will be allowed
to be placed in the end of a Tube 2/3 that is already inside the Base.

The alternative, current implementation, is to use the Tube 1 tags for the Base, with the only
drawback being that a Nib can be placed in the Base, which can't draw a line b/c it just rotates
around a single point. */

const tag_tube1_a_outer =
  'motor3_tube1, motor4_tube1_a, motor4_tube1_b, motor5_tube1_a, motor5_tube1_b';
const tag_tube1_a_inner = 'tube2_b_outer, tube3_b_outer, nib_tube1_a';
const tag_tube1_b_outer =
  'motor3_tube1, motor4_tube1_a, motor4_tube1_b, motor5_tube1_a, motor5_tube1_b';
const tag_tube1_b_inner = 'tube2_a_outer, tube3_a_outer, nib_tube1_b';

export const TAG_TUBE1 = {
  tag_tube1_a_outer,
  tag_tube1_a_inner,
  tag_tube1_b_outer,
  tag_tube1_b_inner,
};

const tag_tube2_a_outer =
  'tube1_b_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2';
const tag_tube2_a_inner = 'nib_tube2_a';
const tag_tube2_mid_outer =
  'motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2';
const tag_tube2_b_outer =
  'tube1_a_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2';
const tag_tube2_b_inner = 'nib_tube2_b';

export const TAG_TUBE2 = {
  tag_tube2_a_outer,
  tag_tube2_a_inner,
  tag_tube2_mid_outer,
  tag_tube2_b_outer,
  tag_tube2_b_inner,
};

const tag_tube3_a_outer =
  'tube1_b_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2';
const tag_tube3_a_inner = 'nib_tube2_a';
const tag_tube3_b_outer =
  'tube1_a_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2';
const tag_tube3_b_inner = 'nib_tube2_b';

export const TAG_TUBE3 = {
  tag_tube3_a_outer,
  tag_tube3_a_inner,
  tag_tube3_b_outer,
  tag_tube3_b_inner,
};

const tag_motor1_tube2_a =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2';
const tag_motor1_tube2_b =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1';

export const TAG_MOTOR1 = {
  tag_motor1_tube2_a,
  tag_motor1_tube2_b,
};

const tag_motor2_tube2_a =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2';
const tag_motor2_tube2_b =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2';

export const TAG_MOTOR2 = {
  tag_motor2_tube2_a,
  tag_motor2_tube2_b,
};

const tag_motor3_tube1 = 'tube1_a_outer, tube1_b_outer';
const tag_motor3_tube2_a =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2';
const tag_motor3_tube2_b =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1';

export const TAG_MOTOR3 = {
  tag_motor3_tube1,
  tag_motor3_tube2_a,
  tag_motor3_tube2_b,
};

const tag_motor4_tube1_a = 'tube1_a_outer, tube1_b_outer';
const tag_motor4_tube1_b = 'tube1_a_outer, tube1_b_outer';
const tag_motor4_tube2 =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1';

export const TAG_MOTOR4 = {
  tag_motor4_tube1_a,
  tag_motor4_tube1_b,
  tag_motor4_tube2,
};

const tag_motor5_tube1_a = 'tube1_a_outer, tube1_b_outer';
const tag_motor5_tube1_b = 'tube1_a_outer, tube1_b_outer';
const tag_motor5_tube2 =
  'tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1';

export const TAG_MOTOR5 = {
  tag_motor5_tube1_a,
  tag_motor5_tube1_b,
  tag_motor5_tube2,
};

/* As mentioned above, the thing that makes Nibs complicated is that the Motors are designed to be assymetrical so that it would be obviuos
which way they are going to rotate, but that means the Nibs need a WHOLE LOT of axes/guides to account for all the different lengths of 
the motors, which means the tags are also really complicated... 
The way the other parts work is this: tubes have an A end and a B end, each with one axis. Motors have two axes for each connection, so 
that they can be placed on either end of the tube in a right or left-handed orientation. The Nibs, however, can be placed in either end
of the motor, and each placement has a unique guide too */

const tag_nib_tube1_a = 'tube1_a_inner';
const tag_nib_tube1_b = 'tube1_b_inner';
const tag_nib_tube2_a = 'tube2_a_inner, tube3_a_inner';
const tag_nib_tube2_b = 'tube2_b_inner, tube3_b_inner';
const tag_nib_motors_1 = 'motor1_tube2_b, motor3_tube2_b, motor4_tube2, motor5_tube2'; // Non-rotating motor placements
const tag_nib_motors_2 = 'motor1_tube2_a, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a'; // Rotating motor placements

export const TAG_NIB = {
  tag_nib_tube1_a,
  tag_nib_tube2_a,
  tag_nib_tube2_b,
  tag_nib_motors_1,
  tag_nib_motors_2,
  tag_nib_tube1_b,
};
